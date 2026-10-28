"use client";
import NavigationIcon from "./NavigationIcon";
import SiteMenu from "./SiteMenu";
import LanguageSelect from "./LanguageSelect";
import { useLanguage } from "./LanguageProvider";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteContact } from "../../lib/site-contact";
export default function Header() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [favoritesPage, setFavoritesPage] = useState(false);
  useEffect(() => {
    const sync = () =>
      setFavoritesPage(
        pathname === "/" &&
          new URLSearchParams(window.location.search).has("favorites"),
      );
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [pathname]);
  return (
    <>
      <header className="header">
        <div className="headerBrand">
          <SiteMenu />
          <a className="logo" href="/">
            kirayeal<span>.az</span>
            <small>{t("KİRAYƏ ÜÇÜN BİR ÜNVAN")}</small>
          </a>
        </div>
        <nav aria-label="Əsas menyu">
          <a href="/#elanlar">{t("Elanlar")}</a>
          <a href="/?favorites=1#elanlar">
            <NavigationIcon name="heart" />
            {t("Seçilmişlər")}
          </a>
          <Link href="/help">{t("Kömək")}</Link>
        </nav>
        <div className="headerActions">
          <LanguageSelect />
          <a
            className="add headerPublish"
            href={siteContact.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("Elan yerləşdir")}
          >
            <span className="desktopPublishLabel">{t("+ Elan yerləşdir")}</span>
            <span className="mobilePublishLabel">
              <NavigationIcon name="plus" />
              <span>{t("Elan")}</span>
            </span>
          </a>
        </div>
      </header>
      <nav className="mobileNav" aria-label="Mobil menyu">
        <a
          href="/"
          aria-current={pathname === "/" && !favoritesPage ? "page" : undefined}
        >
          <NavigationIcon name="home" />
          <span>{t("Əsas")}</span>
        </a>
        <a
          href="/?favorites=1#elanlar"
          aria-current={favoritesPage ? "page" : undefined}
        >
          <NavigationIcon name="heart" />
          <span>{t("Seçilmişlər")}</span>
        </a>
        <a
          className="mobilePublish"
          href={siteContact.whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          <NavigationIcon name="plus" />
          <span>{t("Elan yerləşdir")}</span>
        </a>
        <Link
          href="/help"
          aria-current={pathname === "/help" ? "page" : undefined}
        >
          <NavigationIcon name="message" />
          <span>{t("Kömək")}</span>
        </Link>
      </nav>
    </>
  );
}
