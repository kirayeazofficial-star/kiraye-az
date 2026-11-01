import type { Metadata } from "next";
export const metadata: Metadata = { title: "Məxfilik siyasəti | kirayeal.az", description: "Kirayeal.az şəxsi məlumatları necə toplayır, saxlayır və qoruyur.", alternates: { canonical: "/privacy" } };
import Header from "../components/Header";
import Footer from "../components/Footer";
export default function Privacy() {
  return (
    <>
      <Header />
      <main className="wrap prose">
        <p className="eyebrow">ŞƏXSİ MƏLUMATLAR</p>
        <h1>Məlumatların necə istifadə olunur?</h1>
        <h2>Hesab və əlaqə</h2>
        <p>
          Hesab yaratmaq üçün e-poçt ünvanı istifadə olunur. Şifrə
          serverdə yalnız şifrələnmiş (hash) şəkildə saxlanılır. Profil adı və telefon nömrəsi
          hesabında saxlanır. Elana ayrıca yazdığın əlaqə nömrəsi, təsvir və
          şəkillər açıq göstərilir.
        </p>
        <h2>Şəkillər və elanlar</h2>
        <p>
          Yüklənən şəkillər açıq saxlama ünvanında yerləşir və elan
          təsdiqlənməmişdən əvvəl də həmin ünvanı bilənlərə görünə bilər. Şəxsi
          sənəd, bank kartı və üçüncü şəxslərin razılıqsız məlumatlarını
          yükləmə. Elanı sildikdə o, saytdan və hesabından həmişəlik
          götürülür; hesab məlumatların silinmir.
        </p>
        <h2>Brauzerdə saxlanan məlumat</h2>
        <p>
          Giriş sessiyası və seçilmiş elanların siyahısı brauzerdə saxlanır.
          Seçilmişlər cihazlar arasında avtomatik ötürülmür. Hesabdan çıxmaq
          sessiyanı bitirir; ortaq cihazda işi bitirəndə hesabdan çıx.
        </p>
        <h2>Şikayətlər</h2>
        <p>
          Şikayətə aid hesab identifikatoru, səbəb və mətn yoxlama üçün
          saxlanır. Şikayəti özün və idarəçilər görə bilər; başqa istifadəçilərə
          açıq deyil. Şikayət mətninə həssas məlumat əlavə etmə.
        </p>
      </main>
      <Footer />
    </>
  );
}
