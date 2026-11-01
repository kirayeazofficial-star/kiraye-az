import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoLanding, { landingCopy } from "../../../components/SeoLanding";
import { seoCategories, type SeoCategorySlug } from "../../../../lib/seo-categories";
import { seoDistricts } from "../../../../lib/seo-cities";
import { publicSiteUrl } from "../../../../lib/site-url";
import { placeHasListings } from "../../../../lib/host/landing-count";
export const dynamic = "force-dynamic";
// Baku districts: /kiraye-ev/baki/nesimi, /kiraye/baki/yasamal ...
type Props = { params: Promise<{ landing: string; city: string; district: string }> };
async function slugs(params: Props["params"]) {
  const { landing, city, district } = await params;
  if (!Object.hasOwn(seoCategories, landing) || city !== "baki" || !Object.hasOwn(seoDistricts, district)) notFound();
  return { landing: landing as SeoCategorySlug, city, district };
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { landing, city, district } = await slugs(params);
  const { title, description, path } = landingCopy(landing, city, district);
  // Empty page (no live listing here yet): out of Google until a listing appears, links still followed.
  const live = await placeHasListings(seoCategories[landing].category, "Bakı", seoDistricts[district].name);
  return { title: `${title} | kirayeal.az`, description, robots: live ? undefined : { index: false, follow: true }, alternates: { canonical: `${publicSiteUrl()}${path}` }, openGraph: { title: `${title} — kirayeal.az`, description, url: `${publicSiteUrl()}${path}`, locale: "az_AZ", type: "website" } };
}
export default async function DistrictPage({ params }: Props) { const { landing, city, district } = await slugs(params); return <SeoLanding landing={landing} city={city} district={district} />; }
