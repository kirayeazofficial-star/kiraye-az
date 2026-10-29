"use client";
import { ChevronRight, CirclePlus, Heart, LayoutGrid, LifeBuoy, Lock, Menu, MessageCircle, ShieldCheck, User, X, type LucideIcon } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SiteContact from "./SiteContact";
import LanguageSelect from "./LanguageSelect";
import { useLanguage } from "./LanguageProvider";

const primaryLinks: [string, string, LucideIcon, string][] = [
  ["/#elanlar", "Elanlar", LayoutGrid, "orange"],
  ["/?favorites=1", "Seçilmişlər", Heart, "red"],
  ["/new", "Elan yerləşdir", CirclePlus, "green"],
  ["/messages", "Mesajlar", MessageCircle, "blue"],
  ["/profile", "Şəxsi kabinet", User, "purple"],
];
const helpLinks: [string, string, LucideIcon, string][] = [
  ["/help", "Kömək", LifeBuoy, "grey"],
  ["/rules", "Qaydalar və təhlükəsizlik", ShieldCheck, "grey"],
  ["/privacy", "Məxfilik", Lock, "grey"],
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
      <Menu aria-hidden="true" size={22} strokeWidth={2} />
    </button>
    {open && createPortal(<div className="siteMenuLayer">
      <button className="siteMenuShade" type="button" aria-label={t("Menyunu bağla")} tabIndex={-1} onClick={() => setOpen(false)} />
      <aside ref={panel} className="siteMenuPanel kzSide" tabIndex={-1} role="dialog" aria-modal="true" aria-label={t("Sayt menyusu")} onKeyDown={event => {
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
            <X aria-hidden="true" size={22} strokeWidth={2} />
          </button>
        </div>
        <div className="siteMenuLanguage"><span>{t("Dil")}</span><LanguageSelect /></div>
        <nav aria-label={t("Sayt bölmələri")}>
          {primaryLinks.map(([href, title, Icon, tone]) => <Link key={href} href={href} onClick={() => setOpen(false)}><span className={`kzSideIcon ${tone}`}><Icon aria-hidden="true" size={18} strokeWidth={2} /></span><span>{t(title)}</span><ChevronRight className="kzSideArrow" aria-hidden="true" size={16} strokeWidth={2} /></Link>)}
        </nav>
        <nav className="siteMenuHelp" aria-label={t("Məlumat və kömək")}>
          {helpLinks.map(([href, title, Icon, tone]) => <Link key={href} href={href} onClick={() => setOpen(false)}><span className={`kzSideIcon ${tone}`}><Icon aria-hidden="true" size={18} strokeWidth={2} /></span><span>{t(title)}</span><ChevronRight className="kzSideArrow" aria-hidden="true" size={16} strokeWidth={2} /></Link>)}
        </nav>
        <SiteContact />
      </aside>
    </div>, document.body)}
  </>;
}
