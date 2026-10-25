"use client";
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {publicSupabase} from '../../lib/supabase';
import {isListingExpired} from '../../lib/listing-lifecycle';
import {type Listing,money,periodName} from '../../lib/marketplace';
import PhotoMark from './PhotoMark';
import PromotionBadges,{activePromotion} from './PromotionBadges';
export default function ListingSuggestions({item,premiumOnly=false}:{item?:Listing;premiumOnly?:boolean}){
 const [items,setItems]=useState<Listing[]>([]);
 useEffect(()=>{if(!publicSupabase||item?.demo)return;let active=true;let query=publicSupabase.from('listings').select('*').eq('status','published');if(premiumOnly)query=query.eq('promotion_kind','premium').gt('promotion_until',new Date().toISOString());else if(item)query=query.eq('category',item.category).neq('id',item.id);else return;Promise.resolve(query.order('created_at',{ascending:false}).limit(6).abortSignal(AbortSignal.timeout(4000))).then(({data,error})=>{if(active&&!error)setItems((data||[]).filter((ad:Listing)=>ad.id!==item?.id&&ad.status==='published'&&!isListingExpired(ad)&&(!premiumOnly||activePromotion(ad)==='premium')));}).catch(()=>{});return()=>{active=false;};},[item?.id,item?.category,item?.demo,premiumOnly]);
 return items.length?<section className={premiumOnly?'wrap premiumListings':'relatedListings'}><h2>{premiumOnly?'Premium elanlar':'Bənzər elanlar'}</h2><div className="relatedGrid">{items.map(ad=><Link className="relatedCard" href={`/listings/${ad.id}`} key={ad.id}><div className="relatedPhoto"><img src={ad.images?.[0]||'/placeholder.svg'} alt="" loading="lazy"/><PhotoMark src={ad.images?.[0]}/><PromotionBadges item={ad}/></div><strong>{money(ad.price)} ₼ / {periodName(ad.rental_period)}</strong><span>{ad.title}</span><small>{ad.city}</small></Link>)}</div></section>:null;
}
