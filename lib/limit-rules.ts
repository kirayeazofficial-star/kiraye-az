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
export const defaultLimitRules: LimitRules = { enabled: false, free: { transport: 1, property: 1, goods: 1 }, paid: ["villa", "commercial"] };
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
