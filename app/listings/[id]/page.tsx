import { categoryName } from "../../../lib/marketplace";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StructuredData from "../../components/StructuredData";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ListingDetails from "../../components/ListingDetails";
import { getPublicListing } from "../../../lib/public-listing";
import { publicSiteUrl } from "../../../lib/site-url";
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
              ? [`${publicSiteUrl()}${item.images[0]}`]
              : [`${publicSiteUrl()}/og-default.jpg`],
        },
      }
    : { title: "Elan | kirayeal.az", robots: { index: false } };
}
export default async function ListingPage({ params }: Props) {
  const { id } = await params;
  const { item, unavailable } = await getPublicListing(id);
  if (!item && !unavailable) notFound();
  return (
    <>
      <Header />
      <main className="wrap listingDetailPage">
        <p className="breadcrumb">
          <Link href="/">Ana səhifə</Link>{item ? <> / {categoryName(item.category)}</> : null}
        </p>
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
      {item && <StructuredData data={{"@context":"https://schema.org","@type":"Product",name:item.title,description:item.description.slice(0,500),url:`${publicSiteUrl()}/listings/${item.id}`,category:categoryName(item.category),...(item.images?.[0]?{image:[item.images[0].startsWith("/")?`${publicSiteUrl()}${item.images[0]}`:item.images[0]]}:{}),offers:{"@type":"Offer",price:Number(item.price),priceCurrency:"AZN",availability:"https://schema.org/InStock",businessFunction:"http://purl.org/goodrelations/v1#LeaseOut",areaServed:item.city,url:`${publicSiteUrl()}/listings/${item.id}`}}}/>}
      {item && <StructuredData data={{"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"kirayeal.az",item:publicSiteUrl()},{"@type":"ListItem",position:2,name:item.title,item:`${publicSiteUrl()}/listings/${item.id}`}]}}/>}
    </>
  );
}
