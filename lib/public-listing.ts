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
      const rows=await hostQuery<Listing&{seller_since?:string}>(`select l.*,p.created_at::text seller_since from public.listings l left join public.profiles p on p.id=l.owner_id where l.id=$1 and l.status='published' and (l.expires_at is null or l.expires_at>now()) and not exists(select 1 from auth.users bu where bu.id=l.owner_id and bu.disabled_at is not null) limit 1`,[id]);
      const item=rows[0]&&!isListingExpired(rows[0])?{...rows[0],...publicPoint(rows[0])}:null;return {item,unavailable:false};
    } catch {
      return { item: null, unavailable: true };
    }
  },
);
