# Son qərarlar və qəbul şərtləri

Bu, əvvəlki işin davamıdır. Tapşırıqlar ləğv edilməyib. AGENTS.md-də daimi qaydalar yenilənib.

## Növbəti işlərin ardıcıllığı

1. Yarımçıq proseslərin nəticəsini yoxla. Son dump yaranıb; şəkil endirilməsi və bu yeni nüsxənin bərpası ayrıca tamamlanmalıdır. Eyni SQL-i təkrar işlətmə.
2. Sahib iki real hesab arasında “salam” mesajının alıcıda görünmədiyini bildirib. Əvvəl bunu araşdır. Əvvəlki idarə olunan testin keçməsi bu yeni bildirişi təkzib etmir. Düzgün alıcı/thread, DB qeydi, JWT/RLS, inbox/polling, hesab dəyişmə və yenidən giriş ayrı sessiyalarda yoxlanmalıdır. Real şəxsi mesaj məzmununu loga çıxarma.
3. Qeydiyyat və bərpa SMTP550 səbəbinin provayder loqları ilə həlli; real 6 rəqəmli təsdiq → giriş/çıxış → bərpa → yeni şifrə sınağı. 503 hesab yoxlaması artıq düzəlib, təkrar qurma. Adi SMTP Accepted məktubu tam Auth sınağı deyil. Google OAuth girişləri və real sınaq ayrıca qalır.
4. Hesab menyusunda səlahiyyətli istifadəçiyə birbaşa admin keçidi. Admin bölmələri ayrı ekran/tab olsun; auditdən mövcud elana keçid, silinmiş elanın audit xülasəsi olsun. Gizli elan adi istifadəçiyə açılmasın.
5. Admin təyinatında yalnız dəyişməz rəqəmli hesab ID-si serverdə qəbul edilsin. Əvvəlki email/telefon/UUID lookup qaydası bu əməliyyatda əvəz edilib. Elan axtarışında telefon qalsın. Rəhbəri qoruyub hər dəyişiklikdə audit saxla.
6. Mobil kabinet select-i ikonlu menyu ilə əvəz et. Bölmələr ayrıca məzmun göstərsin, çıxış aydın olsun; sürüşən statuslar qalsın. Real balans və şəxsi pul tarixçəsi; ödəniş/kart/topup bağlı.
7. Profil adı redaktəsi; bir əsas telefon. Telefon/email hərəsinə maksimum 3 uğurlu dəyişiklik; serverdə sayğac, email təsdiqində atomik sayılma, paralel sorğularda limitin keçilməməsi. İlkin/equal/failed/cancelled sayılmır. Qalan haqq/dəstək yolu. Yeni elanda yalnız əsas telefon; köhnə fərqlərin inventarı və ehtiyatı olmadan kütləvi dəyişmə. SMS yoxdur, telefon təsdiqli deyil.
8. Kod axını və “Məni yadda saxla”; özbaşına logout səbəbi, token yenilənməsi/domain/storage/cookie/redirect araşdırılsın. Çıxış sessiyanı bitirsin; təhlükəsizlik müddəti zəiflədilməsin.
9. Mesajlar desktopda aydın və unread saylı; rahat şrift/composer/list, qarşı tərəfin adı/rəqəmli ID/elan. Şəxsi əlaqə məlumatı sızdırılmasın. Blok/report/spam qorunsun, re-login/reload tarixçə qalsın.
10. Kartlarda yığcam ürək, seçilmə vəziyyəti, ölçü dəyişməməsi; “Sürətli baxış” və artıq kateqoriya etiketləri silinsin. Kart açılışı/favorite hadisələri ayrı qalsın. Yuxarı Yeni elan qalsın, ortadakı iri təkrar CTA çıxarılsın, aşağı nav düzəlsin.
11. Həqiqi baxış sayını yalnız proxy/owner/dedup canlı sınağından sonra aktiv et. Hazırda feature flag bağlıdır. Limitlərin kabinetdə real server göstəricisi, profil dəyişiklikləri və əvvəlki backlog tamamlanmalıdır.
12. Tam host-only infrastrukturu, şifrəli Drive gündəlik/deploy sonrası avtomatika, əvvəlki tarixlər, uğursuzluq bildirişi, başqa hostda platforma bərpası və domen idarəsinin sahibdə olması ayrıca təsdiqlənməlidir. Kodun olması işlək avtomatika deyil.

Hər mərhələdə ehtiyat → yoxlama → deploy → real qəbul sınağı → GitHub və davam qeydi. Mobil dar ekran/klaviatura/uzun mətn/boş nəticələr, masaüstü də yoxlansın. Chromium real iPhone Safari sayılmır. Məxfi məlumatlar GitHub-a çıxmır, real istifadəçilər test üçün dəyişmir. Supabase/Vercel silinmir, ödənişlər aktivləşmir.
