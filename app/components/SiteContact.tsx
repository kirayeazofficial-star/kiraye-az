"use client";
import { siteContact } from '../../lib/site-contact';
import { useLanguage } from './LanguageProvider';
export default function SiteContact(){const{t}=useLanguage();return <section className="siteContact" aria-label={t("Bizimlə əlaqə")}><strong>{t("Bizimlə əlaqə")}</strong><a href={siteContact.phoneHref}>{siteContact.phone}</a><a href={`mailto:${siteContact.email}`}>{siteContact.email}</a><div className="socialLinks"><a href={siteContact.instagram} target="_blank" rel="noopener noreferrer">Instagram</a><a href={siteContact.tiktok} target="_blank" rel="noopener noreferrer">TikTok</a></div></section>}
