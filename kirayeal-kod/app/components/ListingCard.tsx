"use client";
import { loweredFrom, shownAt } from "../../lib/marketplace";
import { sized } from "../../lib/image-size";
import { useLanguage } from "./LanguageProvider";
import PromotionBadges from "./PromotionBadges";
import { publicDate } from "../../lib/public-date";
import Link from "next/link";
import {
  Listing,
  money,
  periodName,
} from "../../lib/marketplace";
export default function ListingCard({ item }: { item: Listing }) {
  const {t} = useLanguage();
  return (
    <article className="kzCard">
      <Link prefetch={false} className="kzCardLink" href={`/listings/${item.id}`}>
        <span className={`kzCardPhoto${["clothing","equipment","photo","event"].includes(item.category)?" kzContainPhoto":""}`}>
          <img src={sized(item.images?.[0]) || "/placeholder.svg"} alt="" loading="lazy" decoding="async" onError={event=>{if(!event.currentTarget.src.endsWith('/placeholder.svg'))event.currentTarget.src='/placeholder.svg';}} />
          
          {item.store && <em className="kzCardStore" title={item.store.name}>Mağaza</em>}
        </span>
        <span className="kzCardBody">
          <strong className="kzPrice"><span className="kzPriceAmount">{money(item.price)} ₼</span><small>/ {t(periodName(item.rental_period))}</small>{loweredFrom(item) && <s className="kzOldPrice">{money(loweredFrom(item)!)} ₼</s>}</strong>
          <span className="kzCardTitle" translate="no">{item.title}</span>
          <span className="kzCardMeta">
            <span>{item.city}{!item.demo && <>, {publicDate(shownAt(item))}</>}</span>
            <PromotionBadges item={item}/>
          </span>
        </span>
      </Link>

    </article>
  );
}
