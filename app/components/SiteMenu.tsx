"use client";
import TabIcon from "./TabIcon";
import { ChevronRight, CirclePlus, Heart, LayoutGrid, LifeBuoy, Lock, Menu, MessageCircle, ShieldCheck, User, X, type LucideIcon, FileText } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SiteContact from "./SiteContact";
import LanguageSelect from "./LanguageSelect";
import { useLanguage } from "./LanguageProvider";
import CategoryVisual from "./CategoryVisual";
import { categories } from "../../lib/marketplace";

// Heart, messages and account use the same drawn icons as the bottom menu.
const HeartIcon = ((props: { size?: number }) => <TabIcon name="heart" size={props.size} />) as unknown as LucideIcon;
const ChatIcon = ((props: { size?: number }) => <TabIcon name="chat" size={props.size} />) as unknown as LucideIcon;
const UserIcon = ((props: { size?: number }) => <TabIcon name="user" size={props.size} />) as unknown as LucideIcon;
const primaryLinks: [string, string, LucideIcon, string][] = [
  ["/#elanlar", "Elanlar", LayoutGrid, "orange"],
  ["/?favorites=1", "Seçilmişlər", HeartIcon, "red"],
  ["/new", "Elan yerləşdir", CirclePlus, "green"],
  ["/messages", "Mesajlar", ChatIcon, "blue"],
  ["/profile", "Şəxsi kabinet", UserIcon, "purple"],
];
const helpLinks: [string, string, LucideIcon, string][] = [
  ["/help", "Kömək", LifeBuoy, "grey"],
  ["/rules", "Qaydalar və təhlükəsizlik", ShieldCheck, "grey"],
  ["/privacy", "Məxfilik", Lock, "grey"],
  ["/terms", "İstifadəçi razılaşması", FileText, "grey"],
];

export default function SiteMenu() {
  const {t}=useLanguage();
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState<{ name: string; email: string } | null | undefined>(undefined);
  useEffect(() => { if (!open || account !== undefined) return; fetch("/api/auth/host", { cache: "no-store" }).then(r => r.json()).then(data => setAccount(data?.user ? { name: data.user.display_name || "", email: data.user.email || "" } : null)).catch(() => setAccount(null)); }, [open, account]);
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
        {account ? <Link className="siteMenuAccount" href="/profile" onClick={() => setOpen(false)}>
          <span className="siteMenuAvatar" aria-hidden="true">{(account.name || account.email).trim().charAt(0).toLocaleUpperCase("az-AZ")}</span>
          <span className="siteMenuAccountText"><strong>{account.name || t("Hesabım")}</strong><small>{t("Şəxsi kabinet")}</small></span>
          <ChevronRight aria-hidden="true" size={20} strokeWidth={2} />
        </Link> : account === null ? <div className="siteMenuAuth">
          <Link className="siteMenuAuthMain" href="/login" onClick={() => setOpen(false)}>{t("Daxil ol")}</Link>
          <Link className="siteMenuAuthAlt" href="/login?mode=signup" onClick={() => setOpen(false)}>{t("Qeydiyyat")}</Link>
        </div> : null}
        <section className="siteMenuCats" aria-label={t("Kateqoriyalar")}>
          <strong>{t("Kateqoriyalar")}</strong>
          <div>{categories.map(c => <a key={c.id} href={`/?category=${c.id}#elanlar`} onClick={() => setOpen(false)}><CategoryVisual id={c.id} /><span>{t(c.name)}</span></a>)}</div>
        </section>
        <div className="siteMenuLanguage"><span>{t("Dil")}</span><LanguageSelect /></div>
        <nav className="siteMenuPrimary" aria-label={t("Sayt bölmələri")}>
          {primaryLinks.map(([href, title, Icon, tone]) => <Link key={href} href={href} onClick={() => setOpen(false)}><span className={`kzSideIcon ${tone}`}><Icon aria-hidden="true" size={18} strokeWidth={2} /></span><span>{t(title)}</span><ChevronRight className="kzSideArrow" aria-hidden="true" size={16} strokeWidth={2} /></Link>)}
        </nav>
        <nav className="siteMenuHelp" aria-label={t("Məlumat və kömək")}>
          {helpLinks.map(([href, title, Icon, tone]) => <Link key={href} href={href} onClick={() => setOpen(false)}><span className={`kzSideIcon ${tone}`}><Icon aria-hidden="true" size={18} strokeWidth={2} /></span><span>{t(title)}</span><ChevronRight className="kzSideArrow" aria-hidden="true" size={16} strokeWidth={2} /></Link>)}
        </nav>
        <SiteContact compact />
      </aside>
    </div>, document.body)}
  </>;
}
