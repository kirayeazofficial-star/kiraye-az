import type {MetadataRoute} from 'next';
import {hostQuery} from '../lib/host/db';
import {publicSiteUrl} from '../lib/site-url';
import {seoCategories} from '../lib/seo-categories';
import {seoCities} from '../lib/seo-cities';
import {isListingExpired} from '../lib/listing-lifecycle';
import type {Listing} from '../lib/marketplace';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const base=publicSiteUrl();const pages:MetadataRoute.Sitemap=['','/help','/rules','/privacy','/terms',...Object.keys(seoCategories).map(slug=>'/'+slug),...Object.keys(seoCategories).flatMap(slug=>Object.keys(seoCities).map(city=>`/${slug}/${city}`))].map(path=>({url:`${base}${path}`,changeFrequency:path?'weekly':'daily'}));try{const data=await hostQuery<Listing&{updated_at?:string}>(`select * from public.listings where status='published' and (expires_at is null or expires_at>now()) and not exists(select 1 from auth.users bu where bu.id=owner_id and bu.disabled_at is not null) order by created_at desc limit 1000`);return [...pages,...data.filter(item=>!isListingExpired(item)&&/^[0-9a-f-]{36}$/i.test(item.id)).map(item=>{const date=item.updated_at||item.created_at;return {url:`${base}/listings/${item.id}`,...(date&&Number.isFinite(Date.parse(date))?{lastModified:new Date(date)}:{}),changeFrequency:'weekly' as const};})];}catch{return pages;}}
