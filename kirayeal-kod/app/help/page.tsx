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
        <h1>Sualınız var? Buradan başlayın.</h1>
        <SiteContact />
        <div className="helpGrid">
          {[
            [
              "Elan necə yerləşdirilir?",
              "Hesabınıza daxil olun, şəkilləri və kirayə şərtlərini əlavə edin. Elan yoxlamadan keçdikdən sonra yayımlanır.",
            ],
            [
              "Elanımı necə dəyişə bilərəm?",
              "Şəxsi kabinetdə “Redaktə et” düyməsini seçin. Elanı 24 saat ərzində ən çox 2 dəfə redaktə etmək mümkündür. Dəyişikliklər yenidən yoxlamaya göndərilir. Aktual olmayan elanı silə bilərsiniz.",
            ],
            [
              "Kirayəni necə razılaşdırım?",
              "Elan səhifəsində zəng, mesaj və ya WhatsApp düyməsi ilə elan sahibinə müraciət edin. Tarixləri, depoziti, qaytarılma şərtlərini və zərərə görə məsuliyyəti yazılı şəkildə razılaşdırın.",
            ],
            [
              "Kirayə xərcini necə hesablayım?",
              "Elan səhifəsində götürmə və qaytarma tarixlərini seçin. Günlük qiymət gün sayına, aylıq qiymət təqvim aylarının sayına uyğun hesablanır. Depozit ayrıca göstərilir. Çatdırılma, kommunal və digər əlavə xərcləri elan sahibi ilə dəqiqləşdirin.",
            ],
            [
              "Tarix seçmək rezervasiya yaradır?",
              "Xeyr. Qiymətin hesablanması və WhatsApp müraciəti rezervasiya yaratmır. Mövcudluğu və yekun qiyməti elan sahibi təsdiqləyir. Depozitin qaytarılması, gecikmə, zərər və ləğv şərtlərini əvvəlcədən yazılı razılaşdırın.",
            ],
            [
              "Saytda ödəniş edə bilərəm?",
              "Hazırda platformada kirayə üzrə ödəniş və rezervasiya qəbul edilmir. Elan sahibi ilə birbaşa razılaşın. Əmlakı və ya əşyanı görmədən beh göndərməyin.",
            ],
            [
              "Şübhəli elanı necə bildirim?",
              "Elan səhifəsində “Bu elandan şikayət et” düyməsini seçin. Hesabınıza daxil olun, səbəbi və qısa təsviri yazın. Şikayət idarəçi tərəfindən araşdırılacaq.",
            ],
            [
              "Hesabıma necə daxil olum?",
              "“Daxil ol” bölməsində e-poçt ünvanınızı və şifrənizi daxil edin. Hesabınız yoxdursa, “Qeydiyyat” bölməsini seçin. Şifrənizi bərpa etmək üçün “Şifrəni unutmusunuz?” keçidindən istifadə edin.",
            ],
            [
              "Təsdiq məktubu gəlmir?",
              "“Spam” qovluğunu yoxlayın. Giriş səhifəsində “Təsdiq kodunu yenidən göndər” düyməsindən istifadə edin. Yalnız ən son göndərilmiş məktubdakı kodu daxil edin.",
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
