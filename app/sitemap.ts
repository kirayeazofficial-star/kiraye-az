import type { MetadataRoute } from "next";
import { listings } from "../data/listings";
import { seoCategories } from "../lib/seo-categories";
import { publicSiteUrl } from "../lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = publicSiteUrl();
  const pages: MetadataRoute.Sitemap = [
    "",
    "/help",
    "/rules",
    "/privacy",
    ...Object.keys(seoCategories).map((slug) => "/" + slug),
  ].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path ? "weekly" : "daily",
  }));
  // Sample listings are never listed for search engines.
  const items: MetadataRoute.Sitemap = listings
    .filter((item) => item.status === "published" && !item.demo)
    .map((item) => ({
      url: `${base}/listings/${item.id}`,
      ...(Number.isFinite(Date.parse(item.created_at))
        ? { lastModified: new Date(item.created_at) }
        : {}),
      changeFrequency: "weekly" as const,
    }));
  return [...pages, ...items];
}
