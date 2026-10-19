import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  url && key && /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)
    ? createClient(url, key)
    : null;
