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
   if(active&&Array.isArray(data.items))setItems(data.items.filter((ad:Listing)=>ad.id!==item?.id&&ad.status==='published'&&!isListingExpired(ad)&&(!featured||['vip','premium'].includes(activePromotion(ad)||''))).slice(0,featured?12:8));
  }).catch(()=>{}).finally(()=>{clearTimeout(timer);if(active)setLoaded(true);});
  return()=>{active=false;clearTimeout(timer);controller.abort();};
 },[item?.id,item?.category,item?.demo,featured]);
 useEffect(()=>{if(loaded)onAvailabilityChange?.(items.length>0);},[loaded,items.length,onAvailabilityChange]);
 return items.length?<section className="kzSection kzSuggestions">
  <div className="kzSectionHead"><h2>{t(featured?'VIP elanlar':'Bənzər elanlar')}</h2>{featured&&<a className="kzMore" href="#elanlar">{t('Son elanlar')}<ChevronRight aria-hidden="true" size={16} strokeWidth={2.25} /></a>}{!featured&&item&&<Link className="kzMore" href={`/?category=${encodeURIComponent(item.category)}#elanlar`}>{t('Hamısını göstər')}<ChevronRight aria-hidden="true" size={16} strokeWidth={2} /></Link>}</div>
  {homeLayout?<><FavoriteGrid items={items.slice(0,columns)}/><BannerStrip placement="home"/>{items.length>columns&&<FavoriteGrid items={items.slice(columns)}/>}</>:<FavoriteGrid items={items}/>}
 </section>:null;
}
