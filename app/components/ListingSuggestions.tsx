"use client";
import { ChevronRight, Crown } from "lucide-react";
import Link from "next/link";
import {useEffect,useState} from 'react';
import {isListingExpired} from '../../lib/listing-lifecycle';
import {type Listing} from '../../lib/marketplace';
import {activePromotion} from './PromotionBadges';
import FavoriteGrid from './FavoriteGrid';
import {useLanguage} from './LanguageProvider';
import {paidVisible,useSiteFlags} from '../../lib/use-site-flags';
export default function ListingSuggestions({item,premiumOnly=false}:{item?:Listing;premiumOnly?:boolean}){
 const {t}=useLanguage();
 const flags=useSiteFlags();
 const [items,setItems]=useState<Listing[]>([]);
 useEffect(()=>{if(item?.demo||(!item&&!premiumOnly))return;let active=true;const params=new URLSearchParams({limit:premiumOnly?'24':'13'});if(item)params.set('category',item.category);if(premiumOnly)params.set('promotion','premium');fetch(`/api/listings?${params}`,{cache:'no-store'}).then(response=>response.json()).then(data=>{if(active&&Array.isArray(data.items))setItems(data.items.filter((ad:Listing)=>ad.id!==item?.id&&ad.status==='published'&&!isListingExpired(ad)&&(!premiumOnly||activePromotion(ad)==='premium')).slice(0,premiumOnly?12:6));}).catch(()=>{});return()=>{active=false;};},[item?.id,item?.category,item?.demo,premiumOnly]);
 return items.length?<section className="kzSection">
  <div className="kzSectionHead"><h2>{t(premiumOnly?'Premium elanlar':'Bənzər elanlar')}</h2>{premiumOnly&&<a className="kzMore" href="#elanlar">{t('Bütün elanlar')}<ChevronRight aria-hidden="true" size={16} strokeWidth={2.25} /></a>}</div>
  <FavoriteGrid items={items} lead={premiumOnly&&paidVisible(flags)?<Link prefetch={false} href="/profile?section=listings" className="kzPromoTile"><span><Crown aria-hidden="true" size={26} strokeWidth={2} /></span><strong>{t('Elanı Premium et!')}</strong><small>{t('Elanınız bu blokda, hamıdan öndə görünsün')}</small><em>{t('Premium et')}</em></Link>:undefined}/>
 </section>:null;
}
