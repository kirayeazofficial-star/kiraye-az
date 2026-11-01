"use client";
import { useEffect, useState } from "react";

export type SiteFlags = { payments: boolean; leader: boolean; announcement?: { text: string; tone: "info" | "warn" | "danger"; link: string } | null };
let cached: Promise<SiteFlags> | null = null;
const load = () => (cached ??= fetch("/api/settings", { cache: "no-store" }).then(r => r.json()).catch(() => ({ payments: true, leader: false })));

// Site switches, loaded once per page. null while loading (paid buttons wait instead of flashing).
export function useSiteFlags() {
  const [flags, setFlags] = useState<SiteFlags | null>(null);
  useEffect(() => { let live = true; void load().then(value => { if (live) setFlags(value); }); return () => { live = false; }; }, []);
  return flags;
}
// Paid things are shown to the leader always, to others only while payments are on.
export const paidVisible = (flags: SiteFlags | null) => !!flags && (flags.payments || flags.leader);
