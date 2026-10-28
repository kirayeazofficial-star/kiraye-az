"use client";
import { useLanguage } from "./LanguageProvider";
import PromotionBadges from "./PromotionBadges";
import PhotoMark from "./PhotoMark";
import NavigationIcon from './NavigationIcon';
import { publicDate } from "../../lib/public-date";
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
}: {
  item: Listing;
  favorite: boolean;
  onFavorite: () => void;
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
        <PromotionBadges item={item}/>
        {item.demo&&<span className="badge">{t("Nümunə")}</span>}
        <button
          className={`heart ${favorite ? "selected" : ""}`}
          aria-label={
            favorite ? t("Seçilmişlərdən çıxar") : t("Seçilmişlərə əlavə et")
          }
          aria-pressed={favorite}
          onClick={event=>{event.preventDefault();event.stopPropagation();onFavorite();}}
        >
          <NavigationIcon name="heart" filled={favorite}/>
        </button>
      </div>
      <Link prefetch={false} className="cardBody" href={`/listings/${item.id}`}>
        <strong className="price">
          {money(item.price)} ₼{" "}
          <small>/ {t(periodName(item.rental_period))}</small>
        </strong>
        <h3>{item.title}</h3>
        <p className="cardPlace">
          {item.city}
          {item.district ? `, ${item.district}` : ""}
          {!item.demo && <> · {publicDate(item.created_at)}</>}
        </p>
        <div className="cardRentalFacts">
          {item.deposit === 0 && <span className="noDeposit">{t("Depozitsiz")}</span>}
          {["Çatdırılma","Hər ikisi"].includes(item.attributes?.delivery_method || "") && <span>{t("Çatdırılma")}</span>}
          {!!item.rooms && <span>{item.rooms} otaq</span>}
          {!!item.area_m2 && <span>{item.area_m2} m²</span>}
        </div>
      </Link>
    </article>
  );
}
