import type { Metadata } from "next";
export const metadata: Metadata = { title: "Məxfilik siyasəti | kirayeal.az", description: "Kirayeal.az şəxsi məlumatları necə toplayır, saxlayır və qoruyur.", alternates: { canonical: "/privacy" } };
import Header from "../components/Header";
import Footer from "../components/Footer";
const sections = [
  [
    "Hesab və əlaqə",
    "Hesab yaratmaq üçün e-poçt ünvanından istifadə olunur. Şifrəniz açıq mətnlə saxlanılmır; serverdə heş formasında saxlanılır. Profil adınız və telefon nömrəniz hesabınızda saxlanılır. Elana əlavə etdiyiniz əlaqə nömrəsi, mətn və şəkillər ictimai yayımlanır."
  ],
  [
    "Şəkillər və elanlar",
    "Yüklənən şəkillər açıq saxlama ünvanında yerləşir və elan təsdiqlənməmişdən əvvəl də həmin ünvanı bilən şəxslərə görünə bilər. Şəxsi sənədləri, bank kartı məlumatlarını və üçüncü şəxslərin razılıqsız məlumatlarını yükləməyin."
  ],
  [
    "Elanın silinməsi",
    "Elanı sildikdə elan ictimai yayımdan çıxarılır və kabinetin “Silinmiş” bölməsinə keçirilir. Bu, məlumatların dərhal və həmişəlik silinməsi demək deyil. Bərpa saytın qüvvədə olan şərtlərinə uyğun mümkündür. Silinmiş və fəaliyyətsiz elanlar 180 gündən sonra kabinet siyahısında göstərilmir."
  ],
  [
    "Brauzerdə saxlanan məlumat",
    "Giriş sessiyası və seçilmiş elanların siyahısı brauzerdə saxlanılır. Seçilmişlər cihazlar arasında avtomatik ötürülmür. Hesabdan çıxış sessiyanı bitirir. Ortaq cihazdan istifadəni tamamladıqda hesabınızdan çıxın."
  ],
  [
    "Elan qaralamaları",
    "Yarımçıq elanın mətni, seçilmiş şəkilləri və yerləşmə məlumatları qaralamanı bərpa etmək üçün bu cihazın brauzerində saxlanıla bilər. Şəkillər saxlanıla bilmədikdə yalnız mətn saxlanılır və bu barədə məlumat göstərilir. 7 gündən köhnə qaralamalar bərpa üçün təklif edilmir. Qaralamanı elan yerləşdirmə səhifəsində silə bilərsiniz."
  ],
  [
    "Şikayətlər",
    "Şikayətə aid hesab identifikatoru, səbəb və mətn araşdırma üçün saxlanılır. Bu məlumatlar şikayəti göndərən şəxsə və idarəçilərə aiddir, digər istifadəçilərə açıq deyil. Şikayət mətninə həssas məlumat əlavə etməyin."
  ]
];
export default function Privacy() {
  return (
    <>
      <Header />
      <main className="wrap prose">
        <p className="eyebrow">ŞƏXSİ MƏLUMATLAR</p>
        <h1>Məlumatlarınız necə istifadə olunur?</h1>
        {sections.map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>)}
      </main>
      <Footer />
    </>
  );
}
