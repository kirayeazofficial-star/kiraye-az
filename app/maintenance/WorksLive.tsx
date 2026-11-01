"use client";
import { useEffect, useState } from "react";

// Maintenance page helpers: the countdown to the planned return time, and a quiet check every 45 seconds —
// as soon as the site is open again the visitor is taken to the home page (no need to press anything).
// The check goes without the login cookie, so the leader previewing the page sees what visitors see.
export function WorksCountdown({ until }: { until: string }) {
  const [left, setLeft] = useState<string | null>(null);
  useEffect(() => {
    const target = Date.parse(`${until}:00+04:00`);
    const tick = () => {
      const ms = target - Date.now();
      if (!Number.isFinite(ms) || ms <= 0) { setLeft(""); return; }
      const minutes = Math.ceil(ms / 60000), days = Math.floor(minutes / 1440), hours = Math.floor(minutes % 1440 / 60), rest = minutes % 60;
      setLeft([days && `${days} gün`, hours && `${hours} saat`, (!days && rest) && `${rest} dəqiqə`].filter(Boolean).join(" "));
    };
    tick(); const timer = setInterval(tick, 30000); return () => clearInterval(timer);
  }, [until]);
  if (!left) return null;
  return <span className="kzMtLeft">Təxminən {left} qalıb</span>;
}

export function WorksWatch({ active }: { active: boolean }) {
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(async () => {
      try { const response = await fetch("/", { method: "HEAD", cache: "no-store", credentials: "omit" }); if (response.ok) window.location.replace("/"); } catch { /* still closed or offline */ }
    }, 45000);
    return () => clearInterval(timer);
  }, [active]);
  return null;
}
