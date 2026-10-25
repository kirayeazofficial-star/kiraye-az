import { isListingExpired } from "./listing-lifecycle";
import { cache } from "react";
import { publicSupabase as supabase } from "./supabase";
import { examples, Listing } from "./marketplace";
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
    if (!supabase) return { item: null, unavailable: true };
    try {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .eq("status", "published")
        .maybeSingle();
      const item = data && data.status === "published" && !isListingExpired(data as Listing) ? data as Listing : null;
      if (item && !error) {
        try {
          const result = await supabase.rpc("public_seller_since", { listing_id: id })
            .abortSignal(AbortSignal.timeout(1500));
          if (!result.error && typeof result.data === "string" && Number.isFinite(Date.parse(result.data)))
            item.seller_since = result.data;
        } catch { /* Optional account age must never block a published listing. */ }
      }
      return { item, unavailable: !!error };
    } catch {
      return { item: null, unavailable: true };
    }
  },
);
