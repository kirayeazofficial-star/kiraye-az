"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Info, TriangleAlert, X } from "lucide-react";
import { useSiteFlags } from "../../lib/use-site-flags";

// The leader's short message on top of every page. ✕ hides it for this visitor until the text changes.
const KEY = "kz-announce-closed";
export default function AnnouncementBar() {
  const flags = useSiteFlags(), notice = flags?.announcement;
  const [closed, setClosed] = useState<string | null>(null);
  useEffect(() => { try { setClosed(localStorage.getItem(KEY) ?? ""); } catch { setClosed(""); } }, []);
  if (!notice || closed === null || closed === notice.text) return null;
  const close = () => { try { localStorage.setItem(KEY, notice.text); } catch { /* private mode */ } setClosed(notice.text); };
  const Icon = notice.tone === "warn" ? TriangleAlert : Info;
  return <div className={`kzAnnounce ${notice.tone}`} role="status">
    <Icon aria-hidden="true" size={17} strokeWidth={2.2} />
    <span>{notice.text}{notice.link && <> {notice.link.startsWith("/") ? <Link href={notice.link}>Ətraflı</Link> : <a href={notice.link} target="_blank" rel="noopener noreferrer">Ətraflı</a>}</>}</span>
    <button type="button" aria-label="Bağla" onClick={close}><X aria-hidden="true" size={18} strokeWidth={2.2} /></button>
  </div>;
}
