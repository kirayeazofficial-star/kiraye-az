# Admin idarəetməsi — təsdiqlənmiş tətbiq planı, 25 oktyabr 2026

İstifadəçi planı təsdiqləyib; interfeys və `admin-management.sql` hazırlandı. Canlı tətbiq üçün səlahiyyətli baza girişi hələ lazımdır. İstifadəçinin son göstərişi: hazırda tək olan admin ilkin Rəhbər olsun. Migration yalnız bir mövcud admin tapanda bunu edir; birdən çox olduqda hesabı təxmin etmir. Mövcud beş moderasiya funksiyası qalır.

## Rəhbər və Köməkçi admin

- “Kiraya Az Official” kimi tanınan mövcud hesab ilkin Rəhbər olacaq, yalnız dəqiq Auth UID və ya təsdiqlənmiş email ilə hesabın kimliyi yoxlandıqdan sonra. Ekran adına əsasən səlahiyyət vermək olmaz. İlkin təyinat səlahiyyətli server/baza əməliyyatıdır; istifadəçi özünü rəhbər edə bilməz.
- Rəhbər mövcud hesabı email və ya hesab UID-si ilə tapır, adı/hesabı görüb təsdiqləyir və Köməkçi admin səlahiyyəti verir. Qeydiyyatdan keçməmiş emailə admin hesabı avtomatik yaradılmır.
- Rəhbər yeni “Adminlər” bölməsində admin siyahısı, rol, təyin edilmə vaxtı və təyin edən hesabı görür. “Yeni admin əlavə et” və “Səlahiyyəti geri al” əməliyyatları olur. Səlahiyyətin alınması istifadəçinin hesabını və elanlarını silmir.
- Köməkçi admin elan yoxlaması, rədd/təsdiq, şikayətləri idarə edir. Admin əlavə/silmək və Rəhbər rolunu dəyişmək səlahiyyəti yoxdur. Hər admin paneldə öz rolunu görür.
- Son Rəhbərin səhvən səlahiyyətsiz qalmasının qarşısı tranzaksiyalı server yoxlaması ilə alınır. Rəhbərliyi başqa hesaba vermək ayrıca əməliyyat və təsdiq tələb edir. Brauzerdə gizlənən düymə təhlükəsizlik sərhədi deyil.
- Bütün rol əməliyyatları dəyişdirilməz auditə yazılır. Səlahiyyətlər hər qorunan server sorğusunda yenidən yoxlanılır; geri alınmış moderator köhnə açıq səhifədən əməliyyat edə bilməməlidir.

## Elan və şikayət nömrələri

- Hazırkı UUID-lər, əlaqələr və keçidlər saxlanılır. Əlavə, dəyişməz rəqəmli istinad nömrəsi serverdə verilir.
- Elanlar üçün nümunə: 10000001; şikayətlər üçün: 20000001. Bunlar başlanğıc təklifidir; heç bir real hesaba/nömrəyə burada təyinat edilməyib. Minimum 8 rəqəm, artdıqca daha uzun ola bilər.
- Atomik sequence + UNIQUE məhdudiyyət; paralel göndərişlərdə toqquşma olmaz. Silinmiş/arxivlənmiş nömrə başqa qeydə verilmir. Nömrələr arasında boşluq ola bilər; onları say kimi istifadə etmə.
- Köhnə qeydlərə identity sütunu əlavə edilərkən rəqəmli nömrələr verilir; nömrə xronoloji yayım sırasını göstərmir. Tarix ayrıca saxlanılır. Keçmiş zaman, admin qərarı və sıralama uydurulmur.
- Admin elan/şikayət nömrəsi ilə axtarır, şikayətdə aid olduğu elanın nömrəsini görür. UUID ilə əvvəlki axtarış da qalır.

## Vaxt və gündəlik iş axını

- Elan və şikayətlərdə yaradılma vaxtı gün.ay.il saat:dəqiqə:saniyə formatında, açıq “Bakı vaxtı” (Asia/Baku) ilə göstərilir. Şikayətin baxılma vaxtı və baxan admin gələcək əməliyyatlarda qeydə alınır. Köhnə baxılma vaxtı yoxdursa uydurulmur.
- “Yoxlanılır”, “Yayımlanıb”, “Rədd edilib”, “Arxiv”, “Hamısı” bölmələri; yeni və yenidən yoxlamaya düşən elanların seçilməsi; tarix aralığı və nömrə ilə axtarış.
- Açıq şikayət və şikayət arxivi saxlanılır. Şikayətlərdə nömrə, elan, səbəb, yaradılma və baxılma vaxtı, baxan admin göstərilir.
- Paneldə edilən təsdiq/rədd və rol dəyişiklikləri “kim/nə vaxt/nə etdi” tarixçəsində izlənir. Müxtəlif moderatorun eyni elana paralel zidd qərar verməsinin qarşısı versiya/status yoxlaması ilə alınır.
- İlkin rəhbər təyinatı və bu genişləndirmə üçün canlı səlahiyyətli baza girişi lazımdır. Ödənişlər ayrıca təsdiqə qədər bağlı qalır.
