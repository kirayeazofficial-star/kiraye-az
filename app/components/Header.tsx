"use client";
import SiteMenu from "./SiteMenu";
import LanguageSelect from "./LanguageSelect";
import { useLanguage } from "./LanguageProvider";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "../../lib/supabase";
export default function Header() {
  const {t} = useLanguage();
  const [signedIn, setSignedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const pathname = usePathname();
  const [favoritesPage, setFavoritesPage] = useState(false);
  useEffect(() => {
    const sync = () => setFavoritesPage(pathname === "/" && new URLSearchParams(window.location.search).has("favorites"));
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [pathname]);
  const accountPage = ["/profile", "/account", "/balance", "/admin"].some(path => pathname === path || pathname?.startsWith(path + "/"));
  useEffect(() => {
    if (!supabase) { setAuthReady(true); return; }
    let active = true;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) { setSignedIn(!!session); setAuthReady(true); }
    });
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) { setSignedIn(!!data.session); setAuthReady(true); }
      })
      .catch(() => { if (active) setAuthReady(true); });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return (
    <>
      <header className="header">
        <div className="headerBrand"><SiteMenu /><a className="logo" href="/">
          kirayeal<span>.az</span>
          <small>{t("KİRAYƏ ÜÇÜN BİR ÜNVAN")}</small>
        </a></div>
        <nav aria-label="Əsas menyu">
          <a href="/#elanlar">{t("Elanlar")}</a>
          <a href="/?favorites=1#elanlar">{t("♡ Seçilmişlər")}</a>
          <Link href="/help">{t("Kömək")}</Link>
        </nav>
        <div className="headerActions">
          <LanguageSelect />
          <Link className={`accountLink${signedIn ? " signedAccountLink" : " guestAccountLink"}`} href={signedIn ? "/profile" : "/login"}>
            {signedIn ? t("Hesabım") : t("Daxil ol")}
          </Link>
          {authReady && !signedIn && <Link className="mobileSignupLink" href="/login?mode=signup">
            {t("Qeydiyyatdan keç")}
          </Link>}
          <Link className="add" href="/new">
            {t("+ Elan yerləşdir")}</Link>
        </div>
      </header>
      <nav className="mobileNav" aria-label="Mobil menyu">
        <a href="/" aria-current={pathname === "/" && !favoritesPage ? "page" : undefined}>
          ⌂<span>{t("Ana səhifə")}</span>
        </a>
        <a href="/?favorites=1#elanlar" aria-current={favoritesPage ? "page" : undefined}>
          ♡<span>{t("Seçilmişlər")}</span>
        </a>
        <Link className="mobilePublish" href="/new" aria-current={pathname === "/new" || pathname?.startsWith("/edit/") ? "page" : undefined}>
          +<span>{t("Elan yerləşdir")}</span>
        </Link>
        <Link href={signedIn ? "/profile" : "/login"} aria-current={accountPage || pathname === "/login" ? "page" : undefined}>
          ◎<span>{signedIn ? t("Hesabım") : t("Daxil ol")}</span>
        </Link>
      </nav>
    </>
  );
}
