"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Info, OctagonAlert, TriangleAlert, X } from "lucide-react";
import { useSiteFlags } from "../../lib/use-site-flags";

export type AnnouncementTone = "info" | "warn" | "danger";
const icons = { info: Info, warn: TriangleAlert, danger: OctagonAlert };

// The bar itself (also used as the live preview in the leader panel).
export function AnnouncementView({ text, tone, link, onClose }: { text: string; tone: AnnouncementTone; link?: string; onClose?: () => void }) {
  const Icon = icons[tone] || Info;
  const more = link ? (link.startsWith("/")
    ? <Link className="kzAnnounceLink" href={link}>Ətraflı<ArrowRight aria-hidden="true" size={15} strokeWidth={2.25} /></Link>
    : <a className="kzAnnounceLink" href={link} target="_blank" rel="noopener noreferrer">Ətraflı<ArrowRight aria-hidden="true" size={15} strokeWidth={2.25} /></a>) : null;
  return <div className={`kzAnnounce ${tone}`} role={tone === "danger" ? "alert" : "status"}>
    <div className="kzAnnounceInner">
      <span className="kzAnnounceIcon" aria-hidden="true"><Icon size={16} strokeWidth={2.25} /></span>
      <p>{text}</p>
      {more}
      {onClose && <button type="button" className="kzAnnounceClose" aria-label="Bağla" onClick={onClose}><X aria-hidden="true" size={18} strokeWidth={2} /></button>}
    </div>
  </div>;
}

// The leader's short message on top of every page. ✕ hides it for this visitor until the text changes.
const KEY = "kz-announce-closed";
export default function AnnouncementBar() {
  const flags = useSiteFlags(), notice = flags?.announcement, pathname = usePathname();
  const [closed, setClosed] = useState<string | null>(null);
  useEffect(() => { try { setClosed(localStorage.getItem(KEY) ?? ""); } catch { setClosed(""); } }, []);
  if (!notice || closed === null || closed === notice.text || pathname === "/maintenance") return null;
  const close = () => { try { localStorage.setItem(KEY, notice.text); } catch { /* private mode */ } setClosed(notice.text); };
  return <AnnouncementView text={notice.text} tone={notice.tone} link={notice.link} onClose={close} />;
}
