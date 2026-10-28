import type { Metadata } from "next";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { siteContact } from "../../lib/site-contact";

export const metadata: Metadata = {
  title: "Elan yerləşdirmə qaydaları | kirayeal.az",
  description: "Kirayeal.az-da elan yerləşdirmə və təhlükəsiz istifadə qaydaları.",
};

const sections = [
  {
    title: "Ümumi şərtlər",
    rules: [
      "Kirayeal.az kirayə elanları platformasıdır. Yalnız sahibi olduğun və ya kirayəyə verməyə icazən olan əmlak və əşyaları yerləşdir.",
      "Elanın məlumatları düzgün, qanunvericiliyə uyğun və üçüncü şəxslərin hüquqlarını pozmayan olmalıdır. Saxta və qanunsuz təkliflər qəbul edilmir.",
      "Elanın yoxlanılması elan sahibinin etibarlılığına və əşyanın vəziyyətinə zəmanət deyil.",
    ],
  },
  {
    title: "Elanın yerləşdirilməsi",
    rules: [
      "Elan yerləşdirmək üçün telefon, WhatsApp və ya e-poçt vasitəsilə bizimlə əlaqə saxla. Yayımlanmış elanlara qeydiyyatsız baxmaq mümkündür.",
      "Elan əşyanın növünə uyğun kateqoriyada yerləşdirilir. Yanlış kateqoriya seçmək olmaz.",
      "Bir elan konkret əmlakı, əşyanı və ya birlikdə kirayəyə verilən dəsti təsvir etməlidir. Əlaqəsiz məhsulları bir elanda birləşdirmək olmaz.",
      "Eyni əmlak və ya əşya üçün təkrar elan göndərmə.",
      "Qiymət, təsvir, şəkil və əlaqə məlumatlarında dəyişiklik üçün bizimlə əlaqə saxla. Artıq kirayəyə verilməyən və ya aktual olmayan elanı götürmək üçün də eyni yolla yaz.",
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
      "Elana əşyanı aydın göstərən real şəkillər əlavə et. Başqasının şəkillərindən icazəsiz istifadə etmə.",
      "İşlək e-poçt və istifadəsinə icazən olan telefon nömrəsi göstər. Başqasına narahatlıq yaratmaq məqsədilə onun nömrəsini yerləşdirmək olmaz.",
      "Şəxsiyyət vəsiqəsi, bank kartının həssas məlumatları, PIN/CVV, şifrə və SMS kodlarını elanda və şəkillərdə paylaşma.",
    ],
  },
  {
    title: "Yoxlama və şikayətlər",
    rules: [
      "Qaydalara uyğun olmayan elan yayımlanmaya bilər və ya saytdan götürülə bilər.",
      "Şübhəli elan barədə elanın ünvanını və səbəbi bizə göndər. Şikayətə araşdırma əsasında baxılır.",
      "Təkrar və ciddi qayda pozuntuları elan sahibi ilə əməkdaşlığın dayandırılması üçün əsas ola bilər.",
    ],
  },
  {
    title: "Ödənişlər",
    rules: [
      "Platforma ödəniş, rezervasiya və reklam xidməti təklif etmir. Kirayə razılaşması tərəflər arasında bağlanır.",
      "Əşyanı və qarşı tərəfi yoxlamadan beh göndərmə; qiymət, depozit, müddət, zərər və qaytarılma şərtlərini əvvəlcədən yazılı razılaşdır.",
    ],
  },
];

export default function Rules() {
  return (
    <>
      <Header />
      <main className="wrap prose">
        <p className="eyebrow">QAYDALAR VƏ TƏHLÜKƏSİZLİK</p>
        <h1>Elan yerləşdirmə qaydaları</h1>
        <p>
          Elan yerləşdirməzdən əvvəl qaydalarla tanış ol. Bu səhifə kirayeal.az-da elan yerləşdirmə və təhlükəsiz istifadə şərtlərini izah edir.
        </p>
        {sections.map((section, index) => (
          <section key={section.title} id={`qayda-${index + 1}`}>
            <h2>
              {index + 1}. {section.title}
            </h2>
            {section.rules.map((rule, ruleIndex) => (
              <p key={ruleIndex}>
                <strong>
                  {index + 1}.{ruleIndex + 1}.
                </strong>{" "}
                {rule}
              </p>
            ))}
          </section>
        ))}
        <p>
          <Link href="/help">Suallar və kömək</Link> ·{" "}
          <a href={siteContact.whatsappHref} target="_blank" rel="noopener noreferrer">
            Elan yerləşdir
          </a>
        </p>
      </main>
      <Footer />
    </>
  );
}
