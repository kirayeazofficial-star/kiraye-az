import type { Metadata } from "next";
export const metadata: Metadata = { title: "Kömək | kirayeal.az", description: "Kirayeal.az-dan istifadə qaydaları, əlaqə və suallar.", alternates: { canonical: "/help" } };
import SiteContact from "../components/SiteContact";
import Link from "next/link";
import { Plus } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
export default function Help() {
  return (
    <>
      <Header />
      <main className="wrap prose">
        <p className="eyebrow">KİRAYƏ ÜÇÜN BƏLƏDÇİ</p>
        <h1>Sualın var? Buradan başla.</h1>
        <SiteContact />
        <div className="helpGrid">
          {[
            [
              "Elan necə yerləşdirilir?",
              "Hesabına daxil ol, şəkilləri və kirayə şərtlərini əlavə et. Elan idarəçi təsdiqindən sonra yayımlanır.",
            ],
            [
              "Elanımı necə dəyişə bilərəm?",
              "Şəxsi kabinetdə “Redaktə et” seç. Elanı gündə bir dəfə redaktə etmək olar, dəyişikliklər yenidən yoxlamaya göndərilir. Artıq aktual olmayan elanı silə bilərsən.",
            ],
            [
              "Kirayəni necə razılaşdırım?",
              "Elan səhifəsində zəng və ya WhatsApp düyməsi ilə sahibinə müraciət et. Tarix, depozit, qaytarılma və zərərə görə məsuliyyəti yazılı dəqiqləşdir.",
            ],
            [
              "Kirayə xərcini necə hesablayım?",
              "Elan səhifəsində götürmə və qaytarma tarixlərini seç. Günlük qiymət gün sayına, aylıq qiymət təqvim aylarının sayına vurulur. Depozit ayrıca göstərilir. Çatdırılma təklif edilirsə, seçə bilərsən. Haqqı yazılmayıbsa, sahibindən dəqiqləşdir. Kommunal və digər əlavə xərcləri də ayrıca razılaşdır.",
            ],
            [
              "Tarix seçmək rezervasiya yaradır?",
              "Xeyr. Hesablama və WhatsApp müraciəti tarixləri tutmur. Mövcudluğu və son qiyməti elan sahibi təsdiqləməlidir. Depozitin qaytarılması, gecikmə, zərər və ləğv şərtlərini əvvəlcədən yazılı razılaşdır.",
            ],
            [
              "Saytda ödəniş edə bilərəm?",
              "Hazırda platforma ödəniş və rezervasiya qəbul etmir. Elan sahibi ilə birbaşa razılaşırsan. Əmlakı görmədən beh göndərmə.",
            ],
            [
              "Şübhəli elanı necə bildirim?",
              "Elan səhifəsində “Bu elandan şikayət et” seç. Hesabına daxil olub səbəbi və qısa təsviri yaz. İdarəçi şikayəti yoxlayacaq.",
            ],
            [
              "Hesabıma necə daxil olum?",
              "“Daxil ol” bölməsində qeydiyyatdan keçdiyin e-poçt ünvanını və şifrəni yaz. Hesabın yoxdursa, “Qeydiyyatdan keç” seç. Şifrəni unutmusansa, “Şifrəni unutdum” ilə bərpa et.",
            ],
            [
              "Təsdiq məktubu gəlmir?",
              "Spam qovluğunu yoxla. Giriş səhifəsində yeni təsdiq məktubu istə. Yalnız ən son link və ya məktubdakı koddan istifadə et.",
            ],
          ].map(([q, a]) => (
            <details key={q} className="helpCard">
              <summary><h2>{q}</h2></summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
        <Link className="add kzIconBtn" href="/new">
          <Plus aria-hidden="true" size={18} strokeWidth={2.25} />Elan yerləşdir
        </Link>
      </main>
      <Footer />
    </>
  );
}
