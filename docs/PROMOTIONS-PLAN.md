# Kirayə elanlarının irəlilədilməsi — sonrakı mərhələ

İstifadəçinin göndərdiyi mətn başqa elan saytının ödənişli “İrəli çək”, VIP və Premium xidmətlərinin təsviridir. Şirkət məlumatları və zəmanətlər köçürülmür. İstifadəçinin son istəyi əsasında göndərdiyi məbləğlər yalnız planlaşdırılan paketlərin passiv önbaxışında göstərilir; aktiv satış qiymətləri deyil.

Kirayə platforması üçün gələcəkdə uyğun variantlar:

- İrəli çək: təsdiqlənmiş və aktual kirayə elanının sıralanma vaxtını ayrıca yeniləmək. Elanın ilkin dərc tarixini dəyişdirməmək.
- VIP: yalnız istifadəçinin axtarış kateqoriyası və şəhərinə uyğun elanları ayrıca, açıq şəkildə “İrəlilədilmiş” kimi göstərmək.
- Premium: ana səhifədə müddəti müəyyən edilmiş reklam yeri; doluluq və mövcudluq zəmanəti verməmək.

Bu xidmətlər hazırda aktiv deyil. Aktivləşdirmə üçün sahibin qiymət qərarı, ödəniş provayderi, təhlükəsiz webhook təsdiqi, sifarişlərin və aktivlik müddətinin bazada saxlanması, təkrar ödənişlərin qarşısının alınması, imtina/qaytarılma qaydaları və işlək dəstək kanalı lazımdır. Brauzerdən göndərilən “ödəndi” dəyəri ilə status dəyişməməlidir. Elanın sahibi moderator təsdiqini və ya başqa istifadəçinin elanını satınalma ilə dəyişə bilməməlidir.

22 oktyabr 2026: istifadəçinin açıq istəyi ilə kabinetdə və şəxsi önbaxışda deaktiv “VIP et” və “İrəli çək” düymələri, altında aktiv olmadığı barədə qeyd əlavə edildi. Son yeniləmədə “Elanı reklam et” daxilində İrəli çək, VIP və Premium paketlərinin müddət və qiymət önbaxışı əlavə edildi. Qiymətlər və şərtlər ödəniş açılmadan əvvəl təsdiqlənməlidir. Heç bir ödəniş xidməti alınmayıb, sifariş və ya saxta VIP statusu yaradılmır.

Pulsuz limit: istifadəçi başına Bakı vaxtı ilə təqvim ayında 1 yeni elan; bütün göndərilən statuslar sayılır, redaktə sayılmır, arxivləşdirmə limiti geri qaytarmır. `supabase/listing-submission-rules.sql` ayrıca tətbiq edilməlidir. Müştəri tərəfi əvvəlcədən xəbər verir; yarışa və birbaşa API çağırışına qarşı əsas qoruma bazadakı trigger və qapalı istifadə cədvəlidir. Canlı bazaya tətbiq edilməyən SQL kodunun commit edilməsi bu qorumanı aktiv etmir.

Təkrar elan yoxlaması eyni sahib, kateqoriya və şəhər üzrə normallaşdırılmış eyni başlıq + təsvir və ya eyni şəkil URL-lərini müəyyən edir. Başlığı/şəkilləri dəyişərək yenidən qoyulan eyni fiziki evi ünvan və ya unikal əmlak nömrəsi olmadan tam avtomatik müəyyən etdiyini iddia etmir; moderasiya tələb olunur. Başqa saytın cari qaydaları yoxlanmadan ona aid dəqiq limit və qiymət iddiası edilmir.

E-point sonradan qoşulanda qiymətlər, xidmət müddətləri və geri qaytarılma şərtləri təsdiqlənməli, server ödəniş təsdiqini yoxlamalıdır. Təkcə düyməni aktiv etmək kifayət deyil.
