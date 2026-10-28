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
  const pathname = usePathname();
  const [favoritesPage, setFavoritesPage] = useState(false);
  const [query, setQuery] = useState("");
  useEffect(() => {
    const sync = () => {
      const params = new URLSearchParams(window.location.search);
      setFavoritesPage(pathname === "/" && params.has("favorites"));
      setQuery(pathname === "/" ? (params.get("q") || "").slice(0, 120) : "");
    };
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
        if (active) { setSignedIn(!!data.user);setAccountId(data.user?.id||"");setAccountName(data.user?.display_name||"");setAccountPhone(data.user?.phone||""); }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return (
    <>
      <header className="kzHeader">
        <div className="kzHeaderInner">
          <SiteMenu />
          <a className="kzLogo" href="/" aria-label="kirayeal.az — ana səhifə">kirayeal<span>.az</span></a>
          <form className="kzSearch" action="/" method="get" role="search" aria-label={t("Axtarış")} onSubmit={event=>{
            if (pathname !== "/") return;
            // The home catalog searches in place, keeping the chosen filters.
            event.preventDefault();
            const value = query.trim();
            const url = new URL(window.location.href);
            if (value) url.searchParams.set("q", value); else url.searchParams.delete("q");
            url.hash = "elanlar";
            window.history.replaceState(null, "", url);
            if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
            window.dispatchEvent(new CustomEvent("kiraye:search", {detail: value}));
          }}>
            <NavigationIcon name="search"/>
            <input name="q" type="search" maxLength={120} value={query} onChange={event=>setQuery(event.target.value)} placeholder={t("Elan axtar")} aria-label={t("Elan axtar")} autoComplete="off" enterKeyHint="search" />
            <button type="submit">{t("Axtar")}</button>
          </form>
          <nav className="kzHeaderNav" aria-label="Əsas menyu">
            <a href="/?favorites=1#elanlar" aria-current={favoritesPage?"page":undefined} title={t("Seçilmişlər")}><NavigationIcon name="heart"/><span>{t("Seçilmişlər")}</span></a>
            <Link href="/messages" aria-current={pathname === "/messages" ? "page" : undefined} title={t("Mesajlar")}><NavigationIcon name="message"/><span>{t("Mesajlar")}</span>{accountId&&<UnreadMessages key={accountId} userId={accountId}/>}</Link>
            {signedIn && accountId
              ? <AccountMenu key={accountId} userId={accountId} initialName={accountName} initialPhone={accountPhone}/>
              : <Link href="/login" title={t("Daxil ol")}><NavigationIcon name="account"/><span>{t("Daxil ol")}</span></Link>}
          </nav>
          <LanguageSelect />
          <Link className="kzPublish" href="/new">
            <NavigationIcon name="plus"/><span>{t("Yeni elan")}</span>
          </Link>
        </div>
      </header>
      <nav className="kzTabbar" aria-label="Mobil menyu">
        <a href="/" aria-current={pathname === "/" && !favoritesPage ? "page" : undefined}>
          <NavigationIcon name="home"/><span>{t("Əsas")}</span>
        </a>
        <a href="/?favorites=1#elanlar" aria-current={favoritesPage ? "page" : undefined}>
          <NavigationIcon name="heart"/><span>{t("Seçilmişlər")}</span>
        </a>
        <Link className="kzTabbarPublish" href="/new" aria-current={pathname === "/new" || pathname?.startsWith("/edit/") ? "page" : undefined}>
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
