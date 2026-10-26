# Təhlükəsiz dayanma və davam qeydi — 26 oktyabr 2026

İstifadəçi son kodu, AGENTS.md və davam qeydlərini main qolunda saxlamağı, sonra dayanmağı tapşırıb. Bu qeydin vəziyyət məlumatı köhnə hesabatları əvəz edir. Tam yerli operator qeydləri qorunur; ictimai sənədə girişlər, hesab ünvanları, server ünvanları və daxili yollar daxil edilməyib.

## Canlı versiya ilə main fərqi

- Son oxuma yoxlamasında canlı mənbə commit-i 30667110d3ab932784f56a1ff1baf9de40708c91, build QNmrh09tfW8tkX3waKeW4 olaraq qaldı. Deploy/build prosesi görünmədi.
- Son mənbə deb40e33b90c13e50e9846cc809b2d45cc665166 planşet başlığı və kabinet üçün CSS düzəlişidir. Hələ canlıda deyil və qəbul sınağı keçməyib.
- Bu main göndərişi yeni canlı deploy deyil. GitHub-da son CSS və sənədlər, canlıda əvvəlki kod qalır.
- Main-də ayrıca əlavə edilmiş .cpanel.yml qorunur. Ümumi fayl köçürmə tapşırığını hazırkı Node tətbiqinin atomik deploy üsulu hesab etmə. Tətbiq kökünü və CloudLinux node_modules/nodevenv quruluşunu dəyişmə.
- Növbəti sessiyada əvvəl yarımçıq release cəhdini, canlı commit/build və prosesləri yoxla. Hazırlama və miqrasiya əmrlərini kor-koranə təkrarlama.

## Artıq tətbiq edilmiş iş

Profil kontakt limitləri miqrasiyası uğurla COMMIT edilib, 28 baza yoxlaması keçib; mövcud qeydlərin qorunması müqayisə edilib. İlk cəhd əvvəlki hesabatın BOM oxunuşuna görə rollback olmuş, düzəldilmiş ikinci cəhd uğurlu olmuşdu. Yenidən tətbiq etmə. Əvvəlki account-navigation, mesajlaşma və limit miqrasiyalarını da canlı sxemə baxmadan təkrar işlətmə.

Canlı kodda profil API/UI, telefon/e-poçt üçün ayrı 3 uğurlu dəyişiklik qaydası, təsdiqlənmiş e-poçt dəyişəndə sayılma, yeni elanda hesabın əsas telefonu, remember-storage, altı rəqəmli kod interfeysi və SVG ikonlar var. Bu, real istifadəçi yollarının tam yoxlanması demək deyil. Köhnə elan telefonları kütləvi dəyişməyib, telefon SMS-təsdiqli göstərilmir.

## Yoxlamanın sərhədi və növbəti iş

- Əvvəlki mobil versiyada 395 yoxlama/96 yüklənmiş səhifə-ölçü kombinasiyası və ayrıca 39 vəziyyət yoxlaması keçib.
- Son profil qəbul testi 329 yoxlama/97 kombinasiyadan sonra 768px kabinet daşmasında dayandı. Test qeydləri təmizləndi, real məlumatlar qorundu. Profil API və remember-session yoxlamalarına çatmadı. Planşet düzəlişi bu problemi hədəfləyir, lakin təkrar qəbul keçməyib.
- İlk davam işi: release cəhdinin nəticəsini yoxla; uyğun ehtiyat/build/deploy-dan sonra mövcud son profil testini tamamla.
- 320/360/375×667/390/430/768/1024/1440 ölçüləri; qonaq, adi hesab, elan sahibi, admin və Rəhbər yolları, uzun mətn, boş/yüklənmə/xəta vəziyyətləri yoxlanmalıdır. Real Safari və real iPhone klaviaturası yoxlanmayıb.
- Profil üçün ad, eyni telefonun sayılmaması, 3 uğurlu dəyişiklik/dördüncü rəddi, başqa hesabın məxfiliyi, əsas telefonun yeni elana tətbiqi, local/session storage seçimi və çıxış yoxlamaları tamamlanmalıdır. E-poçt təsdiqi real məktubla ayrıca yoxlanmalıdır.
- Mesajın düzgün elan sahibinə çatması, iki ayrı sessiyada cavab/oxunma/reload/re-login/blok/şikayət, özünə mesajın API/bazada rəddi tamamlanmalıdır. Başqa satıcının dialoqu Rəhbərin konkret çatdırılma şikayətinin həlli deyil.

## Maneələr və qalan istiqamətlər

1. Real Auth qeydiyyatı SMTP550 spam rəddi ilə bağlıdır. TLS/AUTH uğuru, adi Accepted test məktubu və DNS qeydləri Auth məktubunun çatması deyil. Auth loq API-si 403 verir. Provayder müraciətinin məxfi detalsız şablonu və tam yerli operator qeydləri qorunur. Əlavə diaqnostik məktub batch-i avtomatik review tərəfindən rədd edilib; başqa üsulla keçmə, spam qorumasını söndürmə. Recovery precheck503 düzəlib, real məktub/kod/yeni şifrə axını hələ tam yoxlanmayıb.
2. Google provider aktiv deyil. OAuth girişləri, consent/callback ayarı və real giriş sınağı lazımdır; girişləri söhbətdə istəmə.
3. DB/Auth/Storage/API/RPC və avtomatik müddət işi hələ Supabase-dədir. Köhnə Vercel yerləşdirməsi/callback izi qalır. Hostinqin PostgreSQL17/extension/rol və daimi Auth/API/Storage imkanları təsdiqlənməlidir. PostgreSQL13 alətlərini daha yeni mənbəyə tətbiq etmə. Tam müstəqil köçürmə/bərpa təsdiqlənməyib: Supabase/Vercel silinməsin.
4. Həqiqi baxışın proxy/owner/dedup sınağı, qalan admin/leader/owner yolları, limit/müddət/arxiv, watermark, SEO və MASTER-WORK-LIST-dəki digər açıq qəbul maddələri davam edir. Ödəniş, kart, balans artırma, reklam və pullu bərpa bağlıdır.
5. Drive əlaqəsi/offline OAuth, işçi girişləri və bildiriş triggerləri qurulmayıb. Drive upload və kompüterdən asılı olmayan gündəlik şifrəli ehtiyat HAZIR DEYİL. Domen registrar idarəsinin sahibdə olması ayrıca təsdiqlənməyib.

## Qorunan ehtiyatlar

Son tam yerli snapshot 26 oktyabr 2026, 13:23 UTC tarixlidir; PostgreSQL17 dump və bütün 15 şəkil qorunur. Bu, profil miqrasiyasından əvvəlki nüsxədir. Ayrı clone bərpası və yeni SQL ilə 28 test keçib. Əvvəlki nüsxənin ayrıca bərpası və 38 davranış testi də keçib. Yeni miqrasiyadan SONRA tam snapshot, şəkillər, profil sayğacları və ayrıca restore hələ alınmalıdır.

Tətbiqin əvvəlki rollback arxivi və masaüstündəki əvvəl yoxlanmış şifrəli portativ ZIP qorunur. Bunlar yeni son vəziyyətin Drive ehtiyatı kimi təqdim edilməsin. Dəqiq yer/fayl adları istifadəçinin qorunan yerli davam qeydlərindədir. DPAPI girişləri başqa kompüterdə təkbaşına işləmir. Yeni portativ payload hazırlandıqdan sonra şifrə yalnız maskalı yerli pəncərədə alınmalı, yeni arxiv ayrıca bərpa edilməlidir. Parolu arxivə, söhbətə və Git-ə yazma.

## Davam qaydası

AGENTS.md, MASTER-WORK-LIST.md və bu sənədi oxu. Tam yerli qeydlər əlavə texniki təfərrüatı saxlayır. Yeni əməliyyatdan əvvəl canlı vəziyyəti yoxla, edilən SQL-i təkrarlama. Main göndərişi yoxlandıqdan sonra istifadəçinin göstərişinə uyğun dayan.
