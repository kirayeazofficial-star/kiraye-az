import type { Listing } from "./marketplace";
export function isListingExpired(item: Listing, now = Date.now()) {
  return item.status === "expired" || (item.status === "published" && !!item.expires_at && Date.parse(item.expires_at) <= now);
}
export function effectiveListingStatus(item: Listing) { return isListingExpired(item) ? "expired" : item.status; }
