"use client";
import { useLanguage } from "./LanguageProvider";
import PhotoMark from "./PhotoMark";
import { minimumRentalLabel } from "../../lib/rental-details";
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
  const {t} = useLanguage();
  return (
    <article className="listingCard">
      <div className="photo">
        <img className="cardPhoto" src={item.images?.[0] || "/placeholder.svg"} alt="" loading="lazy" onError={event=>{if(!event.currentTarget.src.endsWith('/placeholder.svg'))event.currentTarget.src='/placeholder.svg';}} />
        <Link
          prefetch={false}
          className="photoOpen"
          href={`/listings/${item.id}`}
          aria-label={`${item.title} — ətraflı bax`}
        />
        <PhotoMark src={item.images?.[0]} />
        <span className="badge">
          {item.demo ? t("Nümunə") : t(categoryName(item.category))}
        </span>
        <button
          className={`heart ${favorite ? "selected" : ""}`}
          aria-label={
            favorite ? t("Seçilmişlərdən çıxar") : t("Seçilmişlərə əlavə et")
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
          {t("Sürətli baxış")}</button>
      </div>
      <Link prefetch={false} className="cardBody" href={`/listings/${item.id}`}>
        <strong className="price">
          {money(item.price)} ₼{" "}
          <small>/ {t(periodName(item.rental_period))}</small>
        </strong>
        <h3>{item.title}</h3>
        <p>
          ⌖ {item.city}
          {item.district ? `, ${item.district}` : ""}
        </p>
        <div className="cardRentalFacts">
          <span>
            {item.deposit === 0
              ? t("Depozitsiz")
              : item.deposit != null
                ? `Depozit: ${money(item.deposit)} ₼`
                : t("Depoziti dəqiqləşdir")}
          </span>
          {["Çatdırılma","Hər ikisi"].includes(item.attributes?.delivery_method || "") && <span>{t("Çatdırılma")}{item.attributes?.delivery_fee !== undefined && String(item.attributes.delivery_fee).trim() !== "" && Number.isFinite(Number(item.attributes.delivery_fee)) && Number(item.attributes.delivery_fee) >= 0 ? ` +${money(Number(item.attributes.delivery_fee))} ₼` : " · " + t("Razılaşma ilə")}</span>}
          {(item.min_days ?? 1) > 1 && (
            <span>Ən azı {minimumRentalLabel(item)}</span>
          )}
          {!!item.rooms && <span>{item.rooms} otaq</span>}
          {!!item.area_m2 && <span>{item.area_m2} m²</span>}
        </div>
        <div className="cardMeta">
          <span>{t(categoryName(item.category))}</span>
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
