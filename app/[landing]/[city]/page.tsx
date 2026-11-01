import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoLanding, { landingCopy } from "../../components/SeoLanding";
import { seoCategories, type SeoCategorySlug } from "../../../lib/seo-categories";
import { seoCities, type SeoCitySlug } from "../../../lib/seo-cities";
import { publicSiteUrl } from "../../../lib/site-url";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ landing: string; city: string }> };
async function slugs(params: Props["params"]) {
  const { landing, city } = await params;
  if (!Object.hasOwn(seoCategories, landing) || !Object.hasOwn(seoCities, city)) notFound();
  return { landing: landing as SeoCategorySlug, city: city as SeoCitySlug };
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { landing, city } = await slugs(params);
  const { title, description, path } = landingCopy(landing, city);
  return { title: `${title}: günlük və aylıq kirayə | kirayeal.az`, description, alternates: { canonical: `${publicSiteUrl()}${path}` }, openGraph: { title: `${title} — kirayeal.az`, description, url: `${publicSiteUrl()}${path}`, locale: "az_AZ", type: "website" } };
}
export default async function CityPage({ params }: Props) { const { landing, city } = await slugs(params); return <SeoLanding landing={landing} city={city} />; }
