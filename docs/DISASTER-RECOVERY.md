# Kirayeal — başqa kompüter və başqa hostinqdə bərpa

Bu təlimat kodun və bərpa vasitələrinin təsviridir. Drive-a yükləmə və avtomatik işin aktivliyi ayrıca əməliyyat hesabatında faktiki tarix/linklə təsdiqlənməlidir. Masaüstü faylını offsite ehtiyat saymayın.

## Sahibdə ayrıca qalmalı məlumatlar

- GitHub və `kirayeal.az@gmail.com` Google hesabına giriş və bərpa imkanı.
- Drive-da tarixli şifrəli ehtiyat, onun SHA-256 cəmi və yeni age formatı üçün parolla qorunan `*.key.age` bərpa açarı. Bu açarın parolu nə GitHub-a, nə Drive-a, nə arxivə yazılır. Onu sahib ayrıca təhlükəsiz yerdə saxlayır.
- Domen qeydiyyat hesabı, yenilənmə tarixi və nameserver/DNS dəyişmək imkanı. Hostinq/cPanel girişi registrar hesabını əvəz etmir. DNS indi hostinqə baxırsa bu, qeydiyyat sahibini sübut etmir.
- Yeni hostinq/Supabase, SMTP və Google OAuth idarəetmə girişləri. Köhnə SSH şəxsi açarı avtomatik ehtiyata daxil edilmir; yeni hostinq üçün ayrıca giriş yaradılır.

## 1. Ehtiyatı əldə et və yoxla

Google Drive-ı sahibin hesabından aç, son **yoxlanmış uğurlu** nüsxəni endir. Tarixi və ölçü/SHA-256 cəmini uğurlu backup nəticəsi ilə müqayisə et. Yalnız ən yeni fayl adına baxma; upload yarımçıq ola bilər.

İki format dəstəklənir:

- İlkin əl ilə yaradılmış `.zip`: AES-256, sahibin arxiv parolu ilə açılır. 7-Zip kimi AES ZIP dəstəkləyən proqram istifadə et; Windows-un adi ZIP açacağı uyğun olmaya bilər.
- Avtomatik `.tar.gz.age`: açıq recipient açarı ilə şifrələnir. Onu açmaq üçün sahibin parolla qorunan `*.key.age` şəxsi bərpa açarı və ayrıca parolu lazımdır. GitHub/bulud işçisi bu şəxsi açarı və parolu saxlamır.

Kodu mövcud GitHub reposundan götür. `scripts/backup/requirements.txt` asılılıqlarını ayrıca Python mühitinə quraşdır. Node tətbiqindəki paketlərə qarışdırma.

## 2. Canlıya toxunmadan ayrıca bərpa sınağı

PostgreSQL **17** alətləri lazımdır. 13.x `pg_restore` ilə yeni bazanı bərpa etmə. `initdb`, `pg_ctl`, `psql`, `pg_restore` və standart extension-lar olan tam PostgreSQL17 quruluşunu istifadə et. Linux-da bu sınağı root olmayan ayrıca istifadəçi ilə işə sal.

```text
python -m pip install -r scripts/backup/requirements.txt
python scripts/backup/restore-check.py --archive EHTIYAT.zip --pg-bin POSTGRESQL17_BIN_QOVLUGU
```

Yeni avtomatik format üçün:

```text
python scripts/backup/restore-check.py --archive EHTIYAT.tar.gz.age --identity-key BERPA_ACARI.key.age --pg-bin POSTGRESQL17_BIN_QOVLUGU
```

Parol əmrin arqumentinə yazılmır; proqram gizli soruşur. Alət yalnız yeni müvəqqəti, `127.0.0.1`-ə bağlı cluster yaradır. Uzaq/canlı baza ünvanı qəbul etmir. Rolları həmin sınaq mühitinə uyğunlaşdırır, istifadəçi/profil/elan/şikayət/storage saylarını, hesab/elan sahiblik əlaqələrini, bütün şəkillərin hash-lərini və elan–şəkil əlaqələrini yoxlayır; sonda clusteri dayandırıb müvəqqəti məlumatları təmizləyir.

Windows-da olmayan Supabase Vault və pg_cron hissələri bu sınaqda istisna edilir. Bu məhdudiyyət nəticədə açıq göstərilir. Belə sınaq tam Auth/API/Storage platformasının başqa provayderdə işləməsi demək deyil. Yeni hostda bu xidmətlərin real giriş/upload/RPC sınaqları ayrıca lazımdır.

## 3. Yeni hostinqdə işlək sistemi bərpa et

Əvvəl yeni hostinqin Node22, disk/yaddaş/proses, PostgreSQL17 və lazım olan rollar/extension/cron, poçt və SSL imkanlarını təsdiqlə. Supabase yalnız SQL cədvəlləri deyil: Auth/GoTrue, Storage, PostgREST/RPC, RLS və uyğun service/JWT ayarları da lazımdır. PostgreSQL skriptlərini MariaDB-yə tətbiq etmə. Ödənişli yeni xidmət almaq ayrıca sahib qərarıdır.

İndiki hostinq bağlansa, xarici Supabase işləyirsə Node tətbiqini yeni hostinqdə həmin mövcud Supabase-ə bağlamaq ən qısa bərpa yoludur. Bu, tam host-only köçürmə deyil. Supabase də əlçatmazdırsa uyğun ayrıca platforma qurulub ehtiyatdan bərpa edilməlidir; yeni host məlumatı olmadan bu hissə yoxlanmış sayılmır.

Arxivdə:

- `source-code.tar.gz`: faktiki yerləşdirilmiş commit-in kodu; `BACKUP-MANIFEST.json` yerləşdirilmiş və ehtiyat işçisinin commit-lərini ayrı göstərir.
- `server-source-and-settings.tar.gz`: tətbiqin mənbə/özəl env ayarları, `.htaccess`, Node aktivləşdirmə məlumatı və crontab. Bu faylları GitHub-a çıxarma. Yeni serverə köhnə yolları kor-koranə köçürmə.
- `database.dump`, `roles.sql`, `archive-contents.txt`, `record-counts.json`: tam SQL/Auth məlumatları və sınaq üçün inventar. PostgreSQL rol parolları ixrac edilmir; fərdi istifadəçi Auth parol hash-ləri dump-da qorunur, açıq parol deyil.
- `storage-inventory.json`, `storage-files-manifest.json`, `storage-files/`: bütün aktiv/arxiv/private şəkillərin orijinal bucket/yol/ID və SHA-256 əlaqələri.
- `auth-config.json`: yeni avtomatik formatda Auth/SMTP/OAuth ayarları yalnız şifrəli payload içindədir. Bəzi provayderlər secret-in özünü deyil, maska/HMAC qaytarır; belə dəyərləri işlək parol sayma. Bərpada məxfi açarlar sahibi tərəfindən yenidən qurulub yoxlanmalıdır. İlkin əl ilə ZIP-də Auth ayarları redaktəli, məxfi sahələrsizdir.

Tam dump-u mövcud dolu canlı bazanın üzərinə yazma. Əvvəl ayrıca boş uyğun bazada bərpa et, rollar/grant/extension uyğunluğunu yoxla. İstifadəçi UUID-lərini, profil/rolları, elan sahibini, arxivləri, şikayət və tarixçəni qoru. İstifadəçi parollarını açıq mətnə çevirmə və hesabları yenidən yaratma. Sonradan əlavə edilən mesaj cədvəlləri də tam dump ilə qorunmalıdır.

Şəkillərin saxlanmış hash adları orijinal fayl yolu deyil: `storage-files-manifest.json`-dakı bucket/name xəritəsi ilə qaytar. Yeni Supabase layihəsinin host adı dəyişirsə, elanlardakı köhnə image URL-lərini yalnız **sübut olunmuş köhnə Storage hostundan** yeni hosta nəzarətli köçürmə ilə uyğunlaşdır; bucket/yol/owner UUID-ni saxla. Xarici elan URL-lərini təsadüfi sətir əvəzləməsi ilə dəyişmə. `kirayeal.az/listings/UUID` ünvanları qalmalıdır.

Node22, lockfile və production env ilə tətbiqi qur. Mövcud CloudLinux üçün işlək build: Webpack, `KIRAYE_BUILD_WORKERS=1`, `UV_THREADPOOL_SIZE=1`, `NODE_OPTIONS=--v8-pool-size=1`. Yeni serverin proses idarəsini onun imkanına uyğun qur; köhnə nodevenv yolunu başqa serverdə mövcud sayma. Məxfi service key `NEXT_PUBLIC_` dəyişəninə qoyulmur.

## 4. DNS keçidindən əvvəl real qəbul

İki idarə olunan test hesabı ilə qeydiyyat/təsdiq/giriş/çıxış/bərpa/yeni şifrə, sahiblik və Rəhbər/Admin yoxlaması, şəkilli elan/moderasiya/arxiv, anonim görünüş, real şəkil/URL, SMTP və aktivdirsə Google OAuth və mesajlaşma sınaqları keçməlidir. Köhnə sessiyalar yeni JWT açarında yenidən giriş tələb edə bilər; hesab/parol hash-lərinin itməsi ilə qarışdırma. Ödənişlər, kart, balans artırma, reklam və pullu bərpa bağlı qalır.

Sahibin registrar hesabından DNS/NS idarəsini təsdiqlə, A/AAAA/CNAME, MX, SPF/DKIM/DMARC, Google təsdiq TXT-lərini qoru. Yeni hostda HTTPS və www→əsas domen, canonical/robots/sitemap yoxlanandan sonra DNS keçidi et. SMTP göndərəni `noreply@kirayeal.az`, sahibin giriş Gmail-i isə ayrıca hesabdır.

Əvəzedici sistem bütün real yoxlamalardan keçmədən Supabase/Vercel-i silmə. Silinmə üçün nəticələri sahibə göstər və son konkret təsdiqini al. Geri dönüş üçün əvvəlki tarixli ehtiyatları və işlək xidməti saxla.
