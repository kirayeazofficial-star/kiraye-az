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

const menuGroups = [
  { title: "Kömək və əlaqə", items: [
    { href: "/help", label: "Kömək", hint: "Suallar və cavablar", icon: LifeBuoy },
    { href: `mailto:${siteContact.email}`, label: "Bizə yazın", hint: siteContact.email, icon: Mail, external: true },
    { href: "/magaza", label: "Mağazalar", hint: "Bütün aktiv mağazalar", icon: Store },
  ] },
  { title: "Hüquqi məlumat", items: [
    { href: "/rules", label: "Qaydalar və təhlükəsizlik", hint: "Elan və kirayə qaydaları", icon: ShieldCheck },
    { href: "/privacy", label: "Məxfilik", hint: "Məlumatlarınız necə qorunur", icon: Lock },
    { href: "/terms", label: "İstifadəçi razılaşması", hint: "Saytdan istifadə şərtləri", icon: FileText },
  ] },
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
          <div className="kzMenuLang" role="group" aria-label={t("Dil seçimi")}>
            {languages.map(item => <button key={item.value} type="button" aria-label={item.name} aria-pressed={language === item.value} onClick={() => setLanguage(item.value)}>{item.label}</button>)}
          </div>
          <button className="siteMenuClose" type="button" aria-label={t("Menyunu bağla")} onClick={() => setOpen(false)}>
            <X aria-hidden="true" size={18} strokeWidth={2.2} />
          </button>
        </div>
        <div className="kzDrawerBody">
          {menuGroups.map(group => <section key={group.title} className="kzMenuGroup">
            <p className="kzMenuHead">{t(group.title)}</p>
            <nav className="kzMenuList" aria-label={t(group.title)}>
              {group.items.map(({ href, label, hint, icon: Icon, external }) => {
                const inner = <><span className="kzMenuIcon"><Icon aria-hidden="true" size={20} strokeWidth={1.9} /></span><span className="kzMenuText"><b>{t(label)}</b><small>{hint.includes("@") ? hint : t(hint)}</small></span><ChevronRight className="kzMenuChevron" aria-hidden="true" size={17} strokeWidth={2} /></>;
                return external ? <a key={href} href={href}>{inner}</a> : <Link key={href} href={href} onClick={() => setOpen(false)}>{inner}</Link>;
              })}
            </nav>
          </section>)}
          <div className="kzMenuFollow">
            <span>{t("Bizi izləyin")}</span>
            <div>
              <a href={siteContact.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><InstagramIcon size={22} /></a>
              <a href={siteContact.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok"><TikTokIcon size={21} /></a>
            </div>
            <p>© {new Date().getFullYear()} kirayeal.az</p>
          </div>
        </div>
      </aside>
    </div>, document.body)}
  </>;
}
