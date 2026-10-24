import { categoryName } from "../../lib/marketplace";
import { publicSupabase } from "../../lib/supabase";
import type { Metadata } from "next";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Elan yerləşdirmə qaydaları | kirayeal.az",
  description: "Kirayeal.az-da elan yerləşdirmə, müddət, limit, redaktə və təhlükəsizlik qaydaları.",
};

const sections = [
  {
    title: "Ümumi şərtlər",
    rules: [
      "Kirayeal.az kirayə elanları platformasıdır. Yalnız sahibi olduğun və ya kirayəyə verməyə icazən olan əmlak və əşyaları yerləşdir.",
      "Elanın məlumatları düzgün, qanunvericiliyə uyğun və üçüncü şəxslərin hüquqlarını pozmayan olmalıdır. Saxta və qanunsuz təkliflər qəbul edilmir.",
      "Elanın yoxlanılması elan sahibinin etibarlılığına və əşyanın vəziyyətinə zəmanət deyil. Bu qaydalar reklam xidmətindən istifadə olunub-olunmamasından asılı olmayaraq bütün elanlara aiddir.",
    ],
  },
  {
    title: "Elanın yerləşdirilməsi",
    rules: [
      "Elan yerləşdirmək üçün hesabına daxil ol. Yayımlanmış elanlara qeydiyyatsız baxmaq mümkündür.",
      "Elanı əşyanın növünə uyğun kateqoriyada yerləşdir. Limitdən yayınmaq üçün yanlış kateqoriya seçmək olmaz.",
      "Elan yerləşdirməyə kateqoriya üzrə müəyyən edilən limit tətbiq olunur. Elan göndərilərkən kateqoriya üzrə limit yoxlanılır.",
      "Bir elan konkret əmlakı, əşyanı və ya birlikdə kirayəyə verilən dəsti təsvir etməlidir. Əlaqəsiz məhsulları bir elanda birləşdirmək olmaz.",
    ],
  },
  {
    title: "Təkrar elanlar və redaktə",
    rules: [
      "Eyni əmlak və ya əşya üçün təkrar aktiv və ya yoxlamada olan elan yaratma. Elanı silib yenidən yerləşdirməklə və ya başqa hesabdan istifadə etməklə limitdən yayınmaq olmaz.",
      "Qiymət, təsvir, şəkil və əlaqə məlumatlarında dəyişiklik üçün mövcud elanın “Redaktə et” seçimini istifadə et. Dəyişikliklər yenidən yoxlamaya göndərilir.",
      "Mövcud elanın məlumatlarını başqa əmlakın və ya əşyanın məlumatları ilə əvəz etmək olmaz. Redaktə elanı avtomatik irəli çəkmir.",
      "Artıq kirayəyə verilməyən və ya aktual olmayan elanı arxivə keçir. Arxivləşdirmə məlumatları hesabından silmir.",
    ],
  },
  {
    title: "Başlıq, qiymət və kirayə şərtləri",
    rules: [
      "Başlıq qısa, aydın və təklifə uyğun olmalıdır. Başlıqda telefon nömrəsi, reklam keçidləri, təkrarlanan açar sözlər və aldadıcı ifadələr yerləşdirmə.",
      "Qiyməti AZN ilə və hansı müddətə aid olduğunu göstərərək yaz. Real kirayə haqqını gizlədən şərti qiymət göstərmək olmaz.",
      "Depozit, minimum kirayə müddəti, çatdırılma və digər əlavə ödənişlər varsa, onları açıq qeyd et. Əşyanın məlum qüsurlarını və istifadə məhdudiyyətlərini gizlətmə.",
    ],
  },
  {
    title: "Şəkillər və əlaqə məlumatları",
    rules: [
      "Elana əşyanı aydın göstərən 1–6 real şəkil əlavə et. JPG, PNG və WebP qəbul olunur; hər şəkil maksimum 5 MB ola bilər. Başqasının şəkillərindən icazəsiz istifadə etmə.",
      "İşlək e-poçt və istifadəsinə icazən olan telefon nömrəsi göstər. Əlaqə məlumatlarını bunun üçün ayrılmış xanalarda yaz; başqasına narahatlıq yaratmaq məqsədilə onun nömrəsini yerləşdirmək olmaz.",
      "Şəxsiyyət vəsiqəsi, bank kartının həssas məlumatları, PIN/CVV, şifrə və SMS kodlarını elanda və şəkillərdə paylaşma. Hesabına giriş məlumatlarını başqasına vermə.",
    ],
  },
  {
    title: "Yoxlama və şikayətlər",
    rules: [
      "Yeni və redaktə edilmiş elanlar yoxlanılır. Qaydalara uyğun olmayan elan rədd edilə bilər; rədd səbəbi şəxsi kabinetdə göstərilir.",
      "Şübhəli elan barədə elan səhifəsindəki şikayət funksiyasından istifadə et. Səbəbi və araşdırmaya kömək edəcək məlumatları göstər.",
      "Qayda pozuntusu aşkarlandıqda düzəliş tələb oluna və ya elanın yayımı dayandırıla bilər. Təkrar və ciddi pozuntular hesabın məhdudlaşdırılması üçün əsas ola bilər.",
      "Şikayətə araşdırma əsasında baxılır. Qərarla razılaşmadıqda elan nömrəsini və izahını göstərərək yenidən baxılmasını istəyə bilərsən.",
    ],
  },
  {
    title: "Reklam xidmətləri və ödənişlər",
    rules: [
      "VIP, Premium, irəli çəkmə və balans artırılması hazırda aktiv deyil. Paket və ödəniş üsulu seçimləri önbaxışdır; pul tutulmur və elanın sıralaması dəyişmir.",
      "Ödənişli xidmətlər aktivləşdirildikdə qiymət, müddət, tətbiq və geri qaytarma şərtləri ödənişdən əvvəl göstəriləcək. Reklam xidməti elan qaydalarını və yerləşdirmə limitlərini aradan qaldırmır.",
      "Kirayə razılaşması hazırda tərəflər arasında bağlanır. Əşyanı və qarşı tərəfi yoxlamadan beh göndərmə; qiymət, depozit, müddət, zərər və qaytarılma şərtlərini əvvəlcədən yazılı razılaşdır.",
    ],
  },
];

export const revalidate = 60;
export default async function Rules() {
  let active = false;
  let limits: {category: string; active_limit: number; period_limit: number}[] = [];
  try { const result = await publicSupabase?.rpc("listing_lifecycle_ready").abortSignal(AbortSignal.timeout(1000)); active = result?.data === true && !result?.error; } catch {}

  if (active) { try { const result = await publicSupabase?.from("listing_category_limits").select("category,active_limit,period_limit").abortSignal(AbortSignal.timeout(1000)); if (!result?.error && result?.data) limits = result.data; } catch {} }
  return <>
    <Header />
    <main className="wrap prose">
      <p className="eyebrow">QAYDALAR VƏ TƏHLÜKƏSİZLİK</p>
      <h1>Elan yerləşdirmə qaydaları</h1>
      <p>Elan yerləşdirməzdən əvvəl qaydalarla tanış ol. Bu səhifə kirayeal.az-da elan yerləşdirmə, redaktə və təhlükəsiz istifadə şərtlərini izah edir.</p>
      {sections.map((section, index) => <section key={section.title} id={`qayda-${index + 1}`}>
        <h2>{index + 1}. {section.title}</h2>
        {section.rules.map((rule, ruleIndex) => <p key={ruleIndex}><strong>{index + 1}.{ruleIndex + 1}.</strong> {rule}</p>)}
      </section>)}
      <section id="muddet-ve-limit">
        <h2>8. {active ? "30 günlük müddət və limit qaydaları" : "Aktivləşdiriləcək 30 günlük müddət və limit qaydaları"}</h2>
        {active ? <p className="notice">Elan müddəti 30 gündür. Limitlər həm aktiv elan sayına, həm də son 30 gün ərzində təsdiqlənən yerləşdirmə və bərpalara əsasən yoxlanılır. Ödənişlər hələ aktiv deyil.</p> : <p className="notice"><strong>Bu hissə hələ qüvvəyə minməyib.</strong> 30 günlük avtomatik müddət, bərpa sistemi və kateqoriyalar üzrə dəqiq limitlər aktivləşdirildikdə burada bildiriləcək. Yeni sistem qoşulanadək əvvəlki limit yoxlaması qüvvədədir; ödəniş qəbul edilmir.</p>}
        {!!limits.length && <div className="rulesLimits"><table><caption>Hazırda tətbiq olunan kateqoriya limitləri</caption><thead><tr><th>Kateqoriya</th><th>Aktiv elan</th><th>Son 30 gün</th></tr></thead><tbody>{limits.map(limit => <tr key={limit.category}><td>{categoryName(limit.category)}</td><td>{limit.active_limit}</td><td>{limit.period_limit}</td></tr>)}</tbody></table></div>}
        <p><strong>8.1.</strong> Elanın aktivlik müddəti 30 gün olacaq. Müddət başa çatdıqda yayımı dayanacaq və elan silinmədən “Müddəti başa çatmış” bölməsinə keçəcək.</p>
        <p><strong>8.2.</strong> Həm eyni vaxtda aktiv elan sayı, həm də kateqoriya üzrə 30 gün ərzində yerləşdirilən elan sayı nəzərə alınacaq. Kateqoriyalar üzrə saylar ayrıca göstəriləcək.</p>
        <p><strong>8.3.</strong> Limit aşıldıqda istifadəçi növbəti elan üçün limitin imkan verməsini gözləməli və ya ödənişli xidmətlər aktiv olduqda uyğun kateqoriya paketi seçməli olacaq.</p>
        <p><strong>8.4.</strong> İlk yerləşdirmədən sonrakı 30 gün ərzində elan ödənişsiz bərpa edilə biləcək. Həmin müddətdən sonra ödənişsiz bərpa yalnız kateqoriya limiti aşılmadıqda mümkün olacaq; əks halda limitin imkan verməsi gözləniləcək və ya aktiv ödənişli xidmət seçiləcək.</p>
        <p><strong>8.5.</strong> Ödənişli xidmətin elan müddətini bərpa etməsi və uzatması xidmət aktivləşdiriləndə göstərilən şərtlərlə tənzimlənəcək.</p>
      </section>
      <p><Link href="/help">Suallar və kömək</Link> · <Link href="/new">Elan yerləşdir</Link></p>
    </main>
    <Footer />
  </>;
}
