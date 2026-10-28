import { isListingExpired } from "./listing-lifecycle";
import { searchVariants, rentalSearchIntent } from "./search-query";
import type { Listing } from "./marketplace";
import { scopeRentalFilters, type RentalFilters } from "./rental-details";
export const PAGE_SIZE = 18;
export type CatalogQuery = RentalFilters & {
  category: string;
  owner?: string;
  city: string;
  period: string;
  query: string;
  min: string;
  max: string;
  sort: string;
  page: number;
  favorites: string[] | null;
};
const number = (value: string) =>
  value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0
    ? Number(value)
    : null;
const date = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value
    ? value
    : null;
export function applyCatalogFilters<T>(builder: T, input: CatalogQuery): T {
  const intent = rentalSearchIntent(input.query);
  const effectiveCategory = input.category || (intent.categories.length === 1 ? intent.categories[0] : "");
  input = { ...input, ...scopeRentalFilters(effectiveCategory, input) };
  // Fixed field names and stripped PostgREST punctuation prevent query expression injection.
  let q = builder as any;
  q = q.eq("status", "published");
  if(input.owner && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(input.owner)) q=q.eq("owner_id",input.owner);
  if (input.category) q = q.eq("category", input.category);
  if (intent.categories.length) q = q.in("category", intent.categories);
  if (input.city || intent.city) q = q.eq("city", input.city || intent.city);
  if (input.period) q = q.eq("rental_period", input.period);
  if (number(input.min) !== null) q = q.gte("price", number(input.min));
  if (number(input.max) !== null) q = q.lte("price", number(input.max));
  for (const token of intent.query.split(/\s+/).filter(Boolean)) {
    const searches = searchVariants(token);
    q = q.or(searches.flatMap(search =>
      ["title", "city", "district", "attributes->>brand", "attributes->>model"].map(field => `${field}.ilike.%${search}%`)).join(","));
  }
  if (input.rooms === "4+") q = q.gte("rooms", 4);
  else if (number(input.rooms) !== null) q = q.eq("rooms", number(input.rooms));
  if (number(input.area) !== null) q = q.gte("area_m2", number(input.area));
  if (input.brand)
    q = q.ilike(
      "attributes->>brand",
      `%${input.brand.replace(/[%_]/g, "").slice(0, 40)}%`,
    );
  if (input.gearbox) q = q.eq("attributes->>gearbox", input.gearbox);
  if (input.noDeposit) q = q.eq("deposit", 0);
  if (date(input.from)) {
    q = q
      .or(`available_from.is.null,available_from.lte.${input.from}`)
      .or(`available_until.is.null,available_until.gte.${input.from}`);
  }
  if (date(input.until)) {
    q = q
      .or(`available_until.is.null,available_until.gte.${input.until}`)
      .or(`available_from.is.null,available_from.lte.${input.until}`);
  }
  if (date(input.from) && date(input.until)) {
    const days = Math.max(
      1,
      (Date.parse(input.until) - Date.parse(input.from)) / 86400000,
    );
    q = q.lte("min_days", days);
  }
  if (input.favorites) q = q.in("id", input.favorites);
  if (input.sort === "low" || input.sort === "high")
    q = q.order("price", { ascending: input.sort === "low" });
  q = q
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  const page = Math.max(1, Math.floor(input.page) || 1);
  return q.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1) as T;
}
export async function searchCatalog(input: CatalogQuery) {
  const favorites = input.favorites?.filter((id) =>
    /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id),
  );
  if (favorites?.length === 0) return { items: [] as Listing[], total: 0 };
  if (input.from && input.until && input.from > input.until)
    return { items: [] as Listing[], total: 0 };
  const params=new URLSearchParams();
  for(const [key,value] of Object.entries({...input,favorites:favorites?.join(',')??undefined,noDeposit:input.noDeposit?'1':undefined}))if(value!==undefined&&value!==null&&value!==''&&key!=='favorites'&&key!=='noDeposit')params.set(key,String(value));
  if(input.favorites)params.set('favorites',favorites?.join(',')||'');if(input.noDeposit)params.set('noDeposit','1');
  const response=await fetch(`/api/listings?${params}`,{cache:'no-store',signal:AbortSignal.timeout(15000)});const result=await response.json();if(!response.ok)throw new Error(result.error||'unavailable');
  return {items:(result.items as Listing[]).filter(item=>item.status==='published'&&!isListingExpired(item)),total:Number(result.total)||0};
}
