import { createClient } from "@supabase/supabase-js";

const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const url =
  configuredUrl.match(/https:\/\/[a-z0-9-]+\.supabase\.co/i)?.[0] ??
  "https://bqvfrcxojlaezlmckjox.supabase.co";
const configuredKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";
const key =
  configuredKey.match(/sb_publishable_[A-Za-z0-9_-]+/)?.[0] ??
  configuredKey.match(/eyJ[A-Za-z0-9_.-]+/)?.[0];

export const supabase = key ? createClient(url, key) : null;
