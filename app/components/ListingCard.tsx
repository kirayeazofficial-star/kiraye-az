"use client";
import { useLanguage } from "./LanguageProvider";
import PromotionBadges from "./PromotionBadges";
import NavigationIcon from './NavigationIcon';
import { publicDate } from "../../lib/public-date";
import Link from "next/link";
import {
  Listing,
  money,
  periodName,
} from "../../lib/marketplace";
export default function ListingCard({
  item,
  favorite,
  onFavorite,
}: {
  item: Listing;
  favorite?: boolean;
  onFavorite?: () => void;
}) {
  const {t} = useLanguage();
  return (
    <article className="kzCard">
      <Link prefetch={false} className="kzCardLink" href={`/listings/${item.id}`}>
        <span className="kzCardPhoto" style={{["--bg" as string]:`url("${item.images?.[0] || "/placeholder.svg"}")`} as React.CSSProperties}>
          <img src={item.images?.[0] || "/placeholder.svg"} alt="" loading="lazy" onError={event=>{if(!event.currentTarget.src.endsWith('/placeholder.svg'))event.currentTarget.src='/placeholder.svg';}} />
          {item.demo&&<span className="kzBadge">{t("Nümunə")}</span>}
        </span>
        <span className="kzCardBody">
          <strong className="kzPrice">{money(item.price)} ₼ <small>/ {t(periodName(item.rental_period))}</small></strong>
          <span className="kzCardTitle">{item.title}</span>
          <span className="kzCardMeta">
            <span>{item.city}{!item.demo && <>, {publicDate(item.created_at)}</>}</span>
            <PromotionBadges item={item}/>
          </span>
        </span>
      </Link>
      {onFavorite && <button
        type="button"
        className={`kzFavorite${favorite ? " selected" : ""}`}
        aria-label={favorite ? t("Seçilmişlərdən çıxar") : t("Seçilmişlərə əlavə et")}
        aria-pressed={favorite}
        onClick={onFavorite}
      >
        <NavigationIcon name="heart" filled={favorite}/>
      </button>}
    </article>
  );
}
