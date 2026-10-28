"use client";
import AccountMenu from "./AccountMenu";
import NavigationIcon from "./NavigationIcon";
import UnreadMessages from "./UnreadMessages";
import SiteMenu from "./SiteMenu";
import LanguageSelect from "./LanguageSelect";
import { useLanguage } from "./LanguageProvider";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
export default function Header() {
  const {t} = useLanguage();
  const [accountId,setAccountId]=useState(""),[accountName,setAccountName]=useState(""),[accountPhone,setAccountPhone]=useState("");
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
    let active = true;
    fetch('/api/auth/host',{cache:'no-store'})
      .then(response=>response.json())
      .then((data) => {
        if (active) { setSignedIn(!!data.user);setAccountId(data.user?.id||"");setAccountName(data.user?.display_name||"");setAccountPhone(data.user?.phone||""); setAuthReady(true); }
      })
      .catch(() => { if (active) setAuthReady(true); });
    return () => {
      active = false;
    };
  }, []);
  return (
    <>
      <header className={`header${signedIn?" isSignedIn":""}`}>
        <div className="headerBrand"><SiteMenu /><a className="logo" href="/">
          kirayeal<span>.az</span>
          <small>{t("KİRAYƏ ÜÇÜN BİR ÜNVAN")}</small>
        </a></div>
        <nav aria-label="Əsas menyu">
          <a href="/#elanlar">{t("Elanlar")}</a>
          <a href="/?favorites=1#elanlar"><NavigationIcon name="heart"/>{t("Seçilmişlər")}</a>
          <Link href="/help">{t("Kömək")}</Link>
          <Link className="desktopMessagesLink" href="/messages"><NavigationIcon name="message"/>{t("Mesajlar")}{accountId&&<UnreadMessages key={accountId} userId={accountId}/>}</Link>
        </nav>
        <div className="headerActions">
          <LanguageSelect />
          {signedIn && accountId ? <AccountMenu key={accountId} userId={accountId} initialName={accountName} initialPhone={accountPhone}/> : <Link className="accountLink guestAccountLink" href="/login">{t("Daxil ol")}</Link>}
          {authReady && !signedIn && <Link className="mobileSignupLink" href="/login?mode=signup">
            {t("Qeydiyyatdan keç")}
          </Link>}
          <Link className="add headerPublish" href="/new" aria-label={t("Elan yerləşdir")}>
            <span className="desktopPublishLabel">{t("+ Elan yerləşdir")}</span>
            <span className="mobilePublishLabel"><NavigationIcon name="plus"/><span>{t("Elan")}</span></span>
          </Link>
        </div>
      </header>
      <nav className="mobileNav" aria-label="Mobil menyu">
        <a href="/" aria-current={pathname === "/" && !favoritesPage ? "page" : undefined}>
          <NavigationIcon name="home"/><span>{t("Əsas")}</span>
        </a>
        <a href="/?favorites=1#elanlar" aria-current={favoritesPage ? "page" : undefined}>
          <NavigationIcon name="heart"/><span>{t("Seçilmişlər")}</span>
        </a>
        <Link className="mobilePublish" href="/new" aria-current={pathname === "/new" || pathname?.startsWith("/edit/") ? "page" : undefined}>
          <NavigationIcon name="plus"/><span>{t("Yeni elan")}</span>
        </Link>
        <Link href="/messages" aria-current={pathname === "/messages" ? "page" : undefined}>
          <NavigationIcon name="message"/><span>{t("Mesajlar")}</span>{accountId&&<UnreadMessages key={accountId} userId={accountId}/>}
        </Link>
        <Link href={signedIn ? "/profile" : "/login"} aria-current={accountPage || pathname === "/login" ? "page" : undefined}>
          <NavigationIcon name="account"/><span>{t("Kabinet")}</span>
        </Link>
      </nav>
    </>
  );
}
