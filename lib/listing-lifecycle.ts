import type { Listing } from "./marketplace";
export function isListingExpired(item: Listing, now = Date.now()) {
  const expiry = item.expires_at ? Date.parse(item.expires_at) : Date.parse(item.first_published_at || item.created_at) + 30 * 86400000;
  return item.status === "expired" || (item.status === "published" && Number.isFinite(expiry) && expiry <= now);
}
export function effectiveListingStatus(item: Listing) { return isListingExpired(item) ? "expired" : item.status; }
