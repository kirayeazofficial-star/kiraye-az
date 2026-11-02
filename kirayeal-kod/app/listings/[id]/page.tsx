import { categoryName } from "../../../lib/marketplace";
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarX, Clock, CloudOff, House, RotateCw, Trash2 } from "lucide-react";
import StatusCard from "../../components/StatusCard";
import QuickCategories from "../../components/QuickCategories";
import { notFound } from "next/navigation";
import StructuredData from "../../components/StructuredData";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ListingDetails from "../../components/ListingDetails";
import { getPublicListing } from "../../../lib/public-listing";
import { shareImagePath } from "../../../lib/share-image";
import { publicSiteUrl } from "../../../lib/site-url";
import { currentUser } from "../../../lib/host/session";
import { isStaff } from "../../../lib/host/staff";
import { hostQuery } from "../../../lib/host/db";
import { statusName, type Listing } from "../../../lib/marketplace";
import { money, periodName } from "../../../lib/marketplace";
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { item } = await getPublicListing(id);
  return item
    ? {
        title: `${item.title} — kirayə ${item.city}, ${money(item.price)} ₼/${periodName(item.rental_period)} | kirayeal.az`,
        description: `${categoryName(item.category)} kirayəsi, ${item.city}: ${item.title}. ${money(item.price)} ₼/${periodName(item.rental_period)}. ${item.description.replace(/\s+/g, " ").slice(0, 110)}`.slice(0, 300),
        alternates: { canonical: `${publicSiteUrl()}/listings/${item.id}` },
        robots: item.demo ? { index: false, follow: false } : undefined,
        openGraph: {
          title: item.title,
          description: `${money(item.price)} ₼/${periodName(item.rental_period)} · ${item.city}`,
          images: item.images?.[0]?.startsWith("https://")
            ? [item.images[0]]
            : item.images?.[0]?.startsWith("/api/media/")
              ? [`${publicSiteUrl()}${await shareImagePath(item.images[0])}`]
              : [`${publicSiteUrl()}/og-default.jpg`],
        },
      }
    : { title: "Elan | kirayeal.az", robots: { index: false } };
}
export default async function ListingPage({ params }: Props) {
  const { id } = await params;
  const result = await getPublicListing(id);
  const unavailable = result.unavailable;
  let item = result.item;
  // A listing that isn't public (pending, rejected, expired…) stays visible to its owner and to staff, with its status shown.
  const preview = !item && !unavailable ? await privateListing(id) : null;
  if (preview) item = preview;
  // Others get a soft note while a listing waits for review; deleted or expired ones stay "not active".
  if (!item && !unavailable) {
    const gone = await goneListing(id);
    if (!gone) notFound();
    return <>
      <Header />
      <main className="kzScPage">{statusFor(gone)}</main>
      <Footer />
    </>;
  }
  return (
    <>
      <Header />
      <main className="wrap listingDetailPage">
        <p className="breadcrumb">
          <Link href="/">Ana səhifə</Link>{item ? <> / {categoryName(item.category)}</> : null}
        </p>
        {preview && <p className={`kzPreviewNote ${preview.status}`} role="status"><strong>{preview.deleted_at ? "Silinib" : statusName(preview.status)}</strong> · {preview.status === "pending" && !preview.deleted_at ? "Təsdiqdən sonra hamıya görünəcək. İndi yalnız elan sahibi və adminlər görür." : "Bu elan hamıya görünmür. Yalnız elan sahibi və adminlər görür."}</p>}
        {item ? (
          <ListingDetails item={item} />
        ) : (
          <StatusCard tone="danger" icon={CloudOff} badge="Texniki xəta" title="Elanı yükləmək mümkün olmadı"
            lead="Texniki səbəbdən elan hazırda açılmır. Bir neçə saniyədən sonra səhifəni yeniləyin."
            actions={[{ href: `/listings/${id}`, label: "Səhifəni yenilə", icon: RotateCw, primary: true }, { href: "/", label: "Elanlara qayıt", icon: House }]} />
        )}
      </main>
      <Footer />
      {item && !preview && <StructuredData data={{"@context":"https://schema.org","@type":"Product",name:item.title,description:item.description.slice(0,500),url:`${publicSiteUrl()}/listings/${item.id}`,category:categoryName(item.category),...(item.images?.[0]?{image:[item.images[0].startsWith("/")?`${publicSiteUrl()}${item.images[0]}`:item.images[0]]}:{}),offers:{"@type":"Offer",price:Number(item.price),priceCurrency:"AZN",availability:"https://schema.org/InStock",businessFunction:"http://purl.org/goodrelations/v1#LeaseOut",areaServed:item.city,url:`${publicSiteUrl()}/listings/${item.id}`}}}/>}
      {item && !preview && <StructuredData data={{"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"kirayeal.az",item:publicSiteUrl()},{"@type":"ListItem",position:2,name:item.title,item:`${publicSiteUrl()}/listings/${item.id}`}]}}/>}
    </>
  );
}

async function privateListing(id: string): Promise<Listing | null> {
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) return null;
  try {
    const user = await currentUser();
    if (!user) return null;
    const rows = await hostQuery<Listing & { deleted_at?: string | null }>(`select l.*,p.created_at::text seller_since from public.listings l left join public.profiles p on p.id=l.owner_id where l.id=$1 limit 1`, [id]);
    const row = rows[0];
    if (!row || (row.owner_id !== user.id && !(await isStaff(user)))) return null;
    return row;
  } catch { return null; }
}

type Gone = { kind: "review" | "expired" | "deleted" | "inactive"; title: string; category: string };
// Why a listing is not public: waiting for review, expired, deleted by its owner, or otherwise closed (rejected, blocked).
async function goneListing(id: string): Promise<Gone | null> {
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) return null;
  try {
    const rows = await hostQuery<{ status: string; title: string; category: string; deleted_at: string | null; payment_required: boolean | null; expires_at: string | null }>(`select status,title,category,deleted_at,payment_required,expires_at from public.listings where id=$1 limit 1`, [id]);
    const row = rows[0];
    if (!row) return null;
    const kind = row.deleted_at ? "deleted" : row.status === "pending" && !row.payment_required ? "review" : ["expired", "archived"].includes(row.status) || (row.status === "published" && !!row.expires_at && Date.parse(row.expires_at) <= Date.now()) ? "expired" : "inactive";
    return { kind, title: row.title, category: row.category };
  } catch { return null; }
}
function statusFor(gone: Gone) {
  const more = { href: "/", label: "Digər elanlara bax", icon: House, primary: true };
  const chips = <><p className="kzScSub">Bu kateqoriyada digər elanlar</p><QuickCategories only={gone.category} /></>;
  if (gone.kind === "review") return <StatusCard tone="info" icon={Clock} badge="Yoxlamadadır" title="Bu elan hazırda yoxlamadadır"
    lead="Elan moderatorlar tərəfindən yoxlanılır. Yoxlama başa çatdıqdan sonra elan bu keçiddə hamı üçün görünəcək." actions={[more]} />;
  if (gone.kind === "expired") return <StatusCard tone="warn" icon={CalendarX} badge="Müddəti bitib" title="Bu elanın müddəti bitib"
    lead={<>«<b>{gone.title}</b>» elanının yayım müddəti başa çatıb və elan artıq aktiv deyil.</>} actions={[more]}>{chips}</StatusCard>;
  if (gone.kind === "deleted") return <StatusCard tone="warn" icon={Trash2} badge="Elan silinib" title="Bu elan silinib"
    lead="Elan sahibi tərəfindən silinib və artıq aktiv deyil." actions={[more]}>{chips}</StatusCard>;
  return <StatusCard tone="warn" icon={CalendarX} badge="Elan aktiv deyil" title="Bu elan artıq aktiv deyil"
    lead="Bu elan hazırda saytda yayımlanmır." actions={[more]}>{chips}</StatusCard>;
}
