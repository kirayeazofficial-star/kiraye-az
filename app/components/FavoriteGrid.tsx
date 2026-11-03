import type { ReactNode } from "react";
import type { Listing } from "../../lib/marketplace";
import ListingCard from "./ListingCard";
// Favorites are managed inside the listing; card photos stay unobstructed.
export default function FavoriteGrid({ items, lead }: { items: Listing[]; lead?: ReactNode }) {
  return <div className="kzGrid">{lead}{items.map(item => <ListingCard key={item.id} item={item} />)}</div>;
}
