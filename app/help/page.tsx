import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
export default function Help() {
  return (
    <>
      <Header />
      <main className="wrap prose">
        <p className="eyebrow">KİRAYƏ ÜÇÜN BƏLƏDÇİ</p>
        <h1>Sualın var? Buradan başla.</h1>
        <div className="helpGrid">
          {[
            [
              "Elan necə yerləşdirilir?",
              "Hesab yarat, e-poçtunu təsdiqlə, şəkilləri və kirayə şərtlərini əlavə et. Elan idarəçi təsdiqindən sonra yayımlanır.",
            ],
            [
              "Elanımı necə dəyişə bilərəm?",
              "Şəxsi kabinetdə “Redaktə et” seç. Dəyişikliklər yenidən yoxlamaya göndərilir. Artıq aktual olmayan elanı arxivə keçirə bilərsən.",
            ],
            [
              "Kirayəni necə razılaşdırım?",
              "Elan səhifəsində zəng və ya WhatsApp düyməsi ilə sahibinə müraciət et. Tarix, depozit, qaytarılma və zərərə görə məsuliyyəti yazılı dəqiqləşdir.",
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
              "Təsdiq məktubu gəlmir?",
              "Spam qovluğunu yoxla. Giriş səhifəsində yeni təsdiq məktubu istə. Yalnız ən son link və ya məktubdakı koddan istifadə et.",
            ],
          ].map(([q, a]) => (
            <section key={q} className="helpCard">
              <h2>{q}</h2>
              <p>{a}</p>
            </section>
          ))}
        </div>
        <Link className="add" href="/new">
          Elan yerləşdir
        </Link>
      </main>
      <Footer />
    </>
  );
}
