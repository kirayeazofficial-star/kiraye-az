"use client";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import {useEffect,useState} from 'react';
import {isListingExpired} from '../../lib/listing-lifecycle';
import {type Listing} from '../../lib/marketplace';
import {activePromotion} from './PromotionBadges';
import FavoriteGrid from './FavoriteGrid';
import BannerStrip from './BannerStrip';
import {useLanguage} from './LanguageProvider';
export default function ListingSuggestions({item,featured=false,homeLayout=false,onAvailabilityChange}:{item?:Listing;featured?:boolean;homeLayout?:boolean;onAvailabilityChange?:(available:boolean)=>void}){
 const {t}=useLanguage();
 const [items,setItems]=useState<Listing[]>([]),[columns,setColumns]=useState(2),[loaded,setLoaded]=useState(false);
 useEffect(()=>{
  if(!homeLayout)return;
  const desktop=window.matchMedia('(min-width:1024px)'),tablet=window.matchMedia('(min-width:768px)');
  const sync=()=>setColumns(desktop.matches?4:tablet.matches?3:2);sync();
  desktop.addEventListener('change',sync);tablet.addEventListener('change',sync);
  return()=>{desktop.removeEventListener('change',sync);tablet.removeEventListener('change',sync);};
 },[homeLayout]);
 useEffect(()=>{
  if(item?.demo||(!item&&!featured))return;
  let active=true;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
  setItems([]);setLoaded(false);
  const params=new URLSearchParams({limit:featured?'24':'13'});
  if(item)params.set('category',item.category);if(featured)params.set('promotion','featured');
  fetch(`/api/listings?${params}`,{cache:'no-store',signal:controller.signal}).then(response=>{
   if(!response.ok)throw new Error('LISTINGS_UNAVAILABLE');return response.json();
  }).then(data=>{
   if(active&&Array.isArray(data.items))setItems(data.items.filter((ad:Listing)=>ad.id!==item?.id&&ad.status==='published'&&!isListingExpired(ad)&&(!featured||['vip','premium'].includes(activePromotion(ad)||''))).slice(0,featured?24:8));
  }).catch(()=>{}).finally(()=>{clearTimeout(timer);if(active)setLoaded(true);});
  return()=>{active=false;clearTimeout(timer);controller.abort();};
 },[item?.id,item?.category,item?.demo,featured]);
 useEffect(()=>{if(loaded)onAvailabilityChange?.(items.length>0);},[loaded,items.length,onAvailabilityChange]);
 const premium=items.filter(ad=>activePromotion(ad)==='premium').slice(0,12),vip=items.filter(ad=>activePromotion(ad)==='vip').slice(0,12);
 if(homeLayout)return <>
  <PromotionSection items={premium} kind="premium" columns={columns} banner/>
  <PromotionSection items={vip} kind="vip" columns={columns} banner={!premium.length}/>
 </>;
 return items.length?<section className="kzSection kzSuggestions">
  <div className="kzSectionHead"><h2>{t('Bənzər elanlar')}</h2>{item&&<Link className="kzMore" href={`/?category=${encodeURIComponent(item.category)}#elanlar`}>{t('Hamısını göstər')}<ChevronRight aria-hidden="true" size={16} strokeWidth={2}/></Link>}</div>
  <FavoriteGrid items={items}/>
 </section>:null;
}
function PromotionSection({items,kind,columns,banner}:{items:Listing[];kind:'premium'|'vip';columns:number;banner:boolean}){
 const {t}=useLanguage();if(!items.length)return null;
 return <section className="kzSection kzSuggestions" data-promotion-tier={kind}>
  <div className="kzSectionHead"><h2>{t(kind==='premium'?'Premium elanlar':'VIP elanlar')}</h2><a className="kzMore" href="#elanlar">{t('Son elanlar')}<ChevronRight aria-hidden="true" size={16} strokeWidth={2}/></a></div>
  <FavoriteGrid items={items.slice(0,columns)}/>
  {banner&&<BannerStrip placement="home"/>}
  {items.length>columns&&<FavoriteGrid items={items.slice(columns)}/>}
 </section>;
}
