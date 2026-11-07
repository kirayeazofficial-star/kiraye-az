"use client";
import { ChevronRight, FileText, LifeBuoy, Lock, Mail, Menu, ShieldCheck, Store, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { siteContact } from "../../lib/site-contact";
import { InstagramIcon, TikTokIcon } from "./BrandIcons";
import { useLanguage, type Language } from "./LanguageProvider";

const languages: { value: Language; label: string; name: string }[] = [
  { value: "az", label: "AZ", name: "Azərbaycanca" },
  { value: "ru", label: "RU", name: "Русский" },
  { value: "en", label: "EN", name: "English" },
];

export default function SiteMenu() {
  const {t,language,setLanguage}=useLanguage();
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
        <div className="kzMenuHero">
          <Link className="kzMenuLogo" href="/" onClick={() => setOpen(false)}>kirayeal<span>.az</span></Link>
          <p>{t("Ehtiyacınız olanı almaq məcburiyyətində deyilsiniz.")}</p>
          <div className="kzMenuLang" role="group" aria-label={t("Dil seçimi")}>
            {languages.map(item => <button key={item.value} type="button" aria-label={item.name} aria-pressed={language === item.value} onClick={() => setLanguage(item.value)}>{item.label}</button>)}
          </div>
          <button className="siteMenuClose" type="button" aria-label={t("Menyunu bağla")} onClick={() => setOpen(false)}>
            <X aria-hidden="true" size={18} strokeWidth={2.2} />
          </button>
        </div>
        <div className="kzDrawerBody">
          <nav className="kzMenuList" aria-label={t("Məlumat və kömək")}>
            {[
              { href: "/help", label: "Kömək", icon: LifeBuoy },
              { href: `mailto:${siteContact.email}`, label: "Bizə yazın", icon: Mail, external: true },
              { href: "/magaza", label: "Mağazalar", icon: Store },
              { href: "/rules", label: "Qaydalar və təhlükəsizlik", icon: ShieldCheck },
              { href: "/privacy", label: "Məxfilik", icon: Lock },
              { href: "/terms", label: "İstifadəçi razılaşması", icon: FileText },
            ].map(({ href, label, icon: Icon, external }) => {
              const inner = <><Icon aria-hidden="true" size={20} strokeWidth={1.9} /><span>{t(label)}</span><ChevronRight className="kzMenuChevron" aria-hidden="true" size={17} strokeWidth={2} /></>;
              return external ? <a key={href} href={href}>{inner}</a> : <Link key={href} href={href} onClick={() => setOpen(false)}>{inner}</Link>;
            })}
          </nav>
          <div className="kzMenuFollow">
            <span>{t("Bizi izləyin")}</span>
            <a href={siteContact.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><InstagramIcon size={22} /></a>
            <a href={siteContact.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok"><TikTokIcon size={21} /></a>
          </div>
        </div>
      </aside>
    </div>, document.body)}
  </>;
}
