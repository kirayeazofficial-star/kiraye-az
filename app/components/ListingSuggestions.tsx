"use client";
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {isListingExpired} from '../../lib/listing-lifecycle';
import {type Listing,money,periodName} from '../../lib/marketplace';
import PhotoMark from './PhotoMark';
import PromotionBadges,{activePromotion} from './PromotionBadges';
export default function ListingSuggestions({item,premiumOnly=false}:{item?:Listing;premiumOnly?:boolean}){
 const [items,setItems]=useState<Listing[]>([]);
 useEffect(()=>{if(item?.demo||(!item&&!premiumOnly))return;let active=true;const params=new URLSearchParams({limit:'12'});if(item)params.set('category',item.category);fetch(`/api/listings?${params}`,{cache:'no-store'}).then(response=>response.json()).then(data=>{if(active&&Array.isArray(data.items))setItems(data.items.filter((ad:Listing)=>ad.id!==item?.id&&ad.status==='published'&&!isListingExpired(ad)&&(!premiumOnly||activePromotion(ad)==='premium')).slice(0,6));}).catch(()=>{});return()=>{active=false;};},[item?.id,item?.category,item?.demo,premiumOnly]);
 return items.length?<section className={premiumOnly?'wrap premiumListings':'relatedListings'}><h2>{premiumOnly?'Premium elanlar':'Bənzər elanlar'}</h2><div className="relatedGrid">{items.map(ad=><Link className="relatedCard" href={`/listings/${ad.id}`} key={ad.id}><div className="relatedPhoto"><img src={ad.images?.[0]||'/placeholder.svg'} alt="" loading="lazy"/><PhotoMark src={ad.images?.[0]}/><PromotionBadges item={ad}/></div><strong>{money(ad.price)} ₼ / {periodName(ad.rental_period)}</strong><span>{ad.title}</span><small>{ad.city}</small></Link>)}</div></section>:null;
}
