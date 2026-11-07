"use client";
import { LifeBuoy, Mail, Menu, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { siteContact } from "../../lib/site-contact";
import { InstagramIcon, TikTokIcon } from "./BrandIcons";
import LanguageSelect from "./LanguageSelect";
import { useLanguage } from "./LanguageProvider";

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
          <Link className="logo" href="/" onClick={() => setOpen(false)}>kirayeal<span>.az</span></Link>
          <button className="siteMenuClose" type="button" aria-label={t("Menyunu bağla")} onClick={() => setOpen(false)}>
            <X aria-hidden="true" size={20} strokeWidth={2} />
          </button>
        </div>
        <div className="kzDrawerBody">
          <div className="kzDrawerHelp">
            <strong>{t("Sualınız var?")}</strong>
            <p>{t("Kömək bölməsində cavabları tapın və ya bizə yazın.")}</p>
            <div>
              <Link className="main" href="/help" onClick={() => setOpen(false)}><LifeBuoy aria-hidden="true" size={16} strokeWidth={2} />{t("Kömək")}</Link>
              <a href={`mailto:${siteContact.email}`}><Mail aria-hidden="true" size={16} strokeWidth={2} />{t("Bizə yazın")}</a>
            </div>
          </div>
          <p className="kzDrawerHead">{t("Sayt")}</p>
          <nav className="kzDrawerLinks" aria-label={t("Məlumat və kömək")}>
            <Link href="/magaza" onClick={() => setOpen(false)}>{t("Mağazalar")}</Link>
            <Link href="/rules" onClick={() => setOpen(false)}>{t("Qaydalar və təhlükəsizlik")}</Link>
            <Link href="/privacy" onClick={() => setOpen(false)}>{t("Məxfilik")}</Link>
            <Link href="/terms" onClick={() => setOpen(false)}>{t("İstifadəçi razılaşması")}</Link>
          </nav>
          <p className="kzDrawerHead">{t("Dil")}</p>
          <div className="kzDrawerLang"><LanguageSelect /></div>
          <p className="kzDrawerHead">{t("Bizi izləyin")}</p>
          <div className="kzDrawerSocial">
            <a className="ig" href={siteContact.instagram} target="_blank" rel="noopener noreferrer"><span><InstagramIcon size={15} /></span>Instagram</a>
            <a className="tt" href={siteContact.tiktok} target="_blank" rel="noopener noreferrer"><span><TikTokIcon size={14} /></span>TikTok</a>
          </div>
          <p className="kzDrawerCopy">© {new Date().getFullYear()} kirayeal.az</p>
        </div>
      </aside>
    </div>, document.body)}
  </>;
}
