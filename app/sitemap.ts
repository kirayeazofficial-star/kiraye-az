import type {MetadataRoute} from 'next';
import {supabase} from '../lib/supabase';
import {publicSiteUrl} from '../lib/site-url';
export const revalidate=3600;
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const base=publicSiteUrl();const pages:MetadataRoute.Sitemap=['','/help','/rules','/privacy'].map(path=>({url:`${base}${path}`,changeFrequency:path?'monthly':'daily'}));if(!supabase)return pages;try{const {data,error}=await supabase.from('listings').select('id,updated_at').eq('status','published').order('created_at',{ascending:false}).limit(1000);if(error)return pages;return [...pages,...(data??[]).map(item=>({url:`${base}/listings/${item.id}`,lastModified:new Date(item.updated_at),changeFrequency:'weekly' as const}))];}catch{return pages;}}
