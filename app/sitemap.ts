import type {MetadataRoute} from 'next';
import {publicSupabase} from '../lib/supabase';
import {publicSiteUrl} from '../lib/site-url';
import {seoCategories} from '../lib/seo-categories';
import {isListingExpired} from '../lib/listing-lifecycle';
import type {Listing} from '../lib/marketplace';
export const revalidate=3600;
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const base=publicSiteUrl();const pages:MetadataRoute.Sitemap=['','/help','/rules','/privacy',...Object.keys(seoCategories).map(slug=>'/'+slug)].map(path=>({url:`${base}${path}`,changeFrequency:path?'weekly':'daily'}));if(!publicSupabase)return pages;try{const {data,error}=await publicSupabase.from('listings').select('*').eq('status','published').order('created_at',{ascending:false}).limit(1000).abortSignal(AbortSignal.timeout(4000));if(error)return pages;return [...pages,...(data as Listing[]||[]).filter(item=>!isListingExpired(item)&&/^[0-9a-f-]{36}$/i.test(item.id)).map(item=>{const date=(item as Listing&{updated_at?:string}).updated_at||item.created_at;return {url:`${base}/listings/${item.id}`,...(date&&Number.isFinite(Date.parse(date))?{lastModified:new Date(date)}:{}),changeFrequency:'weekly' as const};})];}catch{return pages;}}
