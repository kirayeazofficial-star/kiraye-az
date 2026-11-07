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
          <p>{t("Ehtiyacınız olanı almaq məcburiyyətində deyilsiniz.")}</p>
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
          <Link href="/magaza">{t("Mağazalar")}</Link>
          <Link href="/rules">{t("Qaydalar və təhlükəsizlik")}</Link>
          <Link href="/privacy">{t("Məxfilik")}</Link>
          <Link href="/terms">{t("İstifadəçi razılaşması")}</Link>
          <Link href="/new">{t("Elan yerləşdir")}</Link>
        </nav>
        <div>
          <strong>{t("Bizimlə əlaqə")}</strong>
          <span className="kzDrawerSocial kzFooterSocial">
            <a className="mail" href={`mailto:${siteContact.email}`}><span><Mail aria-hidden="true" size={16} strokeWidth={1.9} /></span>{t("Bizə yazın")}</a>
            <a className="ig" href={siteContact.instagram} target="_blank" rel="noopener noreferrer"><span><InstagramIcon size={16} /></span>Instagram</a>
            <a className="tt" href={siteContact.tiktok} target="_blank" rel="noopener noreferrer"><span><TikTokIcon size={15} /></span>TikTok</a>
          </span>
        </div>
      </div>
      {/* Places: short link lists for people and search engines (same pages as the city filter). */}
      <div className="kzFooterBottom">© {new Date().getFullYear()} kirayeal.az</div>
    </footer>
  );
}
