import { isListingExpired } from "../../lib/listing-lifecycle";
import type { Listing } from '../../lib/marketplace';
export function activePromotion(item:Listing){return !item.demo&&!isListingExpired(item)&&item.status==='published'&&item.promotion_until&&Date.parse(item.promotion_until)>Date.now()?item.promotion_kind:null;}
export default function PromotionBadges({item}:{item:Listing}){const kind=activePromotion(item);return kind?<span className={`kzBadge kzBadge-${kind}`}>{kind==='premium'?'Premium':'VIP'}</span>:null;}
