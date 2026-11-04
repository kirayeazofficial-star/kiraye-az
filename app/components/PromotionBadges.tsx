import { Crown, Gem } from "lucide-react";
import { isListingExpired } from "../../lib/listing-lifecycle";
import type { Listing } from '../../lib/marketplace';
export function activePromotion(item:Listing){return !item.demo&&!isListingExpired(item)&&item.status==='published'&&item.promotion_until&&Date.parse(item.promotion_until)>Date.now()&&(item.promotion_kind==='vip'||item.promotion_kind==='premium')?item.promotion_kind:null;}
export default function PromotionBadges({item}:{item:Listing}){
 const kind=activePromotion(item);if(!kind)return null;
 const label=kind==='premium'?'Premium':'VIP',Icon=kind==='premium'?Crown:Gem;
 return <span className={`kzPromo kzPromo-${kind}`} title={`${label} elan`} aria-label={`${label} elan`}><Icon aria-hidden="true" size={14} strokeWidth={1.8}/><span translate="no">{label}</span></span>;
}
