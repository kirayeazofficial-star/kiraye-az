import type { Metadata } from "next";
import { BadgeCheck, Bike, Camera, Car, Check, Clock, FileText, Hammer, House, Mail, RefreshCw, ShieldCheck, TreePalm, Wrench } from "lucide-react";
import { InstagramIcon } from "../components/BrandIcons";
import { maintenance } from "../../lib/host/site-flags";
import { siteContact } from "../../lib/site-contact";
import { WorksCountdown, WorksWatch } from "./WorksLive";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Texniki işlər — kirayeal.az", robots: { index: false, follow: false } };

const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
// "2026-11-01T18:00" (Baku time, as typed in the panel) → "1 noyabr, 18:00"
const when = (value: string) => { const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})$/); return m ? `${Number(m[3])} ${months[Number(m[2]) - 1]}, ${m[4]}` : ""; };

// The site's own advert on the side: what can be rented here.
const promo = [{ icon: House, name: "Ev və mənzil" }, { icon: Car, name: "Avtomobil" }, { icon: Bike, name: "Motosiklet" }, { icon: TreePalm, name: "Villa və bağ" }, { icon: Hammer, name: "Alətlər və texnika" }, { icon: Camera, name: "Foto və video" }];
const kept = ["Elanlarınız və şəkilləriniz", "Mesajlarınız", "Seçilmiş elanlarınız", "Hesab məlumatlarınız"];
// Something useful to read while waiting: short rental safety advice.
const tips = [
  { icon: ShieldCheck, title: "Əvvəlcədən ödəniş etməyin", text: "Evi və ya nəqliyyat vasitəsini görmədən beh, depozit və ya ilkin ödəniş göndərməyin." },
  { icon: FileText, title: "Şərtləri yazılı razılaşdırın", text: "Qiymət, müddət, depozit və kommunal xərclər müqavilədə və ya yazışmada aydın göstərilsin." },
  { icon: Camera, title: "Təhvil anını qeydə alın", text: "Açarı və ya maşını təhvil alarkən mövcud vəziyyəti şəkil və videoya çəkin." },
  { icon: BadgeCheck, title: "Sənədləri yoxlayın", text: "Mülkiyyət sənədini, avtomobildə isə texniki pasportu və sığortanı yoxlayın." },
];

// Shown to visitors while maintenance mode is on (the proxy sends them here with HTTP 503).
export default async function MaintenancePage() {
  const settings = await maintenance().catch(() => ({ enabled: false, text: "", until: "" }));
  const back = when(settings.until);
  return <div className="kzMt">
    <WorksWatch active={settings.enabled} />
    <header className="kzMtHead">
      <div className="kzMtBar">
        <p className="kzMtLogo">kirayeal<span>.az</span></p>
        <a className="kzMtInsta" href={siteContact.instagram} target="_blank" rel="noopener noreferrer"><InstagramIcon size={17} /><span>Instagram</span></a>
      </div>
    </header>
    <div className="kzMtAlert" role="status"><span aria-hidden="true"><Wrench size={16} strokeWidth={2.2} /></span><p><b>Diqqət!</b> Saytda texniki işlər aparılır. Sayt müvəqqəti olaraq əlçatan deyil.</p></div>

    <main className="kzMtMain">
      <section className="kzMtCard" aria-labelledby="mt-title">
        <div className="kzMtTitle">
          <span className="kzMtIcon" aria-hidden="true"><Wrench size={30} strokeWidth={1.9} /></span>
          <div><span className="kzMtBadge">Texniki işlər</span><h1 id="mt-title">Saytda planlı texniki işlər aparılır</h1></div>
        </div>
        <p className="kzMtLead">Hörmətli istifadəçilər! Xidmət keyfiyyətinin artırılması məqsədilə kirayeal.az platformasında planlı texniki işlər aparılır. Bu səbəbdən saytın fəaliyyəti müvəqqəti olaraq dayandırılmışdır. Texniki işlər başa çatdıqdan sonra bütün xidmətlər əvvəlki qaydada bərpa olunacaq. Yaranmış narahatlığa görə üzr istəyir, anlayışınız üçün təşəkkür edirik.</p>
        {settings.text && <p className="kzMtNote">{settings.text}</p>}
        {back && <div className="kzMtTime"><Clock aria-hidden="true" size={18} strokeWidth={2} /><span>Təxmini bərpa vaxtı: <b>{back}</b></span><WorksCountdown until={settings.until} /></div>}
        <div className="kzMtKept">
          <h2>Məlumatlarınız tam qorunur</h2>
          <ul>{kept.map(item => <li key={item}><Check aria-hidden="true" size={16} strokeWidth={2.5} />{item}</li>)}</ul>
        </div>
        <p className="kzMtAuto"><RefreshCw aria-hidden="true" size={15} strokeWidth={2} />Səhifəni bağlamayın: sayt açılan kimi avtomatik olaraq ana səhifəyə keçəcəksiniz.</p>
      </section>

      <aside className="kzMtSide" aria-label="Faydalı məlumat">
        <div className="kzMtPromo">
          <p className="kzMtPromoLogo">kirayeal<span>.az</span></p>
          <strong>Ehtiyacın olanı almalı deyilsən — kirayələ.</strong>
          <p>Azərbaycanda ev, avtomobil və digər əşyaların kirayə elanları bir yerdə.</p>
          <ul>{promo.map(({ icon: Icon, name }) => <li key={name}><Icon aria-hidden="true" size={16} strokeWidth={2} />{name}</li>)}</ul>
        </div>
        <h2>Kirayə üzrə faydalı tövsiyələr</h2>
        <div className="kzMtTips">{tips.map(({ icon: Icon, title, text }) => <article key={title}><span aria-hidden="true"><Icon size={20} strokeWidth={1.9} /></span><h3>{title}</h3><p>{text}</p></article>)}</div>
        <div className="kzMtFollow">
          <div><strong>Yeniliklərdən ilk siz xəbərdar olun</strong><p>Saytın açılışı və yeni elanlar haqqında məlumat Instagram səhifəmizdə paylaşılır.</p></div>
          <a href={siteContact.instagram} target="_blank" rel="noopener noreferrer"><InstagramIcon size={17} />İzləyin</a>
        </div>
      </aside>
    </main>

    <footer className="kzMtFoot">
      <a href={`mailto:${siteContact.email}`}><Mail aria-hidden="true" size={15} strokeWidth={2} />{siteContact.email}</a>
      <span>© {new Date().getFullYear()} kirayeal.az</span>
    </footer>
  </div>;
}
