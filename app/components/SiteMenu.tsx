"use client";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SiteContact from "./SiteContact";
import LanguageSelect from "./LanguageSelect";
import { useLanguage } from "./LanguageProvider";

const primaryLinks = [
  ["/#elanlar", "Elanlar"],
  ["/?favorites=1#elanlar", "Seçilmişlər"],
  ["/new", "Elan yerləşdir"],
  ["/messages", "Mesajlar"],
  ["/profile", "Şəxsi kabinet"],
];
const helpLinks = [
  ["/help", "Kömək"],
  ["/rules", "Qaydalar və təhlükəsizlik"], ["/privacy", "Məxfilik"],
];

export default function SiteMenu() {
  const {t}=useLanguage();
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const keyboardOpen = useRef(false);
  useEffect(() => {
    if (!open) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Touch opening focuses the dialog, avoiding Safari's programmatic button ring.
    const target = keyboardOpen.current
      ? panel.current?.querySelector<HTMLButtonElement>(".siteMenuClose")
      : panel.current;
    target?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = before;
      trigger.current?.focus({ preventScroll: true });
    };
  }, [open]);

  return <>
    <button ref={trigger} className="mobileMenuButton" type="button" aria-label={t("Menyunu aç")} aria-expanded={open} onClick={event => { keyboardOpen.current = event.detail === 0; setOpen(true); }}>
      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 5h18M3 12h18M3 19h18" /></svg>
    </button>
    {open && createPortal(<div className="siteMenuLayer">
      <button className="siteMenuShade" type="button" aria-label={t("Menyunu bağla")} tabIndex={-1} onClick={() => setOpen(false)} />
      <aside ref={panel} className="siteMenuPanel" tabIndex={-1} role="dialog" aria-modal="true" aria-label={t("Sayt menyusu")} onKeyDown={event => {
        if (event.key === "Escape") setOpen(false);
        if (event.key === "Tab") {
          const all = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button,a[href]"));
          const first = all[0], last = all[all.length - 1];
          if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
      }}>
        <div className="siteMenuHeading">
          <Link className="logo" href="/" onClick={() => setOpen(false)}>kirayeal<span>.az</span><small>{t("KİRAYƏ ÜÇÜN BİR ÜNVAN")}</small></Link>
          <button className="siteMenuClose" type="button" aria-label={t("Menyunu bağla")} onClick={() => setOpen(false)}>
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <div className="siteMenuLanguage"><span>{t("Dil")}</span><LanguageSelect /></div>
        <nav aria-label={t("Sayt bölmələri")}>
          {primaryLinks.map(([href, title]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{t(title)}<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="m9 5 7 7-7 7" /></svg></Link>)}
        </nav>
        <nav className="siteMenuHelp" aria-label={t("Məlumat və kömək")}>
          {helpLinks.map(([href, title]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{t(title)}<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="m9 5 7 7-7 7" /></svg></Link>)}
        </nav>
        <SiteContact />
      </aside>
    </div>, document.body)}
  </>;
}
