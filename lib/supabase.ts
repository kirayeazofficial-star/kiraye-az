import { createClient } from "@supabase/supabase-js";

const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const url = configuredUrl && /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(configuredUrl)
  ? configuredUrl
  : "https://bqvfrcxojlaezlmckjox.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = key ? createClient(url, key) : null;
