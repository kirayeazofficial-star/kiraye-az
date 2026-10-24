"use client";
import SiteMenu from "./SiteMenu";
import LanguageSelect from "./LanguageSelect";
import { useLanguage } from "./LanguageProvider";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
export default function Header() {
  const {t} = useLanguage();
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setSignedIn(!!session);
    });
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSignedIn(!!data.session);
      })
      .catch(() => {});
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
          <Link className={`accountLink${signedIn ? "" : " guestAccountLink"}`} href={signedIn ? "/profile" : "/login"}>
            {signedIn ? t("Hesabım") : t("Daxil ol")}
          </Link>
          {!signedIn && <Link className="mobileSignupLink" href="/login?mode=signup">
            {t("Qeydiyyatdan keç")}
          </Link>}
          <Link className="add" href="/new">
            {t("+ Elan yerləşdir")}</Link>
        </div>
      </header>
      <nav className="mobileNav" aria-label="Mobil menyu">
        <Link href="/">
          ⌂<span>{t("Ana səhifə")}</span>
        </Link>
        <a href="/?favorites=1#elanlar">
          ♡<span>{t("Seçilmişlər")}</span>
        </a>
        <Link className="mobilePublish" href="/new">
          +<span>{t("Elan yerləşdir")}</span>
        </Link>
        <Link href={signedIn ? "/profile" : "/login"}>
          ◎<span>{signedIn ? t("Hesabım") : t("Daxil ol")}</span>
        </Link>
      </nav>
    </>
  );
}
