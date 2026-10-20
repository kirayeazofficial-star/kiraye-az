import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
// Only browser-safe publishable/anon keys belong here. Never use a service-role key.
export const supabase =
  url &&
  /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url) &&
  key &&
  /^(sb_publishable_|eyJ)/.test(key)
    ? createClient(url, key)
    : null;

// The public Auth settings endpoint reports enabled providers, never credentials.
export async function getAuthCapabilities() {
  if (!supabase || !url || !key) return { phone: false, email: false };
  const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, {
    headers: { apikey: key },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Auth settings unavailable");
  const settings = await response.json();
  return {
    phone: settings.external?.phone === true,
    email: settings.external?.email === true,
  };
}
