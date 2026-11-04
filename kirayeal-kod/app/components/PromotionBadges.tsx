import { Crown, Gem } from "lucide-react";
import { isListingExpired } from "../../lib/listing-lifecycle";
import type { Listing } from '../../lib/marketplace';
export function activePromotion(item:Listing){return !item.demo&&!isListingExpired(item)&&item.status==='published'&&item.promotion_until&&Date.parse(item.promotion_until)>Date.now()?item.promotion_kind:null;}
export default function PromotionBadges({item}:{item:Listing}){const kind=activePromotion(item);return kind?<span className="kzPromo" title={kind==='premium'?'Premium elan':'VIP elan'} aria-label={kind==='premium'?'Premium elan':'VIP elan'}>{kind==='premium'&&<Crown aria-hidden="true" size={16} strokeWidth={2} color="#e9a514" fill="#f5c24c"/>}<Gem aria-hidden="true" size={16} strokeWidth={2} color="#e84a10" fill="#ff8a5c"/></span>:null;}
