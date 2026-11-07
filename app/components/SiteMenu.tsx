"use client";
import TabIcon from "./TabIcon";
import { Bike, Car, ChevronRight, CirclePlus, Hammer, Heart, House, LayoutGrid, LifeBuoy, Lock, Menu, MessageCircle, ShieldCheck, Store, TreePalm, User, X, type LucideIcon, FileText } from "lucide-react";
import UserAvatar from "./UserAvatar";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SiteContact from "./SiteContact";
import LanguageSelect from "./LanguageSelect";
import { useLanguage } from "./LanguageProvider";

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

const menuCategories: [string, string, LucideIcon][] = [
  ["property", "Ev və mənzil", House],
  ["car", "Avtomobil", Car],
  ["motorcycle", "Motosiklet", Bike],
  ["villa", "Villa və bağ", TreePalm],
  ["equipment", "Alətlər və texnika", Hammer],
];
const otherLinks: [string, string, LucideIcon][] = [
  ["/magaza", "Mağazalar", Store],
  ["/help", "Kömək", LifeBuoy],
  ["/rules", "Qaydalar və təhlükəsizlik", ShieldCheck],
  ["/privacy", "Məxfilik", Lock],
];

export default function SiteMenu() {
  const {t}=useLanguage();
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState<{ name: string; number: string; avatar: string | null } | null | undefined>(undefined);
  useEffect(() => {
    if (!open) return;
    let active = true;
    fetch("/api/auth/host", { cache: "no-store" }).then(r => r.json()).then(async data => {
      if (!data?.user) { if (active) setAccount(null); return; }
      const profile = await fetch("/api/account/profile", { cache: "no-store" }).then(r => r.ok ? r.json() : null).catch(() => null);
      if (active) setAccount({ name: profile?.profile?.name || data.user.display_name || data.user.email || "", number: profile?.profile?.profile_no ? String(profile.profile.profile_no) : "", avatar: profile?.profile?.avatar_url || null });
    }).catch(() => { if (active) setAccount(null); });
    return () => { active = false; };
  }, [open]);
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
          {account ? <Link className="kzDrawerAccount" href="/profile" onClick={() => setOpen(false)}>
            <UserAvatar src={account.avatar} name={account.name} />
            <span className="kzDrawerAccountText"><strong>{account.name || t("Hesabım")}</strong>{account.number && <small>ID {account.number}</small>}</span>
            <ChevronRight className="kzDrawerChevron" aria-hidden="true" size={22} strokeWidth={2.2} />
          </Link> : account === null ? <div className="kzDrawerAuth">
            <Link className="main" href="/login" onClick={() => setOpen(false)}>{t("Daxil ol")}</Link>
            <Link href="/login?mode=signup" onClick={() => setOpen(false)}>{t("Qeydiyyat")}</Link>
          </div> : <div className="kzDrawerAccount placeholder" aria-hidden="true" />}
          <Link className="kzDrawerCta" href="/new" onClick={() => setOpen(false)}><CirclePlus aria-hidden="true" size={18} strokeWidth={2.2} />{t("Elan yerləşdir")}</Link>
          <p className="kzDrawerHead">{t("Kateqoriyalar")}</p>
          <nav aria-label={t("Kateqoriyalar")}>
            {menuCategories.map(([id, name, Icon]) => <a key={id} className="kzDrawerRow" href={`/?category=${id}#elanlar`} onClick={() => setOpen(false)}><Icon aria-hidden="true" size={19} strokeWidth={1.8} /><span>{t(name)}</span><ChevronRight className="kzDrawerChevron" aria-hidden="true" size={18} strokeWidth={2} /></a>)}
            <button type="button" className="kzDrawerRow more" onClick={() => { setOpen(false); window.dispatchEvent(new Event("kiraye:catalog")); }}><span>{t("Bütün kateqoriyalar")}</span><ChevronRight className="kzDrawerChevron" aria-hidden="true" size={18} strokeWidth={2} /></button>
          </nav>
          <p className="kzDrawerHead">{t("Digər")}</p>
          <nav aria-label={t("Məlumat və kömək")}>
            {otherLinks.map(([href, name, Icon]) => <Link key={href} className="kzDrawerRow" href={href} onClick={() => setOpen(false)}><Icon aria-hidden="true" size={19} strokeWidth={1.8} /><span>{t(name)}</span><ChevronRight className="kzDrawerChevron" aria-hidden="true" size={18} strokeWidth={2} /></Link>)}
          </nav>
        </div>
        <div className="kzDrawerFoot"><LanguageSelect /><SiteContact compact /></div>
      </aside>
    </div>, document.body)}
  </>;
}
