"use client";
import Link from "next/link";
import { Mail, Plus } from "lucide-react";
import { siteContact } from "../../lib/site-contact";
import { useLanguage } from "./LanguageProvider";

// End of the Help page: no answer found → write to us; or post a listing.
export default function HelpContact() {
  const { t } = useLanguage();
  return <section className="kzHelpAsk" aria-label={t("Cavab tapmadınız?")}>
    <strong>{t("Cavab tapmadınız?")}</strong>
    <p>{t("Bizə e-poçtla yazın, ən qısa zamanda cavab verəcəyik.")}</p>
    <div>
      <a className="main" href={`mailto:${siteContact.email}`}><Mail aria-hidden="true" size={17} strokeWidth={2} />{t("Bizə yazın")}</a>
      <Link href="/new"><Plus aria-hidden="true" size={17} strokeWidth={2.2} />{t("Elan yerləşdir")}</Link>
    </div>
  </section>;
}
