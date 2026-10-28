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
import CategoryVisual from "./CategoryVisual";
import { categories } from "../../lib/marketplace";
export default function Header() {
  const {t} = useLanguage();
  const [accountId,setAccountId]=useState(""),[accountName,setAccountName]=useState(""),[accountPhone,setAccountPhone]=useState("");
  const [signedIn, setSignedIn] = useState(false);
  const pathname = usePathname();
  const [favoritesPage, setFavoritesPage] = useState(false);
  const [query, setQuery] = useState("");
  const [catalogOpen, setCatalogOpen] = useState(false);
  useEffect(() => {
    const open = () => setCatalogOpen(true);
    window.addEventListener("kiraye:catalog", open);
    return () => window.removeEventListener("kiraye:catalog", open);
  }, []);
  useEffect(() => {
    if (!catalogOpen) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (event instanceof PointerEvent && (event.target as Element)?.closest?.(".kzCatalog")) return;
      setCatalogOpen(false);
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", close);
    return () => { window.removeEventListener("pointerdown", close); window.removeEventListener("keydown", close); };
  }, [catalogOpen]);
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
      <header className={`kzHeader${["/profile","/account","/balance","/admin","/messages","/new","/edit"].some(path => pathname === path || pathname?.startsWith(path + "/")) ? " kzHeaderCompact" : ""}`}>
        <div className="kzHeaderInner">
          <SiteMenu />
          <a className="kzLogo" href="/" aria-label="kirayeal.az — ana səhifə">kirayeal<span>.az</span></a>
          <div className="kzCatalog">
            <button type="button" className="kzCatalogButton" aria-expanded={catalogOpen} aria-controls="kz-catalog" onClick={() => setCatalogOpen(!catalogOpen)}>
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>
              <span>{t("Kataloq")}</span>
            </button>
            {catalogOpen && <nav id="kz-catalog" className="kzCatalogPanel" aria-label={t("Kateqoriyalar")}>
              <div className="kzCatalogHead"><strong>{t("Kataloq")}</strong><button type="button" aria-label={t("Bağla")} onClick={() => setCatalogOpen(false)}>×</button></div>
              {categories.map(item => <a key={item.id} href={`/?category=${item.id}#elanlar`}><CategoryVisual id={item.id}/><span>{t(item.name)}</span></a>)}
            </nav>}
          </div>
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
            <input name="q" type="search" maxLength={120} value={query} onChange={event=>setQuery(event.target.value)} placeholder={t("Ev, maşın, avadanlıq axtar")} aria-label={t("Elan axtar")} autoComplete="off" enterKeyHint="search" />
            <button type="submit">{t("Axtar")}</button>
          </form>
          <nav className="kzHeaderNav" aria-label="Əsas menyu">
            <a href="/?favorites=1#elanlar" aria-current={favoritesPage?"page":undefined} title={t("Seçilmişlər")} aria-label={t("Seçilmişlər")}><NavigationIcon name="heart"/></a>
            <Link href="/messages" aria-current={pathname === "/messages" ? "page" : undefined} title={t("Mesajlar")} aria-label={t("Mesajlar")}><NavigationIcon name="message"/>{accountId&&<UnreadMessages key={accountId} userId={accountId}/>}</Link>
            {signedIn && accountId
              ? <AccountMenu key={accountId} userId={accountId} initialName={accountName} initialPhone={accountPhone}/>
              : <Link className="kzGuest" href="/login"><span className="kzAvatar"><NavigationIcon name="account"/></span><span>{t("Daxil ol")}</span></Link>}
          </nav>
          <Link className="kzPublish" href="/new">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg><span>{t("Yeni elan")}</span>
          </Link>
          <LanguageSelect />
          <Link className="kzMobilePublish" href="/new" aria-label={t("Yeni elan")}>
            <svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="currentColor"/><path d="M12 7v10M7 12h10" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/></svg>
          </Link>
        </div>
      </header>
      <nav className={`kzTabbar${pathname?.startsWith("/listings/") ? " kzTabbarHidden" : ""}`} aria-label="Mobil menyu">
        <a href="/" aria-current={pathname === "/" && !favoritesPage ? "page" : undefined}>
          <NavigationIcon name="home"/><span>{t("Əsas")}</span>
        </a>
        <a href="/?favorites=1#elanlar" aria-current={favoritesPage ? "page" : undefined}>
          <NavigationIcon name="heart"/><span>{t("Seçilmişlər")}</span>
        </a>
        <Link className="kzTabbarPublish" href="/new" aria-current={pathname === "/new" || pathname?.startsWith("/edit/") ? "page" : undefined}>
          <span className="kzTabPlus" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg></span><span>{t("Yeni elan")}</span>
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
