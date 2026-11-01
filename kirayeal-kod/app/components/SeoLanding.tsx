import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";
import FavoriteGrid from "./FavoriteGrid";
import StructuredData from "./StructuredData";
import { seoCategories, type SeoCategorySlug } from "../../lib/seo-categories";
import { mainCities, otherCities, seoCities, seoDistricts, type SeoCitySlug } from "../../lib/seo-cities";
import { categoryListings } from "../../lib/seo-listings";
import { publicSiteUrl } from "../../lib/site-url";

export function landingCopy(landing: SeoCategorySlug, city?: SeoCitySlug, district?: string) {
  const page = seoCategories[landing], place = city ? seoCities[city] : null, area = district ? seoDistricts[district] : null;
  const title = area ? `${page.title} — ${area.label}, Bakı` : place ? `${page.title} — ${place.name}` : page.title;
  const where = area ? `Bakının ${area.in}` : place?.in;
  const description = where ? `${where} ${page.title.toLowerCase()}: günlük, həftəlik və aylıq təkliflər, qiymətlər və sahibi ilə birbaşa əlaqə.` : page.description;
  return { page, place, area, title, description, path: area ? `/${landing}/${city}/${district}` : place ? `/${landing}/${city}` : `/${landing}` };
}

export default async function SeoLanding({ landing, city, district }: { landing: SeoCategorySlug; city?: SeoCitySlug; district?: string }) {
  const { page, place, area, title, description, path } = landingCopy(landing, city, district);
  const { items, unavailable } = await categoryListings(page.category, place?.name, area?.name);
  const others = otherCities;
  const base = publicSiteUrl();
  const crumbs = [{ name: "kirayeal.az", item: base }, { name: page.title, item: `${base}/${landing}` }, ...(place ? [{ name: place.name, item: `${base}/${landing}/${city}` }] : []), ...(area ? [{ name: area.label, item: `${base}${path}` }] : [])];
  return <>
    <Header />
    <main className="wrap seoCatalog">
      <nav className="breadcrumb" aria-label="Səhifə yolu"><Link href="/">Ana səhifə</Link> / {place ? <><Link href={`/${landing}`}>{page.title}</Link> / {area ? <><Link href={`/${landing}/${city}`}>{place.name}</Link> / {area.label}</> : place.name}</> : page.title}</nav>
      <h1>{title}</h1>
      <p className="seoIntro">{description}</p>
      <nav className="kzSeoCities" aria-label="Şəhərlər">
        {mainCities.map(slug => <Link key={slug} href={`/${landing}/${slug}`} aria-current={slug === city && !area ? "page" : undefined}>{seoCities[slug].name}</Link>)}
        {city && !mainCities.includes(city) && <Link href={`/${landing}/${city}`} aria-current="page">{seoCities[city].name}</Link>}
      </nav>
      {city === "baki" && <nav className="kzSeoCities kzSeoDistricts" aria-label="Bakının rayonları">
        {Object.keys(seoDistricts).map(slug => <Link key={slug} href={`/${landing}/baki/${slug}`} aria-current={slug === district ? "page" : undefined}>{seoDistricts[slug].name}</Link>)}
      </nav>}
      <details className="kzSeoMore"><summary>Digər şəhər və rayonlar</summary><nav aria-label="Digər şəhərlər">{others.map(slug => <Link key={slug} href={`/${landing}/${slug}`}>{seoCities[slug].name}</Link>)}</nav></details>
      <h2>{area ? `${area.name} rayonunda son elanlar` : place ? `${place.in} son elanlar` : "Son kirayə elanları"}</h2>
      {items.length ? <FavoriteGrid items={items} />
        : <p className="kzNotice">{unavailable ? "Məlumatları yükləmək mümkün olmadı. Yenidən cəhd edin." : "Bu bölmədə hələ elan yoxdur."} <Link href="/new">Elan yerləşdir</Link></p>}
      <p><Link className="kzButtonGhost kzIconBtn" href={page.category ? `/?category=${page.category}#elanlar` : "/#elanlar"}><SlidersHorizontal aria-hidden="true" size={16} strokeWidth={2} />Bütün filtrlərlə axtar</Link></p>
      <section className="seoGuidance"><h2>{page.title} seçərkən nəyə baxmalı?</h2><p>{page.intro}</p></section>
    </main>
    <Footer />
    <StructuredData data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: title, description, url: `${base}${path}`, inLanguage: "az-AZ", mainEntity: { "@type": "ItemList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, url: `${base}/listings/${item.id}`, name: item.title })) } }} />
    <StructuredData data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, ...crumb })) }} />
  </>;
}
