import { listings } from "../data/listings";
import type { Listing } from "./marketplace";

export function getPublicListing(id: string): Listing | null {
  return listings.find((item) => item.id === id && item.status === "published") ?? null;
}
