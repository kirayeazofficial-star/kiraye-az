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
          backgroundImage: `url("${item.images?.[0] || "/placeholder.svg"}"), url("/placeholder.svg")`,
        }}
      >
        <button
          className="photoOpen"
          aria-label={`${item.title} — ətraflı bax`}
          onClick={onOpen}
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
      </div>
      <button className="cardBody" onClick={onOpen}>
        <strong className="price">
          {money(item.price)} ₼{" "}
          <small>/ {periodName(item.rental_period)}</small>
        </strong>
        <h3>{item.title}</h3>
        <p>
          ⌖ {item.city}
          {item.district ? `, ${item.district}` : ""}
        </p>
        <div className="cardMeta">
          <span>{categoryName(item.category)}</span>
          <span>
            {item.demo
              ? "Nümunə elan"
              : new Date(item.created_at).toLocaleDateString("az-AZ")}
          </span>
        </div>
      </button>
    </article>
  );
}
