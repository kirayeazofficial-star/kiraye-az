"use client";
import { useLanguage } from "./LanguageProvider";
import { siteContact } from "../../lib/site-contact";
import Link from "next/link";
import { Mail } from "lucide-react";
import { InstagramIcon, TikTokIcon } from "./BrandIcons";
export default function Footer() {
  const {t} = useLanguage();
  // On phones the place lists start folded (open on computers); the links stay in the page either way.
  return (
    <footer className="kzFooter">
      <div className="kzFooterInner">
        <div className="kzFooterBrand">
          <Link href="/" className="kzLogo">kirayeal<span>.az</span></Link>
          <p>{t("Ehtiyacın olanı almalı deyilsən.")}</p>
        </div>
        <nav aria-label={t("Populyar kateqoriyalar")}>
          <strong>{t("Kateqoriyalar")}</strong>
          <a href="/kiraye-ev">{t("Ev və mənzil")}</a>
          <a href="/kiraye-masin">{t("Avtomobil")}</a>
          <a href="/kiraye-motosiklet">{t("Motosiklet")}</a>
          <a href="/kiraye-villa">{t("Villa və bağ")}</a>
          <a href="/kiraye-aletler">{t("Alətlər və texnika")}</a>
        </nav>
        <nav aria-label={t("Məlumat və kömək")}>
          <strong>{t("Məlumat")}</strong>
          <Link href="/help">{t("Kömək")}</Link>
          <Link href="/rules">{t("Qaydalar və təhlükəsizlik")}</Link>
          <Link href="/privacy">{t("Məxfilik")}</Link>
          <Link href="/terms">{t("İstifadəçi razılaşması")}</Link>
          <Link href="/new">{t("Elan yerləşdir")}</Link>
        </nav>
        <div>
          <strong>{t("Bizimlə əlaqə")}</strong>
          <a className="kzContactLine" href={`mailto:${siteContact.email}`}><Mail aria-hidden="true" size={15} strokeWidth={2} />{siteContact.email}</a>
          <span className="kzSocial">
            <a href={siteContact.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><InstagramIcon size={15} />Instagram</a>
            <a href={siteContact.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok"><TikTokIcon size={15} />TikTok</a>
          </span>
        </div>
      </div>
      {/* Places: short link lists for people and search engines (same pages as the city filter). */}
      <div className="kzFooterBottom">© {new Date().getFullYear()} kirayeal.az</div>
    </footer>
  );
}
