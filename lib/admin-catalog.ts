export const ADMIN_PAGE_SIZE = 24;
export function adminListingQuery<T>(
  builder: T,
  status: string,
  search: string,
  page: number,
): T {
  let query = builder as any;
  if (
    ["pending", "published", "rejected", "archived", "draft"].includes(status)
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
    else query = query.or(`title.ilike.%${value}%,contact.ilike.%${value}%`);
  }
  const current = Number.isSafeInteger(page) && page > 0 ? page : 1;
  return query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range((current - 1) * ADMIN_PAGE_SIZE, current * ADMIN_PAGE_SIZE - 1);
}
