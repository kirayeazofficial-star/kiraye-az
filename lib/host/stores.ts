import "server-only";
import {hostQuery} from "./db";

export type StorePlan={id:string;name:string;price:string;listing_limit:number|null;free_bumps:number;featured:boolean};
export type Store={id:string;owner_id:string;slug:string;name:string;description:string;logo_url:string|null;phone:string;address:string;hours:string;cover_url:string|null;open_from:string|null;open_to:string|null;plan:string;status:string;active_until:string|null;reject_reason:string|null;created_at:string};

export async function storePlans(){
  return hostQuery<StorePlan>(`select id,name,price::text as price,listing_limit,free_bumps,featured from public.store_plans order by sort`);
}
// The owner's store while it is active (approved and paid up).
export async function activeStore(ownerId:string){
  const rows=await hostQuery<Store&{listing_limit:number|null}>(`select s.*,p.listing_limit from public.stores s join public.store_plans p on p.id=s.plan where s.owner_id=$1 and s.status='active' and s.active_until>now()`,[ownerId]).catch(()=>[]);
  return rows[0]||null;
}
// Readable address part from a store name: "Rent Car Bakı" → "rent-car-baki".
export function storeSlug(value:string){
  const map:Record<string,string>={ə:"e",ı:"i",ö:"o",ü:"u",ğ:"g",ş:"s",ç:"c",İ:"i"};
  return value.toLowerCase().replace(/[əıöüğşçİ]/g,ch=>map[ch]||ch).normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,40);
}
