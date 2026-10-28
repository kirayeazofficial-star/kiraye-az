"use client";
import {useEffect,useState} from 'react';
import {isListingExpired} from '../../lib/listing-lifecycle';
import {type Listing} from '../../lib/marketplace';
import {activePromotion} from './PromotionBadges';
import ListingCard from './ListingCard';
import {useLanguage} from './LanguageProvider';
export default function ListingSuggestions({item,premiumOnly=false}:{item?:Listing;premiumOnly?:boolean}){
 const {t}=useLanguage();
 const [items,setItems]=useState<Listing[]>([]);
 useEffect(()=>{if(item?.demo||(!item&&!premiumOnly))return;let active=true;const params=new URLSearchParams({limit:premiumOnly?'24':'13'});if(item)params.set('category',item.category);if(premiumOnly)params.set('promotion','premium');fetch(`/api/listings?${params}`,{cache:'no-store'}).then(response=>response.json()).then(data=>{if(active&&Array.isArray(data.items))setItems(data.items.filter((ad:Listing)=>ad.id!==item?.id&&ad.status==='published'&&!isListingExpired(ad)&&(!premiumOnly||activePromotion(ad)==='premium')).slice(0,premiumOnly?12:6));}).catch(()=>{});return()=>{active=false;};},[item?.id,item?.category,item?.demo,premiumOnly]);
 return items.length?<section className="kzSection">
  <div className="kzSectionHead"><h2>{t(premiumOnly?'Premium elanlar':'Bənzər elanlar')}</h2>{premiumOnly&&<a className="kzMore" href="#elanlar">{t('Son elanlar')}</a>}</div>
  <div className="kzGrid">{items.map(ad=><ListingCard key={ad.id} item={ad}/>)}</div>
 </section>:null;
}
