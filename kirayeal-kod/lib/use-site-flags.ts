"use client";
import { useEffect, useState } from "react";

export type SiteFlags = { payments: boolean; leader: boolean; announcement?: { text: string; tone: "info" | "warn" | "danger"; link: string } | null };
let cached: Promise<SiteFlags> | null = null;
export const loadSiteFlags = (): Promise<SiteFlags> => (cached ??= fetch("/api/settings", { cache: "no-store" })
  .then(async response => {
    if (!response.ok) throw new Error("SETTINGS_UNAVAILABLE");
    const value = await response.json();
    if (!value || typeof value.payments !== "boolean" || typeof value.leader !== "boolean") throw new Error("INVALID_SETTINGS");
    return value as SiteFlags;
  })
  .catch(() => {
    cached = null; // A later page or reconnect may retry; never cache an enabled fallback.
    return { payments: false, leader: false };
  }));

// Site switches, loaded once per page. null while loading (paid buttons wait instead of flashing).
export function useSiteFlags() {
  const [flags, setFlags] = useState<SiteFlags | null>(null);
  useEffect(() => {
    let live = true;
    const refresh = () => { void loadSiteFlags().then(value => { if (live) setFlags(value); }); };
    refresh();
    window.addEventListener("online", refresh);
    return () => { live = false; window.removeEventListener("online", refresh); };
  }, []);
  return flags;
}
// Paid things are shown to the leader always, to others only while payments are on.
export const paidVisible = (flags: SiteFlags | null) => !!flags && (flags.payments || flags.leader);
