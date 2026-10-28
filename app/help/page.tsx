import SiteContact from "../components/SiteContact";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { siteContact } from "../../lib/site-contact";
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
              "Telefon, WhatsApp və ya e-poçtla bizimlə əlaqə saxla, şəkilləri və kirayə şərtlərini göndər. Elan hazırlanıb saytda yerləşdirilir.",
            ],
            [
              "Elanımı necə dəyişə bilərəm?",
              "Dəyişiklik və ya elanı saytdan götürmək üçün bizə yaz, elan yenilənəcək.",
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
              "Xeyr. Hesablama tarixləri tutmur. Mövcudluğu və son qiyməti elan sahibi təsdiqləməlidir. Depozitin qaytarılması, gecikmə, zərər və ləğv şərtlərini əvvəlcədən yazılı razılaşdır.",
            ],
            [
              "Saytda ödəniş edə bilərəm?",
              "Xeyr. Platforma ödəniş və rezervasiya qəbul etmir. Elan sahibi ilə birbaşa razılaşırsan. Əmlakı görmədən beh göndərmə.",
            ],
            [
              "Şübhəli elanı necə bildirim?",
              "Elanın ünvanını və səbəbi telefon, WhatsApp və ya e-poçtla bizə göndər. Elan yoxlanılacaq.",
            ],
          ].map(([q, a]) => (
            <section key={q} className="helpCard">
              <h2>{q}</h2>
              <p>{a}</p>
            </section>
          ))}
        </div>
        <a
          className="add"
          href={siteContact.whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          Elan yerləşdir
        </a>
      </main>
      <Footer />
    </>
  );
}
