// Free listing rules (shared by the server and the pages).
// Off: every category has its own free listing per 30 days (the old rule).
// On: one free listing per group of categories per 30 days, and some categories are always paid.
export type LimitGroup = "transport" | "property" | "goods";
export type LimitRules = { enabled: boolean; free: Record<LimitGroup, number>; paid: string[] };

export const limitGroups: { id: LimitGroup; name: string; categories: string[] }[] = [
  { id: "transport", name: "Nəqliyyat", categories: ["car", "motorcycle", "electric", "bicycle"] },
  { id: "property", name: "Əmlak", categories: ["property", "villa", "commercial"] },
  { id: "goods", name: "Əşya və avadanlıq", categories: ["equipment", "clothing", "photo", "camping", "event"] },
];
export const defaultLimitRules: LimitRules = { enabled: true, free: { transport: 1, property: 1, goods: 1 }, paid: ["villa", "commercial"] };
// The site's fixed rule (agreed with the owner, like the big classified sites): one free listing per group every
// 30 days, villas and commercial property always paid. It is not edited from the panel.
export const fixedLimitRules: LimitRules = defaultLimitRules;
// Price of one extra listing (30 days on the site), in manat. Restoring an expired listing costs half.
export const listingPrices: Record<string, number> = {
  car: 10, motorcycle: 6, electric: 6, bicycle: 6,
  property: 10, villa: 15, commercial: 15,
  equipment: 5, clothing: 5, photo: 5, camping: 5, event: 5,
};
export const listingPrice = (category: string) => listingPrices[category] ?? 5;
export const restorePrice = (category: string) => listingPrice(category) / 2;
export const manat = (value: number) => `${value.toFixed(2).replace(".", ",")} ₼`;
export const groupOf = (category: string) => limitGroups.find(group => group.categories.includes(category))?.id ?? "goods";

export function cleanLimitRules(value: unknown): LimitRules {
  const raw = (value && typeof value === "object" ? value : {}) as Partial<LimitRules>;
  const count = (n: unknown, fallback: number) => { const v = Number(n); return Number.isInteger(v) && v >= 0 && v <= 100 ? v : fallback; };
  const known = new Set(limitGroups.flatMap(group => group.categories));
  return {
    enabled: raw.enabled === true,
    free: { transport: count(raw.free?.transport, 1), property: count(raw.free?.property, 1), goods: count(raw.free?.goods, 1) },
    paid: Array.isArray(raw.paid) ? [...new Set(raw.paid.map(String).filter(id => known.has(id)))] : defaultLimitRules.paid,
  };
}
