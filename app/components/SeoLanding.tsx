import Link from "next/link";
import Header from "./Header";
import Footer from "./Footer";
import ListingCard from "./ListingCard";
import StructuredData from "./StructuredData";
import { seoCategories, type SeoCategorySlug } from "../../lib/seo-categories";
import { seoCities, type SeoCitySlug } from "../../lib/seo-cities";
import { categoryListings } from "../../lib/seo-listings";
import { publicSiteUrl } from "../../lib/site-url";

export function landingCopy(landing: SeoCategorySlug, city?: SeoCitySlug) {
  const page = seoCategories[landing], place = city ? seoCities[city] : null;
  const title = place ? `${page.title} ${place.name}` : page.title;
  const description = place ? `${place.in} ${page.title.toLowerCase()} elanları: günlük, həftəlik və aylıq təkliflər, qiymətlər və sahibi ilə birbaşa əlaqə.` : page.description;
  return { page, place, title, description, path: place ? `/${landing}/${city}` : `/${landing}` };
}

export default async function SeoLanding({ landing, city }: { landing: SeoCategorySlug; city?: SeoCitySlug }) {
  const { page, place, title, description, path } = landingCopy(landing, city);
  const { items, unavailable } = await categoryListings(page.category, place?.name);
  const base = publicSiteUrl();
  const crumbs = [{ name: "kirayeal.az", item: base }, { name: page.title, item: `${base}/${landing}` }, ...(place ? [{ name: title, item: `${base}${path}` }] : [])];
  return <>
    <Header />
    <main className="wrap seoCatalog">
      <nav className="breadcrumb" aria-label="Səhifə yolu"><Link href="/">Ana səhifə</Link> / {place ? <><Link href={`/${landing}`}>{page.title}</Link> / {place.name}</> : page.title}</nav>
      <h1>{title}</h1>
      <p className="seoIntro">{description}</p>
      <nav className="kzSeoCities" aria-label="Şəhərlər">
        {(Object.keys(seoCities) as SeoCitySlug[]).map(slug => <Link key={slug} href={`/${landing}/${slug}`} aria-current={slug === city ? "page" : undefined}>{seoCities[slug].name}</Link>)}
      </nav>
      <h2>{place ? `${place.in} son elanlar` : "Son kirayə elanları"}</h2>
      {items.length ? <div className="kzGrid">{items.map(item => <ListingCard key={item.id} item={item} />)}</div>
        : <p className="kzNotice">{unavailable ? "Məlumatları yükləmək mümkün olmadı. Yenidən cəhd edin." : "Bu bölmədə hələ elan yoxdur."} <Link href="/new">Elan yerləşdir</Link></p>}
      <p><Link className="kzButtonGhost" href={`/?category=${page.category}#elanlar`}>Bütün filtrlərlə axtar</Link></p>
      <section className="seoGuidance"><h2>{page.title} seçərkən nəyə baxmalı?</h2><p>{page.intro}</p></section>
    </main>
    <Footer />
    <StructuredData data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: title, description, url: `${base}${path}`, inLanguage: "az-AZ", mainEntity: { "@type": "ItemList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, url: `${base}/listings/${item.id}`, name: item.title })) } }} />
    <StructuredData data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, ...crumb })) }} />
  </>;
}
