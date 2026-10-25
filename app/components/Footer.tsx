"use client";
import { useLanguage } from "./LanguageProvider";
import SiteContact from "./SiteContact";
import Link from "next/link";
export default function Footer() {
  const {t} = useLanguage();
  return (
    <footer className="siteFooter">
      <div className="footerBrand">
        <Link href="/" className="logo">
          kirayeal<span>.az</span>
        </Link>
        <p>{t("Ehtiyacın olanı almalı deyilsən.")}</p>
      </div>
      <SiteContact />
      <nav className="footerGroup" aria-label={t("Populyar kateqoriyalar")}>
        <strong>{t("Populyar kateqoriyalar")}</strong>
        <a href="/kiraye-ev">{t("Ev və mənzil")}</a>
        <a href="/kiraye-masin">{t("Avtomobil")}</a>
        <a href="/?category=motorcycle#elanlar">{t("Motosiklet")}</a>
        <a href="/?category=villa#elanlar">{t("Villa və bağ")}</a>
        <a href="/?category=equipment#elanlar">{t("Alətlər və texnika")}</a>
        <a href="/?category=clothing#elanlar">{t("Geyim və aksesuar")}</a>
      </nav>
      <nav className="footerGroup footerLinks" aria-label={t("Məlumat və kömək")}>
        <strong>{t("Məlumat və kömək")}</strong>
        <Link href="/new">{t("Elan yerləşdir")}</Link>
        <Link href="/profile">{t("Şəxsi kabinet")}</Link>
        <Link href="/rules">{t("Qaydalar və təhlükəsizlik")}</Link>
        <Link href="/help">{t("Kömək")}</Link>
        <Link href="/privacy">{t("Məxfilik")}</Link>
      </nav>
      <small className="footerCopyright">© {new Date().getFullYear()} kirayeal.az</small>
    </footer>
  );
}
