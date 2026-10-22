import Header from "../components/Header";
import Footer from "../components/Footer";
export default function Rules() {
  return (
    <>
      <Header />
      <main className="wrap prose">
        <p className="eyebrow">QAYDALAR VƏ TƏHLÜKƏSİZLİK</p>
        <h1>Etibarlı kirayə üçün</h1>
        <h2>Elan yerləşdirərkən</h2>
        <p>
          Yalnız kirayə vermək hüququn olan əmlak və əşyaları yerləşdir. Real
          şəkil, düzgün qiymət və işlək əlaqə nömrəsi göstər. Qanunsuz, saxta və
          təkrar elanlar qəbul edilmir.
        </p>
        <h2>Pulsuz elan limiti və təkrar elanlar</h2>
        <p>
          Hər kateqoriyada ayda 1 pulsuz təsdiqlənmiş elan yerləşdirə bilərsən.
          Yoxlamada və rədd edilmiş elanlar limiti doldurmur. Rədd edilmiş elanı
          düzəldib yenidən göndərmək və mövcud elanı redaktə etmək pulsuzdur.
          Limit növbəti ay yenilənir. Təsdiqlənmiş elanı arxivləşdirmək həmin ayın
          istifadə edilmiş limitini geri qaytarmır. Admin panelinə giriş hüququ
          olan hesablar üçün elan sayı məhdud deyil.
        </p>
        <p>
          Eyni əmlak və ya əşya üçün təkrar aktiv elan yaratma. Məlumatları
          dəyişmək üçün mövcud elanı redaktə et. Avtomatik yoxlama eyni
          məlumatları və təkrar istifadə olunan şəkilləri yoxlayır; qalan hallar
          moderasiya zamanı qiymətləndirilir.
        </p>
        <h2>VIP və irəli çəkmə</h2>
        <p>
          VIP və “İrəli çək” xidmətləri hələ aktiv deyil. Hazırda bu seçimlərə
          görə ödəniş alınmır, elan VIP olmur və sıralaması dəyişmir. Qiymətlər
          və xidmət müddətləri aktivləşdirmədən əvvəl elan ediləcək. Bu
          xidmətlər moderasiya qaydalarını və elan limitini aradan qaldırmır.
        </p>
        <h2>Elanların yoxlanılması</h2>
        <p>
          Yeni elanlar yoxlamaya göndərilir. Qaydalara uyğun elanlar yayımlanır.
          Elanın yoxlanılması əmlakın vəziyyətinə və ya elan sahibinin
          etibarlılığına zəmanət deyil.
        </p>
        <h2>Ödəniş və razılaşma</h2>
        <p>
          Əmlakı görmədən və qarşı tərəfi yoxlamadan beh göndərmə. Qiymət,
          depozit, müddət və məsuliyyət şərtlərini yazılı razılaşdır. Platforma
          hazırda ödəniş qəbul etmir; tərəflər birbaşa əlaqə saxlayır.
        </p>
        <h2>Şəxsi məlumatlar</h2>
        <p>
          Elana əlavə etdiyin telefon nömrəsi, təsvir və şəkillər açıq
          yayımlanır. Şəxsiyyət vəsiqəsi, bank kartı, şifrə və digər həssas
          məlumatları elana əlavə etmə. E-poçt hesabına və paroluna girişi
          başqasına vermə.
        </p>
      </main>
      <Footer />
    </>
  );
}
