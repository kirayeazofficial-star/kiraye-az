"use client";
import { useLanguage } from "./LanguageProvider";
import SiteContact from "./SiteContact";
import Link from "next/link";
export default function Footer() {
  const {t} = useLanguage();
  return (
    <footer>
      <div>
        <Link href="/" className="logo">
          kirayeal<span>.az</span>
        </Link>
        <p>{t("Ehtiyacın olanı almalı deyilsən.")}</p>
      </div>
      <SiteContact />
      <div className="footerLinks">
        <Link href="/kiraye-masin">Kirayə maşın</Link>
        <Link href="/kiraye-ev">Kirayə ev</Link>
        <Link href="/new">{t("Elan yerləşdir")}</Link>
        <Link href="/profile">{t("Şəxsi kabinet")}</Link>
        <Link href="/rules">{t("Qaydalar və təhlükəsizlik")}</Link>
        <Link href="/help">{t("Kömək")}</Link>
        <Link href="/privacy">{t("Məxfilik")}</Link>
        <small>© {new Date().getFullYear()} kirayeal.az</small>
      </div>
    </footer>
  );
}
