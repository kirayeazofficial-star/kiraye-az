# Davam — bulud sessiyası, 26 oktyabr 2026

Bu qeyd əvvəlki “main-ə göndər və dayan” göstərişini əvəz edir: istifadəçi yerli Codex-i dayandırıb, işi bu sessiyaya həvalə edib. Ödənişlər bağlı qalır. Əvvəlki bütün məhsul qərarları və açıq qəbul maddələri qüvvədədir.

## Mənbə

- Yerli Codex-in son main göndərişi: dd9f05c7ac3bcfe31b92034b93a44c07793abb98. Ayrıca migration qolundakı 3066711 dəyişiklikləri qorunub.
- FINAL-CONTINUATION-2026-10-26.md son operator hesabatıdır. Oradakı canlı versiya və SQL tətbiqi məlumatları hesabatdır; bu sessiya onları yenidən canlıda təsdiqləməyib.
- `profile-contact-limits.sql` təkrar tətbiq edilməsin: əvvəlki hesabatda uğurlu COMMIT və 28 yoxlama qeyd olunub.

## Bu sessiyanın dəyişiklikləri

- Əsas qalereyanın sticky mövqeyi ləğv olunur: bənzər elanların daxil olduğu gridin son sətrinə qədər sürüşərək onların üzərinə çıxmamalıdır.
- Əsas və şəxsi elan önbaxışında böyüdülmüş saytdaxili qalereya: touch swipe, klaviatura və düymə keçidləri, sayğac, Escape/bağlama, fokusun geri verilməsi.
- Admin şəkilləri xam storage URL-i açan keçid əvəzinə eyni saytdaxili qalereyadan istifadə edir. Bu, storage məlumatlarının köçürülməsi deyil; giriş icazələri dəyişmir.
- Kabinetdə “Mənim elanlarım” seçimi menyunu yığır və listings bölməsinə açıq keçid verir.
- Brauzer qəbul testi `tests/photo-viewer.cjs`: izolyasiya olunmuş HTTP fixture-ləridir, real bazanı dəyişmir. Nəticə aşağıda tamamlanmalıdır.

## Canlıya tətbiq maneəsi

Bu sessiyanın şəbəkəsindən birbaşa SSH bağlantısı `Connection refused`, saytın HTTPS sorğusu isə proxy CONNECT 403 qaytarıb. Autentifikasiyaya çatılmayıb. Bu nəticələr hostinqin ümumiyyətlə işləmədiyini göstərmir.

GitHub-a çıxış işləyir. `.cpanel.yml` yalnız mənbəni public_html-a köçürür; ayrıca Node tətbiqinin build/restart/health yoxlamasını etmir. Bunu sıfır müdaxiləli təsdiqlənmiş deploy saymaq olmaz. Mövcud .cpanel.yml istifadəçinin faylı kimi qorunur. Canlı işlək qovluq, nodevenv və ehtiyatlar dəyişdirilməyib.

## Hələ tamamlanmayanlar

- Real SMTP/Auth məktubu: əvvəlki operator hesabatında 550 spam rəddi; əlavə məktub göndərilməyib.
- Google OAuth və Drive offline OAuth girişləri bu sessiyada yoxdur.
- Tam host-only DB/Auth/Storage/RPC/cron miqrasiyası və provider imkanları təsdiqlənməyib; Supabase/Vercel silinməsin.
- Avtomatik Drive ehtiyatı hazır deyil. GitHub mənbə kodu tam məlumat ehtiyatı deyil.
- Profil/sessiya, mesajlaşma, baxış, limit/müddət/arxiv və MASTER-WORK-LIST-dəki qalan canlı qəbul sınaqları lazımdır.
- Sol aşağı daha oxunaqlı yeni su nişanı tələbi qüvvədədir; köhnə həkk olunmuş şəkillər orijinalsız yenidən nişanlanmasın.
- Real iPhone/Safari yoxlanılmayıb.

## 27 oktyabr: yeni yoxlamalar və tamamlanan mənbə dəyişiklikləri

### Peşəkar interfeys yenilənməsi

- Ana səhifənin əsas axtarışı bir sahəyə yığıldı; şəhər və müddət ətraflı filtrə keçirildi. Mobil kartlar iki sütunda, masaüstü kartlar dörd sütunda daha tez görünür. Seçilmiş ürəyinin ölçüsü və toxunma sahəsi sabitləşdirildi.
- Mesajlar ekranı istifadəçi, rəqəmli ID, aid elan, son mesaj, vaxt və oxunmamış sayı göstərən inbox quruluşuna keçirildi. Mobil yazı sahəsinin aşağı naviqasiya altında qalması aradan qaldırıldı. Öz elanına mesaj keçidi sahibə göstərilmir; serverdəki `chat_start` qadağası saxlanılır.
- Qalereyanın qırmızı köhnə bağlama görünüşü neytral ikonla əvəzləndi; touch swipe və klaviatura keçidi saxlanıldı.
- Boş reklam komponenti və ana səhifədə istifadə olunmayan köhnə sürətli baxış vəziyyəti mənbədən çıxarıldı. Məlumat migration-ları, bərpa vasitələri və hostinq faylları “artıq” sayılıb silinmədi.
- Production build və TypeScript keçdi. İzolyasiya edilmiş mesaj UI sınağı 320/390/1440, qalereya 320/375/768/1440, ana səhifə 320/390/768/1440 ölçülərində keçdi. Bunlar Chromium fixture sınaqlarıdır; real iPhone Safari və canlı iki-hesab mesaj qəbulu deyil.
- Köhnə şəkilə həkk edilmiş mərkəzi nişan orijinal olmadan silinmir və ikinci nişan vurulmur. Yeni `branded-v5` şəkillər sol aşağı qaydada qalır.

- Yeni şəkil yükləmələri `branded-v5` prefiksi ilə sol aşağıda daha böyük, 75% ağ nişan alır. Köhnə həkk olunmuş şəkillərə ikinci nişan vurulmur. Brauzerdə JPEG nəticəsinin ölçüsü, mərkəzi məzmunun qorunması və aşağı sol yazının oxunaqlığı yoxlanıb.
- Qalereya, klaviatura, touch swipe, fokusun geri qayıtması və admin şəkillərinin eyni səhifədə açılması 320/375/768/1440 ölçülərində fixture-lərlə keçib. Son əlavə sınaq kabinetdən pul tarixçəsi → Mənim elanlarım keçidini də yoxlayır.
- Kabinetdə “Mənim elanlarım” düyməsi seçiləndə bölmə state-i dərhal yenilənir, dar ekranda böyük menyu yığılır.
- Native dialog sınağında aşkar edilmiş fokus problemi düzəlib: bağlananda fokus açan düyməyə qaytarılır. Modal açıq ikən fon sürüşməsi bağlanır, əvvəlki vəziyyət bağlananda bərpa edilir.
- SSH yenidən eyni bağlantı rəddini verib. HTTPS proxy CONNECT 403; birbaşa HTTP sorğusunda DNS həll olunmayıb. Autentifikasiya və canlı tətbiq/DB yazısı olmayıb. Bu nəticə saytın istifadəçilərə işləmədiyinin sübutu deyil.

İşlək canlı çıxış alınanda: əvvəl cari release/proses/SQL statusunu oxu və ehtiyat al. Yeni mənbəni saxta fixture env ilə yox, mövcud real production konfiqurasiyası ilə ayrıca build/deploy et. Health build ID, real rol/profil/mesaj yolları və brauzer görünüşü təsdiqlənsin. Son operatorun tətbiq etdiyi SQL-i təkrarlama. `.cpanel.yml`-dəki sadə fayl kopiyasını Node deploy kimi təqdim etmə.

## Yekun yerli yoxlama nəticəsi — 27 oktyabr

- Son mənbə ilə production Webpack build, TypeScript və standalone hazırlığı uğurludur. Yığım yalnız lokal fixture public konfiqurasiyası ilə sınaq üçündür; bunu canlıya hazır konfiqurasiyalı binary kimi yükləmə.
- Son production standalone serverdə `tests/photo-viewer.cjs` 320/375/768/1440 enlərində keçdi: bütün səhifə boyu gallery/related bölmələrinin toqquşmaması, böyütmə, mobil swipe, klaviatura, sayğac, fokusun geri qayıtması, admin şəklinin sayt daxilində qalması, kabinet menyusunun yığılması və pul tarixçəsindən elanlara qayıdış.
- `tests/photo-watermark.cjs` keçdi; `tests/backup/deployment-trigger.test.mjs` 2 test keçdi. Ehtiyat trigger testi həqiqi Drive yükləməsini təsdiqləmir.
- Real iPhone/Safari, canlı Auth/SMTP/Google/mesaj/DB, Drive upload və real hostinq deploy yoxlanılmayıb. Baza məlumatlarına heç bir yazı edilməyib; xarici ehtiyatlar toxunulmayıb. Ödənişlər aktivləşdirilməyib.
- Adi və yüksəldilmiş şəbəkə kontekstində SSH read-only giriş cəhdi eyni Connection refused nəticəsini verib. Giriş yoxlanmadan dəyişikliklərin canlı tətbiqi iddia edilmir.
