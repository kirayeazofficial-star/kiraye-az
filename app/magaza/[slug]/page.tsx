import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Clock, MapPin } from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import StoreListings from "../../components/StoreListings";
import StorePhone from "../../components/StorePhone";
import { storeOpenState } from "../../../lib/store-hours";
import { hostQuery } from "../../../lib/host/db";
import { currentUser } from "../../../lib/host/session";
import { isStaff } from "../../../lib/host/staff";
import { publicPoint } from "../../../lib/location";
import { publicSiteUrl } from "../../../lib/site-url";
import type { Listing } from "../../../lib/marketplace";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> };
type Store = { owner_id: string; slug: string; name: string; description: string; logo_url: string | null; cover_url: string | null; phone: string; address: string; hours: string; open_from: string | null; open_to: string | null; views: number };

// A store's page on kirayeal.az: logo, details and all its active listings.
async function load(slug: string, preview = false) {
  if (!/^[a-z0-9][a-z0-9-]{2,40}$/.test(slug)) return null;
  const rows = await hostQuery<Store>(`select s.owner_id,s.slug,s.name,s.description,s.logo_url,s.cover_url,s.phone,s.address,s.hours,s.open_from,s.open_to,(select count(*)::int from public.listing_views v join public.listings l on l.id=v.listing_id where l.owner_id=s.owner_id) as views from public.stores s join auth.users u on u.id=s.owner_id
    where s.slug=$1 and (${preview ? "true" : "s.status='active' and s.active_until>now()"}) and u.disabled_at is null`, [slug]);
  if (!rows[0]) return null;
  const listings = await hostQuery<Listing>(`select * from public.listings where owner_id=$1 and status='published' and deleted_at is null and (expires_at is null or expires_at>now()) order by created_at desc limit 120`, [rows[0].owner_id]);
  return { store: rows[0], listings: listings.map(item => ({ ...item, ...publicPoint(item), store: { name: rows[0].name, slug: rows[0].slug, logo_url: rows[0].logo_url } })) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load((await params).slug).catch(() => null);
  if (!data) return { title: "Mağaza | kirayeal.az", robots: { index: false } };
  return { title: `${data.store.name} — kirayə | kirayeal.az`, description: (data.store.description || `${data.store.name} mağazasının kirayə elanları`).slice(0, 160), alternates: { canonical: `${publicSiteUrl()}/magaza/${data.store.slug}` }, openGraph: data.store.logo_url ? { images: [`${publicSiteUrl()}${data.store.logo_url}`] } : undefined };
}

export default async function StorePage({ params, searchParams }: Props) {
  // Staff can open a store that is not active yet (application) to see how it will look.
  const user = (await searchParams).preview ? await currentUser().catch(() => null) : null;
  const preview = !!user && await isStaff(user).catch(() => false);
  const data = await load((await params).slug, preview).catch(() => null);
  if (!data) notFound();
  const { store, listings } = data, phone = store.phone.replace(/[^\d+]/g, ""), open = storeOpenState(store.open_from, store.open_to);
  return <>
    <Header />
    <main className="wrap kzStorePage">
      <p className="breadcrumb"><Link href="/">Ana səhifə</Link> / Mağazalar</p>
      {preview && <p className="kzStorePreview" role="status">Önizləmə: mağaza aktiv olmayanda bu səhifəni yalnız administrasiya görür.</p>}
      <section className="kzStoreHero">
        <div className="kzStoreCover">{store.cover_url ? <img src={store.cover_url} alt="" /> : <span aria-hidden="true">{store.name}</span>}</div>
        <div className="kzStoreHeroBody">
          <span className="kzStoreHeroLogo">{store.logo_url ? <img src={store.logo_url} alt="" /> : <b>{store.name.charAt(0).toUpperCase()}</b>}</span>
          <div className="kzStoreHeroText">
            <h1>{store.name} <span className="kzStoreBadge"><BadgeCheck aria-hidden="true" size={14} strokeWidth={2.4} />Mağaza</span></h1>
            <p className="kzStoreStats">{listings.length} elan · {store.views} baxış</p>
            {store.description && <p>{store.description}</p>}
            <ul className="kzStoreMeta">
              {store.address && <li><MapPin aria-hidden="true" size={16} strokeWidth={2} />{store.address}</li>}
              {open ? <li className={open.open ? "open" : "closed"}><Clock aria-hidden="true" size={16} strokeWidth={2} />{open.text}</li> : store.hours ? <li><Clock aria-hidden="true" size={16} strokeWidth={2} />{store.hours}</li> : null}
            </ul>
          </div>
          {phone.length >= 9 && <StorePhone phone={phone} />}
        </div>
      </section>
      {listings.length ? <StoreListings name={store.name} items={listings} /> : <p className="kzNotice">Hazırda aktiv elan yoxdur.</p>}
    </main>
    <Footer />
  </>;
}
