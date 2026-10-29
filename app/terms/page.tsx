import type { Metadata } from "next";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "İstifadəçi razılaşması | kirayeal.az",
  description: "kirayeal.az saytından istifadə şərtləri: hesab, elanlar, ödənişli xidmətlər, məsuliyyət və mübahisələr.",
  alternates: { canonical: "/terms" },
};

// Adapted for a rental classifieds site run by "kirayeal.az administrasiyası" (no company, no business accounts).
const sections: { title: string; points: string[] }[] = [
  {
    title: "Ümumi şərtlər və terminlər",
    points: [
      "Bu Razılaşma https://kirayeal.az saytından (bundan sonra — Sayt) istifadə şərtlərini müəyyən edir. Saytdan istifadə edən hər kəs bu Razılaşmanı qəbul etmiş sayılır.",
      "Sayt — kirayeal.az ünvanında yerləşən internet-resurs, onun dizaynı, məlumat bazası və Saytda yerləşdirilmiş bütün məlumatlardır.",
      "Administrasiya — Saytı idarə edən kirayeal.az administrasiyasıdır. Sayta dair hüquqlar Administrasiyaya məxsusdur.",
      "İstifadəçi — bu Razılaşmanı qəbul edib Saytdan istifadə edən istənilən şəxsdir. Şəxsi kabinet — İstifadəçinin elanlarını, mesajlarını və hesab ayarlarını idarə etdiyi bölmədir. Şəxsi hesab — yalnız Saytdakı ödənişli xidmətlər üçün istifadə olunan balansdır.",
      "Saytdan istifadə etməklə İstifadəçi bu Razılaşmaya, Elan yerləşdirmə qaydalarına və Məxfilik siyasətinə əməl etməyi öhdəsinə götürür. Razı olmadıqda Saytdan istifadəni dayandırmalıdır.",
    ],
  },
  {
    title: "Hesab və təhlükəsizlik",
    points: [
      "Elan yerləşdirmək və mesaj yazmaq üçün qeydiyyat tələb olunur. Qeydiyyatda düzgün ad, işlək e-poçt və telefon nömrəsi göstərilməlidir.",
      "Bir şəxsin yalnız bir hesabı ola bilər. Başqasının adından və ya başqasının məlumatları ilə hesab yaratmaq qadağandır.",
      "Şifrənin gizli saxlanmasına İstifadəçi özü cavabdehdir. Hesabda edilən bütün hərəkətlər həmin hesabın sahibinin hərəkəti sayılır. Hesaba icazəsiz giriş şübhəsi olduqda şifrəni dərhal dəyişin.",
      "Administrasiya qeydiyyat məlumatlarının düzgünlüyünü yoxlamaq və lazım olduqda təsdiq istəmək hüququna malikdir, lakin İstifadəçinin həqiqətən göstərdiyi şəxs olduğuna zəmanət vermir.",
    ],
  },
  {
    title: "Elanlar və məzmun",
    points: [
      "Elanlar Elan yerləşdirmə qaydalarına uyğun yerləşdirilir. Elanın məzmununa (mətn, şəkil, qiymət, şərtlər) tam olaraq elan sahibi cavabdehdir.",
      "Elan yerləşdirməklə İstifadəçi təsdiq edir ki, əşyanı kirayəyə vermək hüququ var və şəkillərin istifadəsinə icazəsi var. İstifadəçi Administrasiyaya elanı və şəkilləri Saytda, axtarışda və Saytın reklamında göstərmək üçün pulsuz icazə verir.",
      "Qadağandır: qanuna zidd əşya və xidmətlər; saxta, aldadıcı və ya başqasının elanı; təhqiredici, ədəbsiz, nifrət oyadan məzmun; başqalarının şəxsi məlumatları; virus və zərərli keçidlər; spam və kütləvi eyni elanlar; elanda telefon nömrəsi və ya link yazmaqla qaydalardan yayınmaq.",
      "Administrasiya qaydalara uyğun olmayan elanı dərc etməmək, redaktə etmək, gizlətmək və ya silmək, həmçinin elanın göstərilmə müddətini dəyişmək hüququna malikdir.",
      "Kirayə razılaşması kirayə verən və kirayə götürən arasında birbaşa bağlanır. Sayt bu razılaşmanın tərəfi, vasitəçisi və ya zamini deyil.",
    ],
  },
  {
    title: "Hesabın məhdudlaşdırılması",
    points: [
      "Qaydalar dəfələrlə və ya ciddi şəkildə pozulduqda (dələduzluq, saxta elanlar, təhqir, spam) Administrasiya hesabı xəbərdarlıqsız məhdudlaşdıra və ya bloklaya bilər.",
      "Bloklanmış İstifadəçi Administrasiyanın icazəsi olmadan yeni hesab aça və ya başqasının hesabından istifadə edə bilməz.",
    ],
  },
  {
    title: "Ödənişli xidmətlər",
    points: [
      "Saytda ödənişli xidmətlər təklif oluna bilər: İrəli çək, VIP, Premium, limitdən artıq elan və elanın bərpası. Qiymətlər və şərtlər ödənişdən əvvəl göstərilir.",
      "Ödənişli xidmət elanın qaydalara uyğunluğunu yoxlamadan azad etmir. Qaydaları pozan elan silindikdə və ya gizlədildikdə ödənilmiş məbləğ qaytarılmır.",
      "Aktivləşdirilmiş xidmət üçün ödəniş qaytarılmır. Texniki səbəbdən xidmət göstərilmədikdə məsələyə fərdi qaydada baxılır.",
      "Şəxsi hesabdakı vəsait yalnız Saytdakı xidmətlər üçün istifadə olunur və nağd pula çevrilmir.",
    ],
  },
  {
    title: "Bildirişlər və əlaqə",
    points: [
      "Sayt İstifadəçiyə e-poçtla xidməti məktublar göndərə bilər: təsdiq kodları, elanın təsdiqi və ya rəddi, yeni mesajlar haqqında bildirişlər.",
      "İstifadəçinin e-poçt və telefon nömrəsi reklam məqsədilə üçüncü şəxslərə verilmir. Qanunla tələb olunduqda (məsələn, dələduzluq və ya cinayət araşdırması zamanı) məlumatlar səlahiyyətli dövlət orqanlarına təqdim edilə bilər.",
      "Administrasiya ilə əlaqə: kirayeal.az@gmail.com, +994 50 219 11 45.",
    ],
  },
  {
    title: "Məsuliyyətin məhdudlaşdırılması",
    points: [
      "Administrasiya elanların düzgünlüyünü, əşyanın vəziyyətini, tərəflərin etibarlılığını və kirayə razılaşmasının icrasını yoxlamır və bunlara görə cavabdeh deyil.",
      "İstifadəçilər arasında yaranan mübahisələr (qiymət, depozit, zərər, qaytarılma) tərəflər arasında həll edilir. Administrasiya bu cür itki və zərərlərə görə məsuliyyət daşımır.",
      "Administrasiya Saytın fasiləsiz işləməsinə çalışır, lakin texniki nasazlıq, üçüncü tərəf xidmətlərinin (internet, ödəniş sistemi) problemləri və onlardan yaranan nəticələrə görə məsuliyyət daşımır.",
    ],
  },
  {
    title: "Yekun müddəalar",
    points: [
      "Bu Razılaşmaya Azərbaycan Respublikasının qanunvericiliyi tətbiq olunur. Mübahisələr əvvəlcə danışıqlar yolu ilə, razılıq olmadıqda qanunvericiliyə uyğun həll edilir.",
      "Administrasiya bu Razılaşmanı birtərəfli qaydada dəyişə bilər. Yeni redaksiya Saytda dərc olunduğu andan qüvvəyə minir.",
      "Razılaşmanın hər hansı bəndinin etibarsız sayılması digər bəndlərin qüvvəsinə təsir etmir.",
    ],
  },
];

export default function Terms() {
  return <>
    <Header />
    <main className="wrap prose">
      <p className="eyebrow">HÜQUQİ MƏLUMAT</p>
      <h1>İstifadəçi razılaşması</h1>
      <p>Son yeniləmə: 30 oktyabr 2026</p>
      {sections.map((section, index) => <section key={section.title} id={`bend-${index + 1}`}>
        <h2>{index + 1}. {section.title}</h2>
        {section.points.map((point, pointIndex) => <p key={pointIndex}><strong>{index + 1}.{pointIndex + 1}.</strong> {point}</p>)}
      </section>)}
      <p><Link href="/rules">Elan yerləşdirmə qaydaları</Link> · <Link href="/privacy">Məxfilik siyasəti</Link></p>
    </main>
    <Footer />
  </>;
}
