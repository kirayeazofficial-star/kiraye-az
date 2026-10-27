import {hostQuery} from './host/db';
import { isListingExpired } from './listing-lifecycle';
import type { Listing } from './marketplace';
export async function categoryListings(category:string){
 try{const data=await hostQuery<Listing>(`select * from public.listings where status='published' and category=$1 and (expires_at is null or expires_at>now()) order by created_at desc limit 18`,[category]);return {items:data.filter(item=>!isListingExpired(item)),unavailable:false};}catch{return {items:[] as Listing[],unavailable:true};}
}
