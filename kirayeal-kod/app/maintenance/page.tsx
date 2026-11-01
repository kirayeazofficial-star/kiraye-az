import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { maintenance } from "../../lib/host/site-flags";
import { siteContact } from "../../lib/site-contact";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Texniki iş — kirayeal.az", robots: { index: false, follow: false } };

// Shown to visitors while maintenance mode is on (the proxy sends them here with HTTP 503).
export default async function MaintenancePage() {
  const settings = await maintenance().catch(() => ({ enabled: false, text: "" }));
  return <main className="kzWorks">
    <div className="kzWorksCard">
      <p className="kzWorksLogo">kirayeal<span>.az</span></p>
      <span className="kzWorksIcon" aria-hidden="true"><Wrench size={30} strokeWidth={1.9} /></span>
      <h1>Saytda texniki iş gedir</h1>
      <p>{settings.text || "Saytı sizin üçün daha yaxşı edirik. Tezliklə qayıdacağıq — bir az sonra yenidən daxil olun."}</p>
      <p className="kzWorksMail">Sualınız varsa: <a href={`mailto:${siteContact.email}`}>{siteContact.email}</a></p>
    </div>
  </main>;
}
