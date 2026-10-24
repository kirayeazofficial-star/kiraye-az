import { publicSupabase } from './supabase';
import { isListingExpired } from './listing-lifecycle';
import type { Listing } from './marketplace';
export async function categoryListings(category:string){
 if(!publicSupabase)return {items:[] as Listing[],unavailable:true};
 try{const {data,error}=await publicSupabase.from('listings').select('*').eq('status','published').eq('category',category).order('created_at',{ascending:false}).limit(18).abortSignal(AbortSignal.timeout(4000));return {items:error?[]:(data as Listing[]||[]).filter(item=>!isListingExpired(item)),unavailable:!!error};}catch{return {items:[] as Listing[],unavailable:true};}
}
