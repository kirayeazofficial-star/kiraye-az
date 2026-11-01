import {hostQuery} from './host/db';
import { isListingExpired } from './listing-lifecycle';
import type { Listing } from './marketplace';
// Listings for a landing page: category ('' = all), city and (for Baku) district.
export async function categoryListings(category:string,city?:string,district?:string){
 try{const data=await hostQuery<Listing>(`select * from public.listings where status='published' and ($1::text='' or category=$1) and ($2::text is null or city=$2) and ($3::text is null or district=$3) and (expires_at is null or expires_at>now()) order by created_at desc limit 24`,[category,city||null,district||null]);return {items:data.filter(item=>!isListingExpired(item)),unavailable:false};}catch{return {items:[] as Listing[],unavailable:true};}
}
