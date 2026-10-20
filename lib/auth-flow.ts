import { safeLoginDestination } from "./auth-messages";
import type { SupabaseClient } from "@supabase/supabase-js";

export function authCallbackUrl(
  origin: string,
  recovery = false,
  next?: string,
) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  let base = new URL(origin);
  if (configured) {
    try {
      const candidate = new URL(configured);
      if (candidate.protocol === "https:") base = candidate;
    } catch {
      /* Keep the current site for invalid optional configuration. */
    }
  }
  if (
    ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"].includes(base.hostname) ||
    (!configured && base.hostname.endsWith(".vercel.app"))
  )
    base = new URL("https://kiraye-az.vercel.app");
  const callback = new URL(
    recovery ? "/reset-password" : "/auth/callback",
    base.origin,
  );
  if (next && safeLoginDestination(next) !== "/profile")
    callback.searchParams.set("next", safeLoginDestination(next));
  return callback.toString();
}

// Handles both Supabase's standard email links and token_hash email templates.
// Never log URL query strings/fragments: they can contain temporary credentials.
export async function completeEmailAuth(client: SupabaseClient, href: string) {
  const url = new URL(href);
  const hash = new URLSearchParams(url.hash.slice(1));
  const error = url.searchParams.get("error") || hash.get("error");
  if (error)
    throw new Error(
      "Təsdiq linkinin vaxtı bitib və ya link artıq istifadə olunub. Yeni link istəyin.",
    );
  const type = url.searchParams.get("type") || hash.get("type");
  const tokenHash = url.searchParams.get("token_hash");
  if (tokenHash) {
    if (
      !["signup", "recovery", "email", "invite", "magiclink"].includes(
        type || "",
      )
    )
      throw new Error("Təsdiq linkinin növü düzgün deyil.");
    const { error } = await client.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "signup" | "recovery" | "email" | "invite" | "magiclink",
    });
    if (error) throw new Error("Təsdiq linki etibarsızdır. Yeni link istəyin.");
  }
  let { data, error: sessionError } = await client.auth.getSession();
  if (url.searchParams.has("code") && !data.session) {
    const result = await client.auth.exchangeCodeForSession(
      url.searchParams.get("code")!,
    );
    if (result.error)
      throw new Error(
        "Bu linki qeydiyyatdan keçdiyiniz brauzerdə açın və ya e-poçtdakı kodu giriş səhifəsində yazın.",
      );
    data = result.data;
    sessionError = null;
  }
  if (sessionError || !data.session)
    throw new Error(
      "Təsdiq tamamlanmadı. Giriş səhifəsindən yeni link və ya kod istəyin.",
    );
  return type === "recovery" ||
    url.searchParams.get("flow") === "recovery" ||
    url.pathname === "/reset-password"
    ? "/reset-password"
    : safeLoginDestination(url.searchParams.get("next"));
}
