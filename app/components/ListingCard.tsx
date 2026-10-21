import Link from "next/link";
import {
  Listing,
  categoryName,
  money,
  periodName,
} from "../../lib/marketplace";
export default function ListingCard({
  item,
  favorite,
  onFavorite,
  onOpen,
}: {
  item: Listing;
  favorite: boolean;
  onFavorite: () => void;
  onOpen: () => void;
}) {
  return (
    <article className="listingCard">
      <div
        className="photo"
        style={{
          backgroundImage: `url("${item.images?.[0] || "/placeholder.svg"}"),url('/placeholder.svg')`,
        }}
      >
        <Link
          prefetch={false}
          className="photoOpen"
          href={`/listings/${item.id}`}
          aria-label={`${item.title} — ətraflı bax`}
        />
        <span className="badge">
          {item.demo ? "Nümunə" : categoryName(item.category)}
        </span>
        <button
          className={`heart ${favorite ? "selected" : ""}`}
          aria-label={
            favorite ? "Seçilmişlərdən çıxar" : "Seçilmişlərə əlavə et"
          }
          aria-pressed={favorite}
          onClick={onFavorite}
        >
          {favorite ? "♥" : "♡"}
        </button>
        <button
          className="quickView"
          aria-label={`${item.title} — sürətli baxış`}
          onClick={onOpen}
        >
          Sürətli baxış
        </button>
      </div>
      <Link prefetch={false} className="cardBody" href={`/listings/${item.id}`}>
        <strong className="price">
          {money(item.price)} ₼{" "}
          <small>/ {periodName(item.rental_period)}</small>
        </strong>
        <h3>{item.title}</h3>
        <p>
          ⌖ {item.city}
          {item.district ? `, ${item.district}` : ""}
        </p>
        <div className="cardRentalFacts">
          <span>
            {item.deposit === 0
              ? "Depozitsiz"
              : item.deposit != null
                ? `Depozit: ${money(item.deposit)} ₼`
                : "Depoziti dəqiqləşdir"}
          </span>
          {(item.min_days ?? 1) > 1 && <span>Ən azı {item.min_days} gün</span>}
          {!!item.rooms && <span>{item.rooms} otaq</span>}
          {!!item.area_m2 && <span>{item.area_m2} m²</span>}
        </div>
        <div className="cardMeta">
          <span>{categoryName(item.category)}</span>
          <span>
            {item.demo
              ? "Nümunə elan"
              : new Date(item.created_at).toLocaleDateString("az-AZ")}
          </span>
        </div>
      </Link>
    </article>
  );
}
