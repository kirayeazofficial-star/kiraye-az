# kirayeal.az — hostinqə keçiddə tamamlanacaq işlər

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
