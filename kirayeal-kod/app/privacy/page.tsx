import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Məxfilik siyasəti | kirayeal.az", description: "Kirayeal.az şəxsi məlumatları necə toplayır, saxlayır və qoruyur.", alternates: { canonical: "/privacy" } };
import Header from "../components/Header";
import Footer from "../components/Footer";
export default function Privacy() {
  return (
    <>
      <Header />
      <main className="wrap prose">
        <p className="eyebrow">ŞƏXSİ MƏLUMATLAR</p>
        <h1>Məxfilik siyasəti</h1>
        <p>Son yeniləmə: 7 noyabr 2026</p>
        <h2>Hesab və əlaqə məlumatları</h2>
        <p>
          Hesab yaratmaq üçün ad, e-poçt ünvanı və telefon nömrəsi istifadə olunur. Şifrə serverdə yalnız
          şifrələnmiş (hash) şəkildə saxlanılır və heç kimə, o cümlədən administrasiyaya görünmür. Profil
          şəkli istəyə bağlıdır. Elanda göstərdiyiniz əlaqə nömrəsi, təsvir və şəkillər hamıya açıq görünür.
        </p>
        <h2>Elanlar və şəkillər</h2>
        <p>
          Yüklənən şəkillər saytın serverində saxlanılır. Şəxsi sənəd, bank kartı və üçüncü şəxslərin
          razılığı olmadan onların məlumatlarını yükləməyin. Silinən, müddəti bitən və ya rədd edilən elan
          saytda görünmür, lakin 180 gün ərzində bərpa üçün saxlanılır, sonra arxivə keçir.
        </p>
        <h2>Mesajlar</h2>
        <p>
          İstifadəçilər arasındakı mesajlar yalnız yazışmanın tərəflərinə görünür. Şikayət və ya dələduzluq
          şübhəsi araşdırılarkən administrasiya müvafiq yazışmaya baxa bilər.
        </p>
        <h2>E-poçt bildirişləri</h2>
        <p>
          Sayt təsdiq kodları, elanın təsdiqi və ya rəddi, yeni mesajlar haqqında xidməti məktublar göndərir.
          Bildirişləri profil səhifəsində söndürə bilərsiniz; təsdiq kodları hesabın təhlükəsizliyi üçün
          həmişə göndərilir.
        </p>
        <h2>Təhlükəsizlik</h2>
        <p>
          Hesabı qorumaq üçün giriş cəhdləri, IP ünvanı və brauzer məlumatı qısa müddət saxlanıla bilər
          (məsələn, şifrənin təxmin edilməsinin qarşısını almaq üçün). Bu məlumatlar başqa məqsədlə istifadə olunmur.
        </p>
        <h2>Brauzerdə saxlanan məlumat</h2>
        <p>
          Giriş sessiyası və seçilmiş elanların siyahısı brauzerinizdə saxlanılır. Seçilmişlər cihazlar
          arasında avtomatik ötürülmür. Hesabdan çıxdıqda sessiya bitir; ortaq cihazda işi bitirəndə
          hesabdan çıxın.
        </p>
        <h2>Şikayətlər</h2>
        <p>
          Şikayətə aid hesab identifikatoru, səbəb və mətn yoxlama üçün saxlanılır. Şikayəti yalnız siz və
          administrasiya görür. Şikayət mətninə həssas məlumat əlavə etməyin.
        </p>
        <h2>Məlumatların ötürülməsi</h2>
        <p>
          E-poçt ünvanınız və telefon nömrəniz reklam məqsədilə üçüncü şəxslərə verilmir. Qanunla tələb
          olunduqda məlumatlar səlahiyyətli dövlət orqanlarına təqdim edilə bilər.
        </p>
        <h2>Əlaqə</h2>
        <p>
          Məlumatlarınızla bağlı sual və ya hesabın silinməsi üçün kirayeal.az@gmail.com ünvanına yazın.
        </p>
        <p><Link href="/terms">İstifadəçi razılaşması</Link> · <Link href="/rules">Elan yerləşdirmə qaydaları</Link></p>
      </main>
      <Footer />
    </>
  );
}
