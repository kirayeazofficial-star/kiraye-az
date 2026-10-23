# Kirayə elanlarının irəlilədilməsi — sonrakı mərhələ

İstifadəçinin göndərdiyi mətn başqa elan saytının ödənişli “İrəli çək”, VIP və Premium xidmətlərinin təsviridir. Şirkət məlumatları və zəmanətlər köçürülmür. İstifadəçinin son istəyi əsasında göndərdiyi məbləğlər yalnız planlaşdırılan paketlərin passiv önbaxışında göstərilir; aktiv satış qiymətləri deyil.

Kirayə platforması üçün gələcəkdə uyğun variantlar:

- İrəli çək: təsdiqlənmiş və aktual kirayə elanının sıralanma vaxtını ayrıca yeniləmək. Elanın ilkin dərc tarixini dəyişdirməmək.
- VIP: yalnız istifadəçinin axtarış kateqoriyası və şəhərinə uyğun elanları ayrıca, açıq şəkildə “İrəlilədilmiş” kimi göstərmək.
- Premium: ana səhifədə müddəti müəyyən edilmiş reklam yeri; doluluq və mövcudluq zəmanəti verməmək.

Bu xidmətlər hazırda aktiv deyil. Aktivləşdirmə üçün sahibin qiymət qərarı, ödəniş provayderi, təhlükəsiz webhook təsdiqi, sifarişlərin və aktivlik müddətinin bazada saxlanması, təkrar ödənişlərin qarşısının alınması, imtina/qaytarılma qaydaları və işlək dəstək kanalı lazımdır. Brauzerdən göndərilən “ödəndi” dəyəri ilə status dəyişməməlidir. Elanın sahibi moderator təsdiqini və ya başqa istifadəçinin elanını satınalma ilə dəyişə bilməməlidir.

22 oktyabr 2026: istifadəçinin açıq istəyi ilə kabinetdə və şəxsi önbaxışda deaktiv “VIP et” və “İrəli çək” düymələri, altında aktiv olmadığı barədə qeyd əlavə edildi. Son yeniləmədə “Elanı reklam et” daxilində İrəli çək, VIP və Premium paketlərinin müddət və qiymət önbaxışı əlavə edildi. Qiymətlər və şərtlər ödəniş açılmadan əvvəl təsdiqlənməlidir. Heç bir ödəniş xidməti alınmayıb, sifariş və ya saxta VIP statusu yaradılmır.

Pulsuz limit: adi istifadəçi üçün hər kateqoriyada ayda 1 ilk dəfə təsdiqlənmiş elan. Yoxlamada və rədd edilmiş elanlar sayılmır; düzəliş və təkrar göndərmə pulsuzdur. Eyni elanın təkrar təsdiqi əlavə limit sərf etmir. Əvvəl təsdiqlənmiş elanı arxivləşdirmək/silmək istifadəni silmir. Admin panelinə giriş hüququ olan (`profiles.role='admin'`) hesablar limitsizdir. Başqasının elanını təsdiqləyən adminin hüququ həmin istifadəçinin limitini ləğv etmir.

`supabase/listing-submission-rules.sql` ayrıca canlı bazaya tətbiq edilməlidir. `listing_approval_usage` yalnız təsdiq vaxtı serverdə yazılır, istifadəçi onu dəyişə bilmir. Tarixi təsdiq vaxtı olmayan mövcud yayımlanmış elanlar bir dəfə yaradılma tarixi ilə daxil edilir. Köhnə `listing_monthly_usage` cədvəli artıq yoxlanmır, məlumatları silinmir. `has_category_listing_allowance` yalnız cari hesabın öz kateqoriya limitini qaytarır. RPC hələ tətbiq edilməyən qısa keçid dövründə müştəri yalnız cari yayımlanmış elanları yaradılma tarixi ilə yoxlaya bilər; arxiv/redaktə tarixçəsinin tam qorunması SQL tətbiqini tələb edir.

Təkrar elan yoxlaması eyni sahib, kateqoriya və şəhər üzrə normallaşdırılmış eyni başlıq + təsvir və ya eyni şəkil URL-lərini müəyyən edir. Başlığı/şəkilləri dəyişərək yenidən qoyulan eyni fiziki evi ünvan və ya unikal əmlak nömrəsi olmadan tam avtomatik müəyyən etdiyini iddia etmir; moderasiya tələb olunur. Başqa saytın cari qaydaları yoxlanmadan ona aid dəqiq limit və qiymət iddiası edilmir.

E-point sonradan qoşulanda qiymətlər, xidmət müddətləri və geri qaytarılma şərtləri təsdiqlənməli, server ödəniş təsdiqini yoxlamalıdır. Təkcə düyməni aktiv etmək kifayət deyil.

23 oktyabr 2026: paket müddətləri radio seçimlərinə çevrildi; İrəli çək variantlarının hər birində “8 saatdan bir” açıq göstərilir. Bank kartı və Şəxsi hesab seçimi, “Ödə” və profildə “Balans yüklə” önbaxışı var. Düymələr native details ilə yalnız texniki işlər mesajını açır. Ödəniş sorğusu, kart məlumatı yığılması, sifariş yaradılması, balans dəyişikliyi və irəlilətmə icrası yoxdur. 0,00 AZN yeni passiv balans bölməsinin başlanğıc göstəricisidir, maliyyə uçotu qurulduğu iddiası deyil. Ödəniş əlavə olunanda serverdə elanın sahibi, xidmət qiyməti, provayder təsdiqi və balans əməliyyatı ayrıca yoxlanmalıdır.
