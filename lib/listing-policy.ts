import { supabase } from "./supabase";
export const monthlyListingLimitMessage =
  "Bu kateqoriyada elan limitin dolub. Limitin yenilənməsini gözlə və ya mövcud elanını idarə et.";
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
  if (error.code === "PLA01") return "Bu kateqoriyada aktiv elan limitin dolub.";
  if (error.code === "PLR01") return "Bu kateqoriyada son 30 gün üçün elan limitin dolub. Limitin yenilənməsini gözlə.";
  if (error.code === "PLC01") return "Yayımlanmış elanı başqa kateqoriyaya çevirmək olmaz.";
  if (error.code === "PLC02") return "Bu kateqoriyanın limit ayarları hazırlanır.";
  if (error.code === "23514" && error.message?.includes("rental_period"))
    return "Həftəlik tarif serverdə saxlanıla bilmədi. Baza yeniləməsi tamamlanmalıdır; yazdıqlarınız qaralamada saxlanılır.";
  if (error.code === "23514" && error.message?.includes("listings_category_check"))
    return "Bu kateqoriya serverdə hələ aktivləşdirilməyib. Saytın baza yeniləməsi tamamlanmalıdır.";
  if (error.code === "PDU01" || error.message?.includes("DUPLICATE_LISTING"))
    return duplicateListingMessage;
  return "Elan göndərilmədi. Məlumatları yoxlayıb yenidən cəhd edin.";
}
// Early feedback before uploading photos. The SQL trigger remains authoritative.
export async function checkMonthlyListingLimit(ownerId: string, category: string, listingId?: string) {
  if (!supabase) throw new Error("Elan xidməti hazır deyil.");
  if (!category) return;
  const lifecycle = await supabase.rpc("listing_allowance", { p_category: category, p_listing_id: listingId || null });
  if (!lifecycle.error && typeof lifecycle.data?.allowed === "boolean") {
    if (lifecycle.data.allowed) return;
    throw new Error(listingPolicyError({ code: lifecycle.data.reason === "active" ? "PLA01" : lifecycle.data.reason === "period" ? "PLR01" : "PLC02" }));
  }
  if (lifecycle.error && !["PGRST202", "42883"].includes(lifecycle.error.code))
    throw new Error("Elan limitini yoxlamaq mümkün olmadı. Yenidən cəhd et.");
  const allowance = await supabase.rpc("has_category_listing_allowance", { p_category: category });
  if (!allowance.error) {
    if (allowance.data === false) throw new Error(monthlyListingLimitMessage);
    if (allowance.data === true) return;
    throw new Error("Elan limitini yoxlamaq mümkün olmadı. Yenidən cəhd et.");
  }
  // Keep the UI usable while the additive SQL migration is being rolled out.
  // Legacy installations can only count currently published ads by creation date.
  if (!["PGRST202", "42883"].includes(allowance.error.code))
    throw new Error("Elan limitini yoxlamaq mümkün olmadı. Yenidən cəhd et.");
  const profile = await supabase.from("profiles").select("role").eq("id", ownerId).maybeSingle();
  if (profile.error) throw new Error("Hesab hüquqlarını yoxlamaq mümkün olmadı.");
  if (profile.data?.role === "admin") return;
  const { start, end } = listingMonthWindow();
  const { count, error } = await supabase.from("listings")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId).eq("category", category).eq("status", "published")
    .gte("created_at", start).lt("created_at", end);
  if (error || count === null) throw new Error("Elan limitini yoxlamaq mümkün olmadı. Yenidən cəhd et.");
  if (count >= 1) throw new Error(monthlyListingLimitMessage);
}
