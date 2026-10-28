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
          Saytda istifadəçi hesabı və giriş yoxdur. Elan yerləşdirmək üçün bizimlə
          əlaqə saxladıqda verdiyin ad, telefon və e-poçt yalnız elanı hazırlamaq
          və səninlə əlaqə saxlamaq üçün istifadə olunur. Elanda göstərilən əlaqə
          nömrəsi, təsvir və şəkillər hamıya açıq görünür.
        </p>
        <h2>Şəkillər və elanlar</h2>
        <p>
          Elanda yerləşdirilən şəkillər və mətn açıq görünür. Şəxsi sənəd, bank
          kartı və üçüncü şəxslərin razılıqsız məlumatlarını göndərmə. Elanı
          götürmək istəsən, bizimlə əlaqə saxla.
        </p>
        <h2>Brauzerdə saxlanan məlumat</h2>
        <p>
          Seçilmiş elanların siyahısı, saxlanmış axtarışlar, axtarış tarixçəsi və
          dil seçimi yalnız sənin brauzerində saxlanır və cihazlar arasında
          ötürülmür. Brauzerin məlumatlarını təmizləməklə onları silə bilərsən.
        </p>
        <h2>Şikayətlər</h2>
        <p>
          Şikayət göndərdikdə yazdığın məlumat yalnız şikayəti araşdırmaq üçün
          istifadə olunur. Şikayətə həssas məlumat əlavə etmə.
        </p>
      </main>
      <Footer />
    </>
  );
}
