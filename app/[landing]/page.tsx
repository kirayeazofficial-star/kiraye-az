import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoLanding, { landingCopy } from "../components/SeoLanding";
import { seoCategories, type SeoCategorySlug } from "../../lib/seo-categories";
import { publicSiteUrl } from "../../lib/site-url";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ landing: string }> };
function slug(value: string) { if (!Object.hasOwn(seoCategories, value)) notFound(); return value as SeoCategorySlug; }
export function generateStaticParams() { return Object.keys(seoCategories).map(landing => ({ landing })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { title, description, path } = landingCopy(slug((await params).landing));
  return { title: `${title} — günlük və aylıq elanlar | kirayeal.az`, description, alternates: { canonical: `${publicSiteUrl()}${path}` }, openGraph: { title: `${title} — kirayeal.az`, description, url: `${publicSiteUrl()}${path}`, locale: "az_AZ", type: "website" } };
}
export default async function CategoryPage({ params }: Props) { return <SeoLanding landing={slug((await params).landing)} />; }
