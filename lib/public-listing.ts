import { isListingExpired } from "./listing-lifecycle";
import { cache } from "react";
import { examples, Listing } from "./marketplace";
import {hostQuery} from "./host/db";
import {publicPoint} from "./location";
export const getPublicListing = cache(
  async (
    id: string,
  ): Promise<{ item: Listing | null; unavailable: boolean }> => {
    if (id.startsWith("example-"))
      return {
        item: examples.find((x) => x.id === id) ?? null,
        unavailable: false,
      };
    if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id))
      return { item: null, unavailable: false };
    try {
      const sql=`select l.*,p.created_at::text seller_since,(select json_build_object('name',s.name,'slug',s.slug,'logo_url',s.logo_url,'address',s.address,'open_from',s.open_from,'open_to',s.open_to,'listings',(select count(*) from public.listings x where x.owner_id=s.owner_id and x.status='published' and x.deleted_at is null and (x.expires_at is null or x.expires_at>now()))) from public.stores s where s.owner_id=l.owner_id and s.status='active' and s.active_until>now()) as store from public.listings l left join public.profiles p on p.id=l.owner_id where l.id=$1 and l.status='published' and (l.expires_at is null or l.expires_at>now()) and not exists(select 1 from auth.users bu where bu.id=l.owner_id and bu.disabled_at is not null) limit 1`,plain=`select l.*,p.created_at::text seller_since from public.listings l left join public.profiles p on p.id=l.owner_id where l.id=$1 and l.status='published' and (l.expires_at is null or l.expires_at>now()) and not exists(select 1 from auth.users bu where bu.id=l.owner_id and bu.disabled_at is not null) limit 1`;
      // Without the stores table (database not updated yet) the listing still opens.
      const rows=await hostQuery<Listing&{seller_since?:string}>(sql,[id]).catch(()=>hostQuery<Listing&{seller_since?:string}>(plain,[id]));
      const item=rows[0]&&!isListingExpired(rows[0])?{...rows[0],...publicPoint(rows[0])}:null;return {item,unavailable:false};
    } catch {
      return { item: null, unavailable: true };
    }
  },
);
