import { listings } from "../data/listings";
import type { Listing } from "./marketplace";

export function categoryListings(category: string): Listing[] {
  return listings
    .filter((item) => item.status === "published" && item.category === category)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, 18);
}
