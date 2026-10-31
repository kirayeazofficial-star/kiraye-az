import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, LayoutList, MessageCircle } from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import FavoriteGrid from "../../components/FavoriteGrid";
import UserAvatar from "../../components/UserAvatar";
import { hostQuery } from "../../../lib/host/db";
import { publicPoint } from "../../../lib/location";
import { publicMonthYear } from "../../../lib/public-date";
import type { Listing } from "../../../lib/marketplace";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

// Public page of a listing owner: name, since when on the site, how fast they answer, and their listings.
async function seller(id: string) {
  if (!uuid.test(id)) return null;
  const rows = await hostQuery<{ name: string | null; avatar_url: string | null; joined: string }>(`select p.display_name as name,p.avatar_url,u.created_at::text as joined from auth.users u left join public.profiles p on p.id=u.id where u.id=$1 and u.disabled_at is null`, [id]);
  if (!rows[0]) return null;
  const listings = await hostQuery<Listing>(`select * from public.listings where owner_id=$1 and status='published' and deleted_at is null and (expires_at is null or expires_at>now()) order by created_at desc limit 60`, [id]);
  // Median time to the first answer in conversations of the last 90 days.
  const reply = await hostQuery<{ asked: string; replied: string; median: number | null }>(`with firsts as (
      select t.id,min(m.created_at) filter (where m.author_id<>$1) as asked,min(m.created_at) filter (where m.author_id=$1) as answered
      from public.chat_threads t join public.chat_messages m on m.thread_id=t.id where t.seller_id=$1 and t.created_at>now()-interval '90 days' group by t.id)
    select count(*) filter (where asked is not null)::text as asked,count(*) filter (where answered>asked)::text as replied,
      percentile_cont(0.5) within group (order by extract(epoch from answered-asked)) filter (where answered>asked) as median from firsts`, [id]).catch(() => []);
  return { ...rows[0], listings: listings.map(item => ({ ...item, ...publicPoint(item) })), reply: reply[0] };
}
const answerTime = (seconds: number) => seconds < 3600 ? "1 saat ərzində" : seconds < 3 * 3600 ? "bir neçə saat ərzində" : seconds < 86400 ? "bir gün ərzində" : "bir neçə gün ərzində";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await seller((await params).id).catch(() => null);
  return { title: data ? `${data.name || "Elan sahibi"} — elanları | kirayeal.az` : "Elan sahibi | kirayeal.az", robots: { index: false } };
}

export default async function SellerPage({ params }: Props) {
  const data = await seller((await params).id).catch(() => null);
  if (!data) notFound();
  const asked = Number(data.reply?.asked || 0), replied = Number(data.reply?.replied || 0);
  const rate = asked >= 2 ? Math.round(replied / asked * 100) : null;
  return <>
    <Header />
    <main className="wrap kzSellerPage">
      <p className="breadcrumb"><Link href="/">Ana səhifə</Link> / Elan sahibi</p>
      <section className="kzSellerHead">
        <UserAvatar src={data.avatar_url} name={data.name || "E"} className="kzSellerAvatar" />
        <div>
          <h1>{data.name || "Elan sahibi"}</h1>
          <ul className="kzSellerFacts">
            <li><CalendarDays aria-hidden="true" size={16} strokeWidth={2} />{publicMonthYear(data.joined)} tarixindən saytdadır</li>
            <li><LayoutList aria-hidden="true" size={16} strokeWidth={2} />{data.listings.length} aktiv elan</li>
            {rate !== null && <li><MessageCircle aria-hidden="true" size={16} strokeWidth={2} />Mesajların {rate}%-nə cavab verir</li>}
            {rate !== null && data.reply?.median != null && replied >= 2 && <li><Clock aria-hidden="true" size={16} strokeWidth={2} />Adətən {answerTime(Number(data.reply.median))} cavab verir</li>}
          </ul>
        </div>
      </section>
      <h2 className="kzSellerTitle">Elanları</h2>
      {data.listings.length ? <FavoriteGrid items={data.listings} /> : <p className="kzNotice">Hazırda aktiv elanı yoxdur.</p>}
    </main>
    <Footer />
  </>;
}
