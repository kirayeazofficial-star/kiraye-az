import type { Metadata } from "next";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { categories } from "../../lib/marketplace";
import { listingPrice, manat } from "../../lib/limit-rules";

export const metadata: Metadata = {
  title: "Elan yerləşdirmə qaydaları | kirayeal.az",
  description: "Kirayeal.az-da elan yerləşdirmə, müddət, limit, redaktə və təhlükəsizlik qaydaları.",
  alternates: { canonical: "/rules" },
};

const sections = [
  {
    title: "Ümumi şərtlər",
    rules: [
      "Kirayeal.az kirayə elanları platformasıdır. Yalnız sahibi olduğunuz və ya kirayəyə verməyə icazəniz olan əmlak və əşyaları yerləşdirin.",
      "Elanın məlumatları düzgün, qanunvericiliyə uyğun və üçüncü şəxslərin hüquqlarını pozmayan olmalıdır. Saxta və qanunsuz təkliflər qəbul edilmir.",
      "Elanın yoxlanılması elan sahibinin etibarlılığına və əşyanın vəziyyətinə zəmanət deyil. Bu qaydalar reklam xidmətindən istifadə olunub-olunmamasından asılı olmayaraq bütün elanlara aiddir.",
    ],
  },
  {
    title: "Elanın yerləşdirilməsi",
    rules: [
      "Elan yerləşdirmək üçün hesabınıza daxil olun. Yayımlanmış elanlara qeydiyyatsız baxmaq mümkündür.",
      "Elanı əşyanın növünə uyğun kateqoriyada yerləşdirin. Limitdən yayınmaq üçün yanlış kateqoriya seçmək olmaz.",
      "Elan yerləşdirməyə kateqoriya üzrə müəyyən edilən limit tətbiq olunur. Elan göndərilərkən kateqoriya üzrə limit yoxlanılır.",
      "Bir elan konkret əmlakı, əşyanı və ya birlikdə kirayəyə verilən dəsti təsvir etməlidir. Əlaqəsiz məhsulları bir elanda birləşdirmək olmaz.",
    ],
  },
  {
    title: "Təkrar elanlar və redaktə",
    rules: [
      "Eyni əmlak və ya əşya üçün təkrar aktiv və ya yoxlamada olan elan yaratmayın. Elanı silib yenidən yerləşdirməklə və ya başqa hesabdan istifadə etməklə limitdən yayınmaq olmaz.",
      "Qiymət, təsvir, şəkil və əlaqə məlumatlarında dəyişiklik üçün mövcud elanın «Redaktə et» seçimindən istifadə edin. Elanı 24 saat ərzində ən çox 2 dəfə redaktə etmək olar; dəyişikliklər yenidən yoxlamaya göndərilir.",
      "Mövcud elanın məlumatlarını başqa əmlakın və ya əşyanın məlumatları ilə əvəz etmək olmaz. Redaktə elanı avtomatik irəli çəkmir.",
      "Artıq kirayəyə verilməyən və ya aktual olmayan elanı silin. Silinən elan 180 gün ərzində ödənişli bərpa oluna bilər (bax: 8.4 və 8.9); hesab məlumatlarınız silinmir.",
    ],
  },
  {
    title: "Başlıq, qiymət və kirayə şərtləri",
    rules: [
      "Başlıq qısa, aydın və təklifə uyğun olmalıdır. Başlıqda və təsvirdə telefon nömrəsi, sayt linkləri, başqa elanların reklamı, təkrarlanan açar sözlər və aldadıcı ifadələr yerləşdirməyin — sayt belə mətni qəbul etmir. Nömrə yalnız «Əlaqə» xanasında göstərilir.",
      "Qiyməti AZN ilə və hansı müddətə aid olduğunu göstərərək yazın. Real kirayə haqqını gizlədən şərti qiymət göstərmək olmaz.",
      "Depozit, minimum kirayə müddəti, çatdırılma və digər əlavə ödənişlər varsa, onları açıq qeyd edin. Əşyanın məlum qüsurlarını və istifadə məhdudiyyətlərini gizlətməyin.",
    ],
  },
  {
    title: "Şəkillər və əlaqə məlumatları",
    rules: [
      "Elana əşyanı aydın göstərən 1–6 real şəkil əlavə edin. JPG, PNG və WebP qəbul olunur; hər şəkil ən azı 600×400 piksel və maksimum 5 MB olmalıdır. Birinci şəkil kirayə verilən əşyanın özünü göstərməlidir. Başqasının şəkillərindən icazəsiz istifadə etməyin.",
      "İşlək e-poçt və istifadəsinə icazəniz olan telefon nömrəsi göstərin. Əlaqə məlumatlarını bunun üçün ayrılmış xanalarda yazın; başqasına narahatlıq yaratmaq məqsədilə onun nömrəsini yerləşdirmək olmaz.",
      "Şəxsiyyət vəsiqəsi, bank kartının həssas məlumatları, PIN/CVV, şifrə və SMS kodlarını elanda və şəkillərdə paylaşmayın. Hesabınıza giriş məlumatlarını başqasına verməyin.",
    ],
  },
  {
    title: "Yoxlama və şikayətlər",
    rules: [
      "Yeni və redaktə edilmiş elanlar yoxlanılır. Qaydalara uyğun olmayan elan rədd edilə bilər; rədd səbəbi şəxsi kabinetdə göstərilir.",
      "Şübhəli elan barədə elan səhifəsindəki «Şikayət et» düyməsindən istifadə edin. Səbəbi və araşdırmaya kömək edəcək məlumatları göstərin.",
      "Qayda pozuntusu aşkarlandıqda düzəliş tələb oluna və ya elanın yayımı dayandırıla bilər. Təkrar və ciddi pozuntular hesabın məhdudlaşdırılması üçün əsas ola bilər.",
      "Şikayətə araşdırma əsasında baxılır. Qərarla razılaşmadıqda elan nömrəsini və izahını göstərərək yenidən baxılmasını istəyə bilərsiniz.",
    ],
  },
  {
    title: "Reklam xidmətləri və ödənişlər",
    rules: [
      "Ödənişli xidmətlər (irəli çəkmə, VIP, Premium, ödənişli yerləşdirmə, bərpa, mağaza paketləri) və balans artırma ödəniş sistemi qoşulana qədər müvəqqəti işləmir. Bu müddətdə kartdan pul tutulmur.",
      "Ödənişli xidmətlər aktivləşdirildikdə qiymət, müddət, tətbiq və geri qaytarma şərtləri ödənişdən əvvəl göstəriləcək. Reklam xidməti elan qaydalarını və yerləşdirmə limitlərini aradan qaldırmır.",
      "Kirayə razılaşması hazırda tərəflər arasında bağlanır. Əşyanı və qarşı tərəfi yoxlamadan beh göndərməyin; qiymət, depozit, müddət, zərər və qaytarılma şərtlərini əvvəlcədən yazılı razılaşdırın.",
    ],
  },
];

export default async function Rules() {
  return <>
    <Header />
    <main className="wrap prose">
      <p className="eyebrow">QAYDALAR VƏ TƏHLÜKƏSİZLİK</p>
      <h1>Elan yerləşdirmə qaydaları</h1>
      <p>Elan yerləşdirməzdən əvvəl qaydalarla tanış olun. Bu səhifə kirayeal.az-da elan yerləşdirmə, redaktə və təhlükəsiz istifadə şərtlərini izah edir.</p>
      {sections.map((section, index) => <section key={section.title} id={`qayda-${index + 1}`}>
        <h2>{index + 1}. {section.title}</h2>
        {section.rules.map((rule, ruleIndex) => <p key={ruleIndex}><strong>{index + 1}.{ruleIndex + 1}.</strong> {rule}</p>)}
      </section>)}
      <section id="muddet-ve-limit">
        <h2>8. Elan müddəti və limit qaydaları</h2>
        <p><strong>8.1.</strong> Təsdiqlənmiş elan 30 gün yayımda qalır. Müddət bitdikdə elan silinmir, kabinetdə «Müddəti bitib» bölməsinə keçir.</p>
        <p><strong>8.2.</strong> 30 gün ərzində hər qrupda 1 elan pulsuzdur. Qruplar: Nəqliyyat (avtomobil, motosiklet, elektrik skuter, velosiped), Əmlak (ev və mənzil), Əşya və avadanlıq. «Villa və bağ» və «Kommersiya» kateqoriyalarında elan həmişə ödənişlidir. Pulsuz yer elan təsdiqlənəndə istifadə olunur və 30 gün sonra yenidən açılır. Rədd edilmiş elan limit sərf etmir, elanı silmək isə limiti geri qaytarmır.</p>
        <p><strong>8.3.</strong> Limit dolduqda elan yenə yerləşdirilə bilər: o «Ödəniş gözləyir» bölməsinə düşür və ödənişdən sonra yoxlamaya göndərilir. Bir elanın qiyməti (30 gün): {categories.map(item => `${item.name} — ${manat(listingPrice(item.id))}`).join("; ")}.</p>
        <p><strong>8.4.</strong> Müddəti bitmiş və ya silinmiş elanın bərpası ödənişlidir və elan qiymətinin yarısı qədərdir. Bərpa edilən elan yenidən 30 gün yayımlanır. Hər hansı ödənişli xidmət (irəli çək, VIP, Premium) elanın müddətini həmin xidmətin müddəti qədər uzadır.</p>
        <p><strong>8.5.</strong> Pulsuz limit hesaba və elandakı telefon nömrəsinə görə hesablanır: eyni nömrə ilə başqa hesabdan verilən elan da həmin limitdən sayılır.</p>
        <p><strong>8.6.</strong> Təkrar elan: eyni əşyanı və ya əmlakı (eyni şəkillərlə) 90 gün ərzində yenidən yerləşdirmək, o cümlədən kateqoriyanı dəyişərək, ödənişlidir. Sayt şəkilləri avtomatik müqayisə edir.</p>
        <p><strong>8.7.</strong> Başqasına məxsus şəkillərdən, eləcə də üzərində başqa saytın loqosu və ya su nişanı olan şəkillərdən istifadə qadağandır — belə elan rədd edilir.</p>
        <p><strong>8.8.</strong> Mağaza sahiblərinin elan limiti seçdikləri paketə görədir.</p>
        <p><strong>8.9.</strong> Müddəti bitmiş, silinmiş və ya rədd edilmiş elan 180 gün ərzində bərpa olunmazsa, birdəfəlik arxivə keçir və kabinetdə görünmür.</p>
      </section>
      <section id="odenis-ve-geri-qaytarma">
        <h2>9. Ödəniş və geri qaytarma</h2>
        <p><strong>9.1.</strong> Ödənişli xidmətlər (irəli çəkmə, VIP, Premium, ödənişli yerləşdirmə, bərpa və mağaza paketləri) ödəniş təsdiqləndiyi andan tətbiq olunur. Xidmətin qiyməti, müddəti və nə verdiyi ödənişdən əvvəl göstərilir.</p>
        <p><strong>9.2.</strong> Elan hələ yoxlamadadırsa, ödənilmiş xidmət elan dərc olunduğu andan başlayır. Elan rədd edilərsə və xidmət tətbiq olunmayıbsa, ödənilən məbləğ şəxsi hesab balansına qaytarılır.</p>
        <p><strong>9.3.</strong> Artıq göstərilmiş və ya başlamış xidmətin haqqı geri qaytarılmır. Xidmətin başlama vaxtı dəyişdirilə və xidmət başqa elana keçirilə bilməz.</p>
        <p><strong>9.4.</strong> Qayda pozuntusuna görə dayandırılan və ya silinən elana tətbiq olunmuş ödənişli xidmətlərin haqqı geri qaytarılmır.</p>
        <p><strong>9.5.</strong> Texniki səbəbdən (saytın xətası) xidmət göstərilməyibsə, ödənilən məbləğ tam həcmdə şəxsi hesab balansına, müraciət əsasında isə ödəniş edilən karta qaytarılır. Karta qaytarma bankdan asılı olaraq 3–10 iş günü çəkə bilər.</p>
        <p><strong>9.6.</strong> Mağaza paketi müddət bitənədək qüvvədədir. Paket aktivləşdirildikdən sonra ödənilən məbləğ geri qaytarılmır; müddət bitdikdə istifadə olunmamış pulsuz irəli çəkmələr və digər komponentlər sıfırlanır.</p>
        <p><strong>9.7.</strong> Şəxsi hesab balansındakı vəsait yalnız sayt daxilində xidmətlərə xərclənə bilər və nağd pula çevrilmir.</p>
        <p><strong>9.8.</strong> Ödənişlə bağlı sual və ya etiraz üçün elan nömrəsini və ödəniş tarixini göstərərək kirayeal.az@gmail.com ünvanına yazın. Müraciətlərə 3 iş günü ərzində baxılır.</p>
      </section>
      <p><Link href="/help">Suallar və kömək</Link> · <Link href="/new">Elan yerləşdir</Link></p>
    </main>
    <Footer />
  </>;
}
