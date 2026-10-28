import Link from "next/link";
import { listings } from "../../data/listings";
import { type Listing, money, periodName } from "../../lib/marketplace";
import PhotoMark from "./PhotoMark";

// Up to six other published listings from the same category.
export default function ListingSuggestions({ item }: { item: Listing }) {
  const items = listings
    .filter(
      (ad) =>
        ad.status === "published" && ad.category === item.category && ad.id !== item.id,
    )
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, 6);
  if (!items.length) return null;
  return (
    <section className="relatedListings">
      <h2>Bənzər elanlar</h2>
      <div className="relatedGrid">
        {items.map((ad) => (
          <Link className="relatedCard" href={`/listings/${ad.id}`} key={ad.id}>
            <div className="relatedPhoto">
              <img src={ad.images?.[0] || "/placeholder.svg"} alt="" loading="lazy" />
              <PhotoMark src={ad.images?.[0]} />
            </div>
            <strong>
              {money(ad.price)} ₼ / {periodName(ad.rental_period)}
            </strong>
            <span>{ad.title}</span>
            <small>{ad.city}</small>
          </Link>
        ))}
      </div>
    </section>
  );
}
