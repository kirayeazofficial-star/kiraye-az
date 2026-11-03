"use client";
import { useLanguage } from './LanguageProvider';
import ContactLinks from './ContactLinks';
export default function SiteContact(){const{t}=useLanguage();return <section className="siteContact kzContactCard" aria-label={t("Bizimlə əlaqə")}><strong>{t("Bizimlə əlaqə")}</strong><ContactLinks /></section>}
