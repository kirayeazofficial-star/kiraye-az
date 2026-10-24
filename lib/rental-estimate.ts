import type { Listing } from "./marketplace";
type RentalItem = Pick<
  Listing,
  | "price"
  | "rental_period"
  | "deposit"
  | "min_days"
  | "available_from"
  | "available_until"
  | "attributes"
>;
export function validRentalDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function addRentalDays(value: string, days: number) {
  if (!validRentalDate(value)) return "";
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function rentalMonthEnd(value: string, months: number) {
  const date = new Date(`${value}T00:00:00Z`),
    day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString().slice(0, 10);
}
export function minimumRentalEnd(
  item: Pick<Listing, "min_days" | "attributes">,
  start: string,
) {
  if (!validRentalDate(start)) return "";
  const value = Number(item.attributes?.min_rental_value);
  const unit = item.attributes?.min_rental_unit;
  if (Number.isInteger(value) && value >= 1 && value <= 365) {
    if (unit === "month") return rentalMonthEnd(start, value);
    if (unit === "year") return rentalMonthEnd(start, value * 12);
  }
  return addRentalDays(start, item.min_days || 1);
}
export type RentalQuote =
  | { error: string }
  | {
      error: null;
      start: string;
      end: string;
      units: number;
      days: number;
      rental: number;
      deposit: number;
      delivery: number | null;
      total: number;
      monthly: boolean;
    };
export function calculateRental(
  item: RentalItem,
  input: { start: string; end: string; months: number; delivery: boolean },
  today = "",
): RentalQuote {
  const fail = (error: string): RentalQuote => ({ error });
  if (!validRentalDate(input.start)) return fail("Götürmə tarixini seç.");
  if (today && input.start < today) return fail("Keçmiş tarix seçmək olmaz.");
  const monthly = item.rental_period === "monthly";
  const weekly = item.rental_period === "weekly";
  if (!["daily", "weekly", "monthly"].includes(item.rental_period))
    return fail("Qiymət müddətini elan sahibi ilə dəqiqləşdir.");
  if (
    monthly &&
    (!Number.isInteger(input.months) || input.months < 1 || input.months > 120)
  )
    return fail("Ay sayını 1–120 arasında yaz.");
  const end = monthly ? rentalMonthEnd(input.start, input.months) : input.end;
  if (!validRentalDate(end) || end <= input.start)
    return fail("Qaytarma tarixi götürmə tarixindən sonra olmalıdır.");
  const days = Math.round(
    (Date.parse(end) - Date.parse(input.start)) / 86400000,
  );
  const minimum = item.min_days ?? 1;
  if (
    !Number.isInteger(minimum) ||
    minimum < 1 ||
    end < minimumRentalEnd(item, input.start)
  ) {
    const value = item.attributes?.min_rental_value || String(minimum);
    const unit =
      item.attributes?.min_rental_unit === "month"
        ? "ay"
        : item.attributes?.min_rental_unit === "year"
          ? "il"
          : "gün";
    return fail(`Minimum kirayə müddəti ${value} ${unit}.`);
  }
  if (
    item.available_from &&
    (!validRentalDate(item.available_from) || input.start < item.available_from)
  )
    return fail("Seçilən tarixlər elanda göstərilən mövcudluğa uyğun deyil.");
  if (
    item.available_until &&
    (!validRentalDate(item.available_until) || end > item.available_until)
  )
    return fail("Seçilən tarixlər elanda göstərilən mövcudluğa uyğun deyil.");
  const price = Number(item.price),
    deposit = Number(item.deposit ?? 0);
  if (
    !Number.isFinite(price) ||
    price <= 0 ||
    price > 1000000 ||
    !Number.isFinite(deposit) ||
    deposit < 0 ||
    deposit > 1000000
  )
    return fail("Qiymət və depoziti elan sahibi ilə dəqiqləşdir.");
  if (weekly && days % 7 !== 0) return fail("Həftəlik tarif üçün tam həftə seç. Qısa müddəti sahibi ilə razılaşdır.");
  const units = monthly ? input.months : weekly ? days / 7 : days;
  const rentalCents = Math.round(price * 100) * units,
    depositCents = Math.round(deposit * 100);
  let delivery: number | null = 0;
  if (input.delivery || item.attributes?.delivery_method === "Çatdırılma") {
    if (
      !["Çatdırılma", "Hər ikisi"].includes(
        item.attributes?.delivery_method || "",
      )
    )
      return fail("Bu elanda çatdırılma təklif edilmir.");
    const fee = item.attributes?.delivery_fee;
    delivery =
      fee !== undefined &&
      String(fee).trim() !== "" &&
      Number.isFinite(Number(fee)) &&
      Number(fee) >= 0 &&
      Number(fee) <= 1000000
        ? Math.round(Number(fee) * 100) / 100
        : null;
  }
  return {
    error: null,
    start: input.start,
    end,
    units,
    days,
    monthly,
    rental: rentalCents / 100,
    deposit: depositCents / 100,
    delivery,
    total:
      (rentalCents + depositCents + Math.round((delivery ?? 0) * 100)) / 100,
  };
}
