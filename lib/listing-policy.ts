import { supabase } from "./supabase";
export const monthlyListingLimitMessage =
  "Bu təqvim ayı üçün 1 pulsuz elan limitindən istifadə etmisən. Növbəti ay yeni elan yerləşdirə bilərsən; mövcud elanını redaktə etmək olar.";
export const duplicateListingMessage =
  "Eyni məlumatlarla aktiv və ya yoxlamada olan elanın artıq var. Yeni təkrar elan yaratmaq əvəzinə mövcud elanı redaktə et.";
export function listingMonthWindow(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Baku",
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")!.value);
  const month = Number(parts.find((part) => part.type === "month")!.value);
  return {
    start: new Date(Date.UTC(year, month - 1, 1, -4)).toISOString(),
    end: new Date(Date.UTC(year, month, 1, -4)).toISOString(),
  };
}
export function listingPolicyError(error: { code?: string; message?: string }) {
  if (
    error.code === "PML01" ||
    error.message?.includes("MONTHLY_LISTING_LIMIT")
  )
    return monthlyListingLimitMessage;
  if (error.code === "PDU01" || error.message?.includes("DUPLICATE_LISTING"))
    return duplicateListingMessage;
  return "Elan göndərilmədi. Məlumatları yoxlayıb yenidən cəhd edin.";
}
// Early feedback saves photo uploads. The database trigger is the authoritative
// check and serializes concurrent submissions; this count is not an API guard.
export async function checkMonthlyListingLimit(ownerId: string) {
  if (!supabase) throw new Error("Elan xidməti hazır deyil.");
  const { start, end } = listingMonthWindow();
  const { count, error } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .gte("created_at", start)
    .lt("created_at", end);
  if (error || count === null)
    throw new Error("Elan limitini yoxlamaq mümkün olmadı. Yenidən cəhd et.");
  if (count >= 1) throw new Error(monthlyListingLimitMessage);
}
