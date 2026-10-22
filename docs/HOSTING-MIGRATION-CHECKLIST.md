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
