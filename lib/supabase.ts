import "./auth-return";
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
    ? createClient(url, key, {
        global: {
          fetch: async (input, init) => {
            const controller = new AbortController();
            const abort = () => controller.abort();
            const signal = init?.signal;
            if (signal?.aborted) abort();
            else signal?.addEventListener("abort", abort, { once: true });
            const timer = setTimeout(abort, 20000);
            try {
              return await fetch(input, { ...init, signal: controller.signal });
            } finally {
              clearTimeout(timer);
              signal?.removeEventListener("abort", abort);
            }
          },
        },
      })
    : null;

// The public Auth settings endpoint reports enabled providers, never credentials.
export async function getAuthCapabilities() {
  if (!supabase || !url || !key)
    return { phone: false, email: false, google: false };
  const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, {
    headers: { apikey: key },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Auth settings unavailable");
  const settings = await response.json();
  return {
    google: settings.external?.google === true,
    phone: settings.external?.phone === true,
    email: settings.external?.email === true,
  };
}

// Public browsing must never wait for a stored login session or token refresh.
// A separate non-persisted client also keeps server requests anonymous.
export const publicSupabase =
  url && key && supabase
    ? createClient(url, key, {
        auth: {
          storageKey: "kiraye-public-catalog",
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          fetch: (input, init) =>
            fetch(input, {
              ...init,
              signal: init?.signal ?? AbortSignal.timeout(15000),
            }),
        },
      })
    : null;
