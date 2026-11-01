import "server-only";
import {hostQuery} from "./db";

// Where there are live listings: "category|city|district" keys (category "" = all, district "" = whole city).
// City and district pages without listings are kept out of Google (noindex, not in the sitemap) until one appears.
export async function liveListingPlaces():Promise<Set<string>>{
  const rows=await hostQuery<{category:string;city:string;district:string|null}>(`select category,city,district from public.listings
    where status='published' and deleted_at is null and (expires_at is null or expires_at>now())
      and not exists(select 1 from auth.users bu where bu.id=owner_id and bu.disabled_at is not null)
    group by category,city,district`).catch(()=>null);
  if(!rows)return new Set(["*"]);// database not reachable: keep every page indexable
  const keys=new Set<string>();
  for(const row of rows)for(const category of [row.category,""]){keys.add(`${category}|${row.city}|`);if(row.district)keys.add(`${category}|${row.city}|${row.district}`);}
  return keys;
}
export async function placeHasListings(category:string,city:string,district=""){
  const keys=await liveListingPlaces();
  return keys.has("*")||keys.has(`${category}|${city}|${district}`);
}
