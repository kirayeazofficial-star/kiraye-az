import { categoryName } from "../../../lib/marketplace";
import type { Metadata } from "next";
import Link from "next/link";
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
    if (!(await waitingForReview(id))) notFound();
    return <>
      <Header />
      <main className="wrap listingDetailPage">
        <section className="empty"><h1>Bu elan yoxlamadadır</h1><p>Tezliklə açılacaq. Bir az sonra yenidən baxın.</p><Link className="add" href="/">Digər elanlara bax</Link></section>
      </main>
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
          <section className="empty">
            <h1>Elanı yükləmək mümkün olmadı</h1>
            <p>Bağlantını yoxlayıb səhifəni yenilə.</p>
            <Link className="add" href="/">
              Elanlara qayıt
            </Link>
          </section>
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

async function waitingForReview(id: string): Promise<boolean> {
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) return false;
  try {
    const rows = await hostQuery<{ id: string }>(`select id from public.listings where id=$1 and status='pending' and deleted_at is null and not coalesce(payment_required,false) limit 1`, [id]);
    return !!rows[0];
  } catch { return false; }
}
