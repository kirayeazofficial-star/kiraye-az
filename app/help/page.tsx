import type { Metadata } from "next";
export const metadata: Metadata = { title: "Kömək | kirayeal.az", description: "Kirayeal.az-dan istifadə qaydaları, əlaqə və suallar.", alternates: { canonical: "/help" } };
import HelpContact from "../components/HelpContact";
import Header from "../components/Header";
import Footer from "../components/Footer";
export default function Help() {
  return (
    <>
      <Header />
      <main className="wrap prose">
        <p className="eyebrow">KİRAYƏ ÜÇÜN BƏLƏDÇİ</p>
        <h1>Sualınız var? Buradan başlayın.</h1>
        <div className="helpGrid">
          {[
            ["Elan necə yerləşdirilir?", "Hesabınıza daxil olun, kateqoriyanı seçin, şəkilləri və kirayə şərtlərini əlavə edin. Elan yoxlamadan sonra yayımlanır."],
            ["Elanımı necə dəyişə bilərəm?", "Şəxsi kabinetdə «Redaktə et» düyməsini seçin. Elanı 24 saat ərzində ən çox 2 dəfə redaktə etmək olar, dəyişikliklər yenidən yoxlamaya göndərilir. Aktual olmayan elanı silə bilərsiniz."],
            ["Kirayəni necə razılaşdırım?", "Elan səhifəsində zəng və ya WhatsApp düyməsi ilə elan sahibinə müraciət edin. Tarixi, depoziti, qaytarılmanı və zərərə görə məsuliyyəti yazılı şəkildə dəqiqləşdirin."],
            ["Kirayə xərcini necə hesablayım?", "Elan səhifəsində götürmə və qaytarma tarixlərini seçin. Günlük qiymət gün sayına, aylıq qiymət ayların sayına vurulur. Depozit ayrıca göstərilir. Çatdırılma və kommunal kimi əlavə xərcləri elan sahibi ilə dəqiqləşdirin."],
            ["Tarix seçmək rezervasiya yaradır?", "Xeyr. Hesablama tarixləri tutmur. Mövcudluğu və son qiyməti elan sahibi təsdiqləməlidir."],
            ["Saytda ödəniş edə bilərəm?", "Kirayə haqqını sayt qəbul etmir, elan sahibi ilə birbaşa razılaşırsınız. Əşyanı və ya əmlakı görmədən beh göndərməyin."],
            ["Şübhəli elanı necə bildirim?", "Elan səhifəsində «Şikayət et» düyməsini seçin, səbəbi və qısa izahı yazın. Şikayəti administrasiya yoxlayacaq."],
            ["Hesabıma necə daxil olum?", "«Daxil ol» bölməsində e-poçt ünvanınızı və şifrənizi yazın. Hesabınız yoxdursa, «Qeydiyyat» seçin. Şifrəni unutmusunuzsa, «Şifrəni unutdum» ilə bərpa edin."],
            ["Təsdiq məktubu gəlmir?", "Spam qovluğunu yoxlayın. Giriş səhifəsində yeni kod istəyin və yalnız ən son məktubdakı koddan istifadə edin."],
          ].map(([q, a]) => (
            <details key={q} className="helpCard">
              <summary><h2>{q}</h2></summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
        <HelpContact />
      </main>
      <Footer />
    </>
  );
}
