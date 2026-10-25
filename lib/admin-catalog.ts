export const ADMIN_PAGE_SIZE = 24;
export function adminListingQuery<T>(
  builder: T,
  status: string,
  search: string,
  page: number,
  extra: {from?:string;until?:string;kind?:string} = {},
): T {
  let query = builder as any;
  if (status === "archived") query = query.in("status",["archived","expired"]);
  else if (
    ["pending", "published", "rejected", "archived", "expired", "draft"].includes(status)
  )
    query = query.eq("status", status);
  const value = search
    .replace(/[(),.%_"\\]/g, " ")
    .trim()
    .slice(0, 100);
  if (value) {
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value,
      )
    )
      query = query.eq("id", value);
    else if (/^\d{8,18}$/.test(value)) query = query.or(`listing_no.eq.${value},contact.ilike.%${value}%`);
    else query = query.or(`title.ilike.%${value}%,contact.ilike.%${value}%`);
  }
  if (["new","edited"].includes(extra.kind || "")) query = query.eq("review_kind",extra.kind);
  const validDate=(value:string|undefined)=>!!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value));
  if (validDate(extra.from)) query = query.gte("created_at",`${extra.from}T00:00:00+04:00`);
  if (validDate(extra.until)) query = query.lte("created_at",`${extra.until}T23:59:59.999999+04:00`);
  const current = Number.isSafeInteger(page) && page > 0 ? page : 1;
  return query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range((current - 1) * ADMIN_PAGE_SIZE, current * ADMIN_PAGE_SIZE - 1);
}
