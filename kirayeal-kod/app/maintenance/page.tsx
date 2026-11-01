import type { Metadata } from "next";
import { Clock, Mail, Wrench } from "lucide-react";
import { InstagramIcon } from "../components/BrandIcons";
import { maintenance } from "../../lib/host/site-flags";
import { siteContact } from "../../lib/site-contact";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Texniki iş — kirayeal.az", robots: { index: false, follow: false } };

const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
// "2026-11-01T18:00" (Baku time, as typed in the panel) → "1 noyabr, 18:00"
const when = (value: string) => { const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})$/); return m ? `${Number(m[3])} ${months[Number(m[2]) - 1]}, ${m[4]}` : ""; };

// Shown to visitors while maintenance mode is on (the proxy sends them here with HTTP 503).
export default async function MaintenancePage() {
  const settings = await maintenance().catch(() => ({ enabled: false, text: "", until: "" }));
  const back = when(settings.until);
  return <main className="kzWorks">
    <div className="kzWorksCard">
      <p className="kzWorksLogo">kirayeal<span>.az</span></p>
      <span className="kzWorksIcon" aria-hidden="true"><Wrench size={30} strokeWidth={1.9} /></span>
      <h1>Saytda texniki iş gedir</h1>
      <p>{settings.text || "Saytı sizin üçün daha yaxşı edirik. Elanlarınız və mesajlarınız yerindədir — tezliklə qayıdacağıq."}</p>
      {back && <p className="kzWorksTime"><Clock aria-hidden="true" size={17} strokeWidth={2} /><span>Təxmini qayıdış: <b>{back}</b></span></p>}
      <div className="kzWorksLinks">
        <a href={siteContact.instagram} target="_blank" rel="noopener noreferrer"><InstagramIcon size={17} />Instagram</a>
        <a href={`mailto:${siteContact.email}`}><Mail aria-hidden="true" size={17} strokeWidth={2} />{siteContact.email}</a>
      </div>
    </div>
    <p className="kzWorksFoot">© {new Date().getFullYear()} kirayeal.az</p>
  </main>;
}
