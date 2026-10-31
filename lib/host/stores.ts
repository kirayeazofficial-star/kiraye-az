import "server-only";
import {hostQuery} from "./db";

export type StorePlan={id:string;name:string;price:string;listing_limit:number|null;free_bumps:number;featured:boolean};
export type Store={id:string;owner_id:string;slug:string;name:string;description:string;logo_url:string|null;phone:string;address:string;hours:string;cover_url:string|null;open_from:string|null;open_to:string|null;plan:string;status:string;active_until:string|null;reject_reason:string|null;created_at:string};

export async function storePlans(){
  return hostQuery<StorePlan>(`select id,name,price::text as price,listing_limit,free_bumps,featured from public.store_plans order by sort`);
}
// The owner's store while it is active (approved and paid up).
// A month of free bumps starts at activation and restarts every 30 days.
const fresh=`(s.bumps_month_start is null or s.bumps_month_start<=now()-interval '30 days')`;
export const storeBumpsUsed=`case when ${fresh} then 0 else s.bumps_used end`;
export const storeBumpsTotal=`case when s.terms_set then s.terms_free_bumps else p.free_bumps end`;
// The active store of an owner with the terms it was activated with (later plan changes apply from the next renewal).
export async function activeStore(ownerId:string){
  const rows=await hostQuery<Store&{listing_limit:number|null;free_bumps:number;bumps_left:number}>(`select s.*,case when s.terms_set then s.terms_listing_limit else p.listing_limit end as listing_limit,${storeBumpsTotal} as free_bumps,greatest(${storeBumpsTotal}-${storeBumpsUsed},0) as bumps_left from public.stores s join public.store_plans p on p.id=s.plan where s.owner_id=$1 and s.status='active' and s.active_until>now()`,[ownerId])
    // Database not updated yet (no terms columns): the plan's current terms.
    .catch(()=>hostQuery<Store&{listing_limit:number|null;free_bumps:number;bumps_left:number}>(`select s.*,p.listing_limit,0 as free_bumps,0 as bumps_left from public.stores s join public.store_plans p on p.id=s.plan where s.owner_id=$1 and s.status='active' and s.active_until>now()`,[ownerId])).catch(()=>[]);
  return rows[0]||null;
}
// Readable address part from a store name: "Rent Car Bakı" → "rent-car-baki".
export function storeSlug(value:string){
  const map:Record<string,string>={ə:"e",ı:"i",ö:"o",ü:"u",ğ:"g",ş:"s",ç:"c",İ:"i"};
  return value.toLowerCase().replace(/[əıöüğşçİ]/g,ch=>map[ch]||ch).normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,40);
}
