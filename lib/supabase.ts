import { createClient } from "@supabase/supabase-js";

const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const url =
  configuredUrl.match(/https:\/\/[a-z0-9-]+\.supabase\.co/i)?.[0] ??
  "https://bqvfrcxojlaezlmckjox.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const supabase = key ? createClient(url, key) : null;
