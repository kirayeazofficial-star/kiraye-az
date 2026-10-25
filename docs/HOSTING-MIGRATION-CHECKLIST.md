# kirayeal.az — hostinqə keçiddə tamamlanacaq işlər

> **24 oktyabr 2026 — birinci prioritet:** İşlək və icazəli SSH/canlı baza bağlantısı verilən kimi, istifadəçi ayrıca prioriteti dəyişməzsə, yeni tapşırıqlardan ƏVVƏL bu sənəddəki bütün gözləyən server işlərini tamamla. Təkcə limitlər yox: mövcud və yeni elanlar, açıq giriş, qeydiyyat/bərpa, altırəqəmli kod, SMTP, məlumatların qorunması və yerləşdirmə yoxlamaları da daxildir. Sonda faktiki yoxlanmış və hələ bloklanan işləri ayrı bildir.


İstifadəçinin 22 oktyabr 2026 tələbi: əlavə xatırlatma gözləmədən aşağıdakıları tamamla.

- SSH açıldıqda ən son yoxlanmış mənbə kodunu yerləşdir; əvvəlcə işlək sayt və geri dönüş üçün ehtiyat nüsxə hazırla. CloudLinux tətbiq kökünü `kirayeal` saxla, mövcud dolu qovluğa selector relocation işlətmə.
- Baza, istifadəçilər, elanlar, şəkillər və şikayət tarixçəsini itkisiz köçür. Supabase və Vercel xidmətlərini yalnız əvəzləyən xidmətlər yoxlandıqdan sonra ayır.
- Hostinqdə domenə aid göndərən ünvanı (məsələn, `noreply@kirayeal.az`) və SMTP-ni qur. Parolları yalnız serverin məxfi mühitində saxla.
- Qeydiyyat təsdiqi və şifrə bərpası məktubları yalnız sahibin ünvanına deyil, bütün qeydiyyatdan keçən istifadəçilərin ünvanlarına çatsın. Mövcud Resend test göndərəninin icazə verilmiş tək ünvana məhdudiyyətini aradan qaldıran real domen SMTP istifadə et.
- SPF, DKIM, DMARC və məktub göndərən domeni yoxla; iki ayrı provayderdə olan test ünvanına faktiki çatdırılmanı, kod/link müddətini və bərpa axınını yoxla. SMTP limitsiz göndəriş demək deyil: provayder kvotalarını saxla, sui-istifadəyə qarşı limitləri tətbiq et.
- Google ilə giriş üçün Google Cloud OAuth client, gizli açar, razılıq ekranı və doğru callback ünvanları tələb olunur. Təkcə düymə göstərməklə inteqrasiya işləmir. Vercel → kirayeal.az callback keçidini də yoxla. Apple/iCloud Google hesabı deyil; ayrıca istənilərsə Apple developer konfiqurasiyası lazımdır.
- Girişsiz telefonda yayımlanmış elanların siyahısını və detallarını, pending elanın yalnız sahibinə görünməsini, şikayət göndərişini və admin arxivini faktiki bazada yoxla.

- `supabase/listing-submission-rules.sql` mövcud bazada tətbiq et və ya yeni hostinq bazasının autentifikasiya sxeminə uyğunlaşdır: hər istifadəçiyə ayda 1 yeni elan, normallaşdırılmış təkrar elan yoxlaması və arxivləşdirmə/silmə ilə sıfırlanmayan istifadə qeydi. Mövcud elanları və admin səlahiyyətlərini qoru. E-point qoşulana qədər VIP/irəli çək deaktiv qalsın.

## Hazırkı məhdudiyyətlər

Bu fayl server qurulduğu və ya SMTP/Google aktiv olduğu iddiası deyil. SSH və provayder konfiqurasiyası olmadan hostinq və xarici OAuth dəyişiklikləri tətbiq edilməyib. `supabase/public-access-repair.sql` mövcud bazada yalnız SQL icazəli bağlantı ilə tətbiq edilə bilər. Mənbə koduna commit SQL-in avtomatik bazada icrası demək deyil.

## Son limit və mobil giriş tələbləri

- `supabase/listing-submission-rules.sql` yenilənmiş variantını tətbiq et: admin panelinə daxil olan hesablar limitsiz, adi istifadəçi üçün hər kateqoriyada ayda bir ilk təsdiqlənmiş elan. Pending/rejected sayılmır, eyni elanın redaktəsi və təkrar təsdiqi əlavə yer tutmur. Köhnə hesab üzrə ümumi limitə qayıtma.
- İki adi hesab və bir admin hesabı ilə canlı yoxla: kateqoriyalar müstəqildir, rədd edilmiş elan düzəldilə bilir, admin başqa istifadəçinin ikinci təsdiqində həmin istifadəçinin limitini keçə bilmir.
- Real iPhone Safari-də `@` tamamlaması, ayrıca Göstər/Gizlət düyməsi, yeni qeydiyyat, mövcud hesab mesajı və şifrə bərpasını yoxla. Hazırkı mühitdə Safari/WebKit yükləməsi bloklandığı üçün Chromium touch sınağı real Safari sınağı kimi sayılmır.
- Mövcud olmayan e-poçtun bərpa sorğusunda xidmətin ümumi cavabını məktubun göndərilməsi kimi təqdim etmə; bərpa sorğusu yeni istifadəçi yaratmamalıdır. Hostinqə keçəndə bunu göndəriş qeydləri ilə də yoxla.

- Yeni kateqoriyalar üçün `supabase/rental-categories.sql` tətbiq et (tam yeni quraşdırmada yenilənmiş `schema.sql` da kifayətdir). Geyim, elektrik skuter/velosiped, foto-video və turizm kateqoriyalarında bir elan göndərib təsdiqlə. Mövcud avadanlıq elanlarının kateqoriyası və məlumatı dəyişdirilməyib.

- Son ödəniş önbaxışı: paketlər və bank kartı/şəxsi hesab seçilə bilir, “Ödə” və “Balans yüklə” yalnız texniki işlər mesajını açır. Heç bir ödəniş endpointi və balans artırılması yoxdur. Gələcək E-point inteqrasiyası server təsdiqli sifariş və ayrıca balans uçotu tələb edir.
- Bərpa üçün dəqiq “hesab tapılmadı” cavabı: `supabase/recovery-check.sql` tətbiq et və yalnız serverdə `SUPABASE_SERVICE_ROLE_KEY` saxla. SMTP-ni ayrıca düzəlt və real çatdırılmanı yoxla.
- `npm run build` və `npm run dev` uyğunluq faylını Next-in quraşdırılmış paketindən yaradır; fərdi build əmri bu addımı ötürməməlidir. Köhnə brauzer API-ləri çıxarılaraq sınaqlar əlavə edilib, bu real iPhone Safari sınağının əvəzi deyil. Real iOS versiyası ilə yenidən yoxla.

## Hostinq e-poçtu və SSH məlumatları

- Economic X paketində e-poçt hesabının olması SMTP göndərişinin sayta avtomatik qoşulması deyil. cPanel → Email Accounts → Connect Devices bölməsindəki SMTP hostu, TLS/SSL portu və tam e-poçt istifadəçi adı tələb olunur. Parol yalnız məxfi konfiqurasiyada saxlanır.
- Hostinq SMTP-si xarici ünvanlara təsdiq və bərpa məktubları göndərməyə icazə verirsə, əvvəlki Resend/Sender göndərişini əvəz edə bilər. Hazırkı Supabase Auth üçün əvvəlcə həmin SMTP onun göndəriş ayarlarına qoşulmalıdır; serverə köçürüldükdən sonra yerli tətbiqdə istifadə ediləcək.
- Dəstəkdən SSH host/IP, SSH portu, istifadəçi adı və shell/key authentication aktivliyini təsdiqləməsini istə. cPanel 2083 SSH portu deyil. `kirayeal-deploy` açarı əvvəlcədən avtorizasiya edilib; şəxsi açarı və parolu söhbətə göndərmək lazım deyil.
- Yeni elan: şəhər/qiymət boş başlayır, brauzer autofill söndürülür. Redaktə mövcud məlumatları saxlayır; əlaqə sahələri hesabdan doldurulur. Kateqoriya/növ/marka yalnız başlıq təklifi verə bilər.

- Hesab yaşı: `supabase/public-seller-since.sql` yalnız yayımlanmış elanın sahibinin qeydiyyat ayını/ilini açır; e-poçt və şəxsi profil açılmır. SQL canlı bazaya tətbiq edilməyibsə tarix gizli qalır, elan bloklanmır. Hostinq köçürməsində eyni məxfilik qaydasını saxla.
- Elan yerləşdirmə formasında PIN/CVV, SMS kodu, şübhəli ödəniş keçidləri və düzgün məlumat barədə qısa təhlükəsizlik qeydi var; uğurlu göndərişdən sonra və ictimai elan səhifəsində göstərilmir. Bu qeyd moderasiya və server icazələrini əvəz etmir.

- Qeydiyyatın canlı xətası: “Təsdiq məktubu göndərilə bilmədi. Saytın e-poçt göndəriş xidməti yoxlanmalıdır.” SMTP göndərişi faktiki düzəlməyib; qeydiyyat yoxlamasını söndürməklə gizlətmə. Hostinq SMTP-si `mail.kirayeal.az:465`, istifadəçi/göndərən `noreply@kirayeal.az`; parol məxfi ayarda saxlanmalıdır. Köçürmədən sonra xarici istifadəçi ünvanına təsdiq və bərpa çatdırılmasını yoxla.
- SSH açıldıqda tətbiq və baza imkanlarını, disk/backup/SMTP limitlərini təsdiqlə. Elanlar server bazasında saxlanmalı, təsdiqlənmiş elanları anonim ziyarətçi də bütün cihazlardan görə bilməlidir. Bu tələb tək hostinq alışı ilə avtomatik yerinə yetirilmir; məlumat köçürməsi və anonim giriş sınağı tamamlanmalıdır.

- X1 paketində istifadəçinin göndərdiyi məlumatlara görə Node.js/Python, 20 GB SSD, 5 e-poçt, limitsiz verilənlər bazası və gecə ehtiyat nüsxəsi var. “Limitsiz baza” RAM/CPU, verilənlər bazası növü və SMTP kvotasının limitsiz olması demək deyil; SSH ilə real imkanları təsdiqlə.
- Şifrə bərpası: yalnız bazada mövcudluğu təsdiqlənən e-poçta göndər; hesab yoxdursa “Bu e-poçtla hesab tapılmadı”. Yoxlama xidməti hazır deyilsə göndərmə və uğur mesajı göstərmə. İşlək göndərişdən sonra birbaşa 6 rəqəmli kod xanası açılsın; əlavə “məktubum gəlib” düyməsi yoxdur.
- Bərpa məktubu `supabase/templates/recovery.html` kod şablonundan istifadə etməlidir; yeni məktubda link olmasın, OTP uzunluğu 6 təyin edilsin. Repo faylı idarə olunan Auth şablonunu avtomatik dəyişmir. SMTP + yoxlama RPC/servis açarı + şablon/OTP ayarları canlıda ayrıca qurulmalıdır.

- İstifadəçinin təsdiqlədiyi qayda istiqaməti: Tap.az nümunəsinə uyğun 30 günlük aktivlik, ayrıca eyni vaxtda aktiv elan limiti və 30 günlük kateqoriya yerləşdirmə limiti, şərtli bərpa. Köhnə ayda 1 təsdiqlənmiş elan qaydasını “Tap.az ilə eyni say” kimi təqdim etmə. Göndərilən mətndə kateqoriya üzrə konkret rəqəmlər yoxdur; saylar müəyyənləşdirilməlidir. /rules səhifəsində bu hissə aktivləşdiriləcək qaydalar kimi açıq işarələnib. Avtomatik bitmə/limit/bərpa serverdə həyata keçirilib yoxlanmadan aktiv statusa çevirmə; ödənişlər istifadəçi ayrıca aktivləşdirməyincə bağlı qalır.

## İşlək 30 günlük limit və müddət sistemi

- `supabase/listing-lifecycle.sql` faylını `schema.sql` və `listing-submission-rules.sql`-dən sonra ehtiyat nüsxə ilə tətbiq et. Mövcud elanlara ilk təsdiq tarixi (tarix yoxdursa ilkin yerləşdirmə tarixi) əsasında müddət verilir; müddəti bitənlər silinmir.
- Kateqoriya sayları `listing_category_limits` cədvəlində idarə olunur. Əvvəlki sayt qaydasındakı 1 sayı saxlanılıb; bu Tap.az-ın dəqiq kateqoriya rəqəmi kimi təqdim edilmir. Tətbiq zamanı admin istisnası saxlanılır. Yeni sistem həm aktiv sayı, həm son 30 günlük təsdiqlənmiş yerləşdirmə/bərpa dövrlərini serverdə yoxlayır.
- 30 gün bitəndə elan anonim axtarışdan və birbaşa ictimai keçiddən server icazələri ilə gizlənir; sahibin kabinetində “Müddəti bitib” görünür. Bərpa yalnız sahibə məxsus RPC ilə yoxlamaya göndərilir. İlk dövr daxilində bərpa tarixi uzatmır; sonrakı dövr yeni 30 günlük istifadə kimi hesablanır.
- Hostinq planlaşdırıcısında `scripts/expire-listings.mjs` faylını məxfi server mühiti ilə müntəzəm işə sal. İşin işləməməsi ictimai gizlətməni pozmur: baza icazəsi bitmə tarixini ayrıca yoxlayır. Qaydalar səhifəsi yeni server funksiyasını görəndə yeni qaydanın aktiv olduğunu göstərir.
- Bazaya tətbiq və real anonim/owner/admin yoxlamaları tamamlanmayınca bu sistemi canlıda aktiv sayma. Ödənişlər bağlı qalır; limit doludursa pul tutulmur.

## Görünüş, dil, tarix və şəkillər

- Ana səhifənin əsas interfeysində AZ/RU/EN seçimi var və seçim həmin brauzerdə saxlanılır. İstifadəçilərin elan mətnləri avtomatik tərcümə edilmir. Digər səhifələrin tam tərcüməsi ayrıca genişləndirilə bilər.
- Azərbaycan təqvimi brauzerin türk dilindəki tarix pəncərəsindən istifadə etmir. Nömrənin son 4 rəqəmi ekranda ulduzlanır; zəng bağlantısı tam nömrə ilə işləyir.
- Yeni şəkillər göndərilməzdən əvvəl şəffaf nişan faylın daxilinə çəkilir. Mövcud şəkillərə saytın görünüşündə nişan əlavə olunur; əvvəldən saxlanmış orijinal fayllar dəyişdirilməyib.
- K nişanının SVG, 48 və 192 piksel PNG variantları əlavə edilib. Google nəticələrində yenilənmə axtarış sisteminin növbəti indeksləməsindən asılıdır.


## 24 oktyabr — həftəlik tarif və baxış statistikası

- `supabase/rental-features.sql` canlı bazada tətbiq et. Həftəlik tarif radio düyməsi readiness RPC təsdiqindən sonra aktiv olur; hazırkı bazanın CHECK məhdudiyyətini keçmək üçün qiyməti günlük kimi saxlamaq olmaz.
- `SUPABASE_SERVICE_ROLE_KEY` yalnız serverdə saxla. `/api/listing-view` üçün etibarlı reverse proxy `X-Forwarded-For` başlığını özü yazmalı, müştərinin saxta başlığını ötürməməlidir. Bu təminat olmadan sayğacı aktivləşdirmə. Eyni IP/brauzer üçün gündə bir baxış hesablanır, real unikal insan/zəng sayı deyil. Sahibi daxil olduqda öz baxışı sayılmır. Köhnə baxışlar uydurulmur.
- İki ayrı sahib hesabı ilə statistikaya girişin yalnız öz elanlarını göstərdiyini, anon istifadəçinin xam məlumatlara və yazma RPC-sinə girmədiyini yoxla. Hazırkı commit canlı aktivləşmə iddiası deyil.
- Köhnə `branded-` şəkillərində aşağıda olan yazı fayla əvvəldən həkk olunub. Onu itkisiz götürmək üçün orijinal şəkillər lazımdır. Yeni `branded-v2-` şəkillər mərkəzdə həkk olunur; köhnə URL şəkillərinin görünüş örtüyü mərkəzdədir.

## 24 oktyabr — qeydiyyat və əlaqə yeniləməsi

- `supabase/profile-registration.sql` tətbiq et: ad-soyad və əlaqə nömrəsi Auth metadata-dan profilə götürülür, əvvəlki rol və doldurulmuş məlumatlar qorunur. Yeni email hesabları üçün bu məlumatlar serverdə də tələb olunur. Əlaqə nömrəsi SMS təsdiqi almış nömrə kimi işarələnməməlidir.
- `supabase/templates/confirmation.html` şablonunu Auth qeydiyyat təsdiqi üçün tətbiq et və OTP uzunluğunu 6 saxla. SMTP canlıda yoxlanılmayınca məktub çatdırılmasını işlək kimi göstərmə.
- İstifadəçi telefon nömrələrinin elanda tam görünməsini və yeni şəffaf nişanın sol aşağıda olmasını istəyir; əvvəlki maskalama/mərkəz tələbi bununla əvəz edilib. Köhnə şəkilə həkk olunmuş nişanı itkisiz köçürmək üçün orijinal lazımdır; yeni yükləmələr `branded-v3-` olur.
- İctimai əlaqə: 050 219 11 45, kirayeal.az@gmail.com, Instagram/TikTok @kirayeal.az. Bu ünvan SMTP göndərənini əvəz etmir.

## 24 oktyabr — ödənişli arxiv bərpası

- İstifadəçi əvvəlki pulsuz bərpa qaydasını dəyişdi: vaxtından əvvəl silinib/arxivlənmiş və müddəti bitmiş elan üçün bərpa pulludur. Qiymət hələ verilməyib; məbləğ uydurma. Ödənişlər aktivləşənədək bərpa bağlı qalır.
- `supabase/paid-restoration.sql` faylını `listing-lifecycle.sql`-dən SONRA tətbiq et. RPC ilə yanaşı birbaşa UPDATE/redaktə yolu ilə ödənişsiz bərpa da serverdə bloklanır. Yeni ödəniş inteqrasiyası gələndə serverdə təsdiqlənmiş ödəniş və sahiblik yoxlanmadan bu qadağanı açma.
- “Sil / arxivə keçir” yumşaq silmədir: məlumat və şəkillər qalır, ictimai siyahıdan çıxır. Arxiv bölməsi həm əl ilə arxivlənmiş, həm müddəti bitmiş elanları göstərir.

## 24 oktyabr — SEO və əmlak sahələri

- `docs/SEO-SETUP.md` üzrə canlı domen, server HTML, sitemap, robots və Search Console yoxlamalarını tamamla.
- `supabase/property-details.sql` yeni sanuzel sayını JSON attributes-də 1–20 tam ədəd kimi yoxlayır, köhnə sətirləri silmir. “Həyət evi” adı formanın yeni seçimində “Bağ evi” ilə əvəz olunub; köhnə dəyər görünüşdə və redaktədə uyğunlaşdırılır.
- Adminin elan yoxlamasında yalnız rədd/təsdiq düymələri var; əl ilə arxiv düyməsi çıxarılıb. Avtomatik müddət bitməsi və istifadəçinin öz elanını arxivləməsi əvvəlki kimi qalır.

### Weekly selector correction — 25 October 2026
The posting/editing form no longer depends on `rental_features_ready()` to enable weekly rates: a missing RPC or network timeout was incorrectly disabling a tariff already present in schema.sql. All categories offer daily/weekly/monthly. Apply the existing rental-features.sql migration if the live database still has the old daily/monthly constraint; verify a real weekly insert and edit after gaining access. Source changes alone do not establish live database readiness.

## 25 oktyabr — istifadəçinin növbəti sessiya üçün təsdiqlədiyi işlər

Bu siyahı davametmə qeydidir; gələcək vaxta avtomatik icra və ya artıq canlıya tətbiq iddiası deyil.

- Mobil menyunun bağlama düyməsi mənbə kodunda düzəldilib: sayt rəngində SVG X, 44px dairəvi toxunma sahəsi, touch ilə açılışda fokus dialoqa verilir, klaviatura ilə açılışda düyməyə fokus və görünən işarə saxlanır. Bölmələr qruplaşdırılıb, əlaqə kartı əlavə edilib. 320×568 və 390×844 sınaqları keçib; real iPhone və canlı yayımlanma ayrıca yoxlanmalıdır.
- Hostinq.az işlək SSH host/IP, port və istifadəçi məlumatını verdikdən sonra əvvəlcə bağlantını və mövcud açarın girişini yoxla. cPanel 2083 SSH portu deyil. Məxfi açar və SMTP parolunu çatda göstərmə.
- Əvvəl tam ehtiyat nüsxə və bərpa planı. Bütün mövcud istifadəçilər, elanlar, şəkillər, rollar və şikayətlər qorunsun. Hədəf yalnız Hostinq.az-da tətbiq, baza, fayllar və autentifikasiyadır; DB və runtime imkanlarını yoxlayıb uyğunlaşdır. Supabase SQL/RPC-lərini başqa bazaya kor-koranə icra etmə; davranışları hədəf sistemə köçür.
- Bu sənəddəki BÜTÜN gözləyən server işlərini tamamla: köhnə/yeni elanlara limitlər, 30 günlük dövr/arxiv, ödəniş bağlıykən pullu bərpa qadağası, həftəlik tarif, profil qeydiyyatı, sanuzel yoxlaması, baxış statistikası, şikayətlər və giriş səlahiyyətləri. Qeydiyyatsız ziyarətçi bütün uyğun yayımlanmış elanları görə bilməlidir.
- Qeydiyyat, giriş/çıxış, email təsdiqi və şifrə bərpasını real serverdə yoxla. Mövcud olmayan emailə kod göndərilməsin; mövcud hesaba yalnız 6 rəqəmli kod göndərilsin. Noreply göndərən: noreply@kirayeal.az, SMTP mail.kirayeal.az:465 SSL/TLS; parol ayrıca təhlükəsiz konfiqurasiyada. SPF/DKIM/DMARC, göndəriş limitləri və real çatdırılma testləri tamamlanmalıdır.
- Google ilə giriş istifadəçi tərəfindən təsdiqlənib; uyğun OAuth layihəsi/client ID/server secret, consent və callback domenləri lazımdır. Bunlar olmadan aktiv düymə və uğurlu giriş iddiası etmə. SMS xidməti bu tapşırığa daxil deyil.
- kirayeal.az domeninin DNS, HTTPS/sertifikat, canonical, yönləndirmələr, sitemap və robots yoxlamalarını et. Search Console sahiblik təsdiqi üçün istifadəçinin Google hesabına səlahiyyət və ya verilən DNS TXT tokeni lazımdır; təsdiqi və sıralamanı uydurma.
- Epoint və bütün real ödənişlər, balans yükləmə, pullu reklam aktivləşdirmə və pullu bərpa bağlı qalır. Şəxsi hesabda saxta balans və ya əməliyyat yaratma.
- Yeni hostingdə real qəbul testləri keçdikdən və geri dönüş imkanı saxlandıqdan sonra Vercel/Supabase asılılıqlarını çıxar. Köhnə layihə/məlumatları silməzdən əvvəl ehtiyatın və yeni sistemin tamlığı yoxlanmalıdır; servis hesablarını bütövlükdə bağlamaq nəzərdə tutulmur.
- Əmlak növü üzrə son qərar: “Həyət evi” saxlanılır, “Bağ evi” ilə əvəz edilmir. Villa üçün mərtəbə sayı əlavə edilib; əvvəlki 24 oktyabr qeydi bu hissədə köhnədir.
