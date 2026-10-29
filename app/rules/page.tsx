import type { Metadata } from "next";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Elan yerləşdirmə qaydaları | kirayeal.az",
  description: "Kirayeal.az-da elan yerləşdirmə, müddət, limit, redaktə və təhlükəsizlik qaydaları.",
  alternates: { canonical: "/rules" },
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
      "Artıq kirayəyə verilməyən və ya aktual olmayan elanı sil. Silinən elan geri qaytarılmır, hesab məlumatların qalır.",
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

export default async function Rules() {
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
        <h2>8. Elan müddəti və limit qaydaları</h2>
        <p><strong>8.1.</strong> Təsdiqlənmiş elan 30 gün yayımda qalır. Müddət bitdikdə elan silinmir, kabinetdə «Müddəti bitib» bölməsinə keçir.</p>
        <p><strong>8.2.</strong> Hər kateqoriyada ayda 1 elan pulsuzdur. Pulsuz yer elan təsdiqlənəndə istifadə olunur və 30 gün sonra yenidən açılır. Rədd edilmiş elan limit sərf etmir, elanı silmək isə limiti geri qaytarmır.</p>
        <p><strong>8.3.</strong> Limit dolduqda elan yenə yerləşdirilə bilər: o «Ödəniş gözləyir» bölməsinə düşür və ödənişdən sonra yoxlamaya göndərilir.</p>
        <p><strong>8.4.</strong> Müddəti bitmiş və ya silinmiş elanı bərpa etmək pulsuz yer varsa pulsuzdur, yoxdursa ödənişlidir.</p>
        <p><strong>8.5.</strong> Ödəniş sistemi hələ qoşulmayıb: ödənişli addımlarda heç bir məbləğ tutulmur. Qiymətlər ödəniş aktivləşdirilməzdən əvvəl göstəriləcək.</p>
      </section>
      <p><Link href="/help">Suallar və kömək</Link> · <Link href="/new">Elan yerləşdir</Link></p>
    </main>
    <Footer />
  </>;
}
