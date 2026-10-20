import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)?.trim();
// Only browser-safe publishable/anon keys belong here. Never use a service-role key.
export const supabase =
  url &&
  /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url) &&
  key &&
  /^(sb_publishable_|eyJ)/.test(key)
    ? createClient(url, key)
    : null;
