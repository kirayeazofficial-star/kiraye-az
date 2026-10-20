export const amenities = [
  "Wi-Fi",
  "Kondisioner",
  "İstilik",
  "Mebel",
  "Park yeri",
  "Hovuz",
  "Lift",
  "Mətbəx",
];
export const reportReasons = [
  "Saxta və ya şübhəli elan",
  "Yanlış qiymət və məlumat",
  "Artıq kirayəyə verilib",
  "Uyğunsuz məzmun",
  "Başqa səbəb",
];
export const isProperty = (category: string) =>
  ["property", "villa", "commercial"].includes(category);
export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^00/, "");
  if (/^0\d{9}$/.test(digits)) return `+994${digits.slice(1)}`;
  if (/^994\d{9}$/.test(digits)) return `+${digits}`;
  return null;
}
export function validateRentalDetails({
  deposit,
  min_days,
  available_from,
  available_until,
}: {
  deposit: number;
  min_days: number;
  available_from: string | null;
  available_until: string | null;
}) {
  if (!Number.isFinite(deposit) || deposit < 0 || deposit > 1000000)
    return "Depozit 0–1 000 000 ₼ arasında olmalıdır.";
  if (!Number.isInteger(min_days) || min_days < 1 || min_days > 365)
    return "Minimum kirayə müddəti 1–365 gün arasında olmalıdır.";
  for (const date of [available_from, available_until])
    if (
      date &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date)
    )
      return "Tarix düzgün deyil.";
  if (available_from && available_until && available_from > available_until)
    return "Son tarix başlanğıc tarixindən əvvəl ola bilməz.";
  return null;
}

export type RentalFilters = {
  rooms: string;
  area: string;
  brand: string;
  gearbox: string;
  noDeposit: boolean;
  from: string;
  until: string;
};
export function matchesRentalFilters(
  item: {
    rooms?: number;
    area_m2?: number;
    deposit?: number;
    min_days?: number;
    available_from?: string | null;
    available_until?: string | null;
    attributes?: { brand?: string; gearbox?: string };
  },
  filters: RentalFilters,
) {
  if (
    filters.rooms &&
    (filters.rooms === "4+"
      ? (item.rooms ?? 0) < 4
      : item.rooms !== Number(filters.rooms))
  )
    return false;
  if (filters.area && (item.area_m2 ?? 0) < Number(filters.area)) return false;
  if (
    filters.brand &&
    !item.attributes?.brand?.toLowerCase().includes(filters.brand.toLowerCase())
  )
    return false;
  if (filters.gearbox && item.attributes?.gearbox !== filters.gearbox)
    return false;
  if (filters.noDeposit && Number(item.deposit ?? 0) > 0) return false;
  if (filters.from && filters.until && filters.from > filters.until)
    return false;
  if (filters.from && item.available_from && item.available_from > filters.from)
    return false;
  if (
    filters.from &&
    item.available_until &&
    item.available_until < filters.from
  )
    return false;
  if (
    filters.until &&
    item.available_until &&
    item.available_until < filters.until
  )
    return false;
  if (
    filters.until &&
    item.available_from &&
    item.available_from > filters.until
  )
    return false;
  if (filters.from && filters.until) {
    const days = Math.max(
      1,
      (Date.parse(filters.until) - Date.parse(filters.from)) / 86400000,
    );
    if ((item.min_days ?? 1) > days) return false;
  }
  return true;
}
