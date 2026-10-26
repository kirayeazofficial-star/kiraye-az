# Kompüterdən asılı olmayan ehtiyat — quruluş və aktivləşdirmə

## Cari aktivlik

Bu sənədin ilkin əlavə edildiyi anda kod hazırlanıb və yerli sınaqlar keçib. Google Drive bağlantısı/offline OAuth, production bərpa açarı, GitHub məxfi ayarları və Google Apps Script trigger-ləri hələ qurulmayıb. **Gündəlik ehtiyat aktiv deyil, Drive-da uğurlu nüsxə sübutu yoxdur.** Yalnız workflow faylının mövcudluğunu işlək xidmət sayma.

## İşləmə yolu

1. Sahibin Google hesabındakı şəxsi Apps Script layihəsi Bakı vaxtı təxminən 03:17-də GitHub workflow-nu başladır. İşçinin özü GitHub-un bulud Ubuntu24.04 mühitindədir; istifadəçinin kompüteri və hostinq cron-u tələb olunmur.
2. İstənilən həqiqətən uğurlu cPanel deploy-dan sonra health/build təsdiqlənəndə eyni workflow gözlənilən commit ilə çağırılır. `KIRAYE_REQUIRE_CLOUD_BACKUP=1` və məhdud Actions dispatch tokeni qurulmayınca bu çağırış aktiv deyil. “Növbəyə alındı” tamamlanmış ehtiyat demək deyil.
3. İşçi PostgreSQL major versiyasını yoxlayır; PostgreSQL17 ilə TLS verify-full/exported snapshot üzrə bütün DB-ni, Auth/rolları/siyasətləri götürür. Bütün Storage obyektlərini, o cümlədən gizli/arxiv faylları, və əlaqə manifestini götürür. Objekti itibsə və ya backup zamanı inventar dəyişibsə uğur göstərmir.
4. Server ayarları ayrıca, yalnız oxuyan məhdud SSH açarı ilə alınır. Əsas SSH şəxsi açarı kopyalanmır. Faktiki yerləşdirilmiş mənbə commit-i GitHub-dan arxivləşdirilir; uyğun olmayan/göndərilməmiş commit uğur sayılmır.
5. DB/şəkillər/server və Auth ayarları age X25519 açıq açarı ilə şifrələnir. Bərpa parolu və şəxsi açar GitHub-a göndərilmir. Diskdəki xam iş faylları yalnız qapalı müvəqqəti işçi qovluğundadır, sonda silinir; log və Actions artifact kimi paylaşılmır.
6. Drive hesabının məhz `kirayeal.az@gmail.com` olduğu, qovluğun sahibə aid və ictimai olmadığı yoxlanır. Şifrəli fayl yüklənir, ölçü və SHA-256 (olmasa geri endirilmiş hash) tutuşdurulur. Yalnız bundan sonra nüsxə `verified` işarələnir.
7. Son 30 fərqli UTC gün və son 10 ən yeni nüsxə qorunur. Yalnız eyni tətbiqin yaratdığı, eyni qovluqdakı yoxlanmış backup faylları artıqdırsa Trash-a keçirilir; daimi silinmə yoxdur. Başqa fayl, bərpa açarı və yarımçıq upload-a toxunulmur.
8. Google layihəsində saatlıq nəzarət son uğursuz GitHub işini və Drive-da 30 saatdan köhnə ehtiyatı yoxlayır, yalnız sahibə e-poçt bildirir. Nəzarətin öz icazəsi pozulsa da bunu uğur saymır. Bildirişin real məktub çatdırılması ayrıca sınaqdan keçməlidir.

GitHub-un ictimai repolarda `schedule` işi 60 gün fəaliyyət olmayanda dayana bilər. Bu quruluşda gündəlik saat Google Apps Script-dədir, workflow-da GitHub schedule yoxdur. [GitHub qaydası](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule). Standart public-repo bulud işçiləri hazırda pulsuzdur; ödənişli runner/xidmət alınmır. [İstifadə qaydası](https://docs.github.com/en/actions/concepts/billing-and-usage).

## Tələb olunan girişlər

- **Google:** sahibin hesabı ilə Drive upload üçün öz OAuth client-i və offline `drive.file` icazəsi. Normal interaktiv Drive bağlantısı CI üçün offline tokeni avtomatik vermir. OAuth layihəsi Testing vəziyyətindədirsə refresh tokenin qısamüddətli olmasını yoxla; davamlı ehtiyatı bir neçə günlük test tokeninə bağlama. OAuth secret/refresh token yalnız buludun məxfi ayarına daxil edilir, repo mənbəyinə yox.
- **Bərpa açarı:** sahibi yerli gizli pəncərə və ya `create-recovery-key.py` ilə yaradır. `*.key.age` şəxsi açarı parolla şifrələnir, round-trip sınağı keçir. Şifrəli açar ayrıca Drive-da və sahibin ikinci təhlükəsiz yerində saxlanır; parol həmin yerlərdə/arxivdə/GitHub-da saxlanmır. CI-yə yalnız `age1...` açıq recipient verilir.
- **GitHub:** repo kodunu yazmaq səlahiyyəti işləyir. Hazır connector məxfi Actions ayarlarını yaratmaq və workflow dispatch etmək imkanını vermir. Sahib repo ilə məhdud ayarlar/Secrets və Actions idarəsi üçün ayrıca giriş verə və ya gizli ayarları özü daxil edə bilər. Tam hesab səlahiyyəti istəmə.
- **Məxfi config:** `config.example.json` yalnız nümunədir. Doldurulmuş JSON `KIRAYE_BACKUP_CONFIG` Actions secret-ində saxlanır. DB parolu, Google offline tokeni və yeni məhdud backup SSH açarı məxfidir. **Arxiv parolu və şəxsi bərpa açarı bu JSON-a daxil edilmir**; runner bunu rədd edir.
- **Supabase:** yalnız bu layihədə Auth Config Read, API Keys Read, API Key Secrets Read hüquqlu avtomatik read token. Qısa müddətli mövcud operator tokeninin bitmə tarixini nəzərə al; uzunmüddətli işə ayrıca minimum səlahiyyətli token və yenilənmə qaydası lazımdır. DB parolu dəyişəndə secret də yenilənir.
- **Server:** `server-export.py` qapalı backup qovluğuna yerləşdirilir. Yeni ayrıca açarın authorized_keys sətri `restrict,command="/usr/bin/python3 /home/kiraytfg/.kirayeal-backups/server-export.py"` ilə yalnız oxuyan arxiv əmri işlədə bilər. Shell/port/agent/PTY açmır. Host key əvvəlcədən yoxlanıb `known_hosts`-a sabitlənir. Başqa açarlar silinmir. Bu quruluş ayrıca giriş olmadan quraşdırılmış sayılmır.
- **Google Apps Script:** sahibin şəxsi layihəsinə `watchdog.gs` və `appsscript.json` əlavə edilir. Script Properties-də yalnız bu repo üçün Actions Read/Write tokeni və Drive qovluğunun ID-si saxlanır. Script mənbəyində token yazılmır. Public web app yaradılmır. Mail/Drive Read/trigger icazələrini sahib verir.
- **Domen:** registrar panelinə sahibin çıxışı, yenilənmə tarixi, əlaqə və NS dəyişmə imkanı ayrıca təsdiq edilir. Bunlar backup kodu ilə avtomatik sübut edilmir.

## Aktivləşdirmə və qəbul

Girişləri bir-bir tamamla. Əvvəl sahibi və şəxsi Drive qovluğunu yoxla, mövcud AES şifrəli əl nüsxəsini yükləyib hash/link/tarix saxla. Sonra age bərpa açarı və offline işçi config-i hazırla. Workflow main qolunda olmalıdır; `KIRAYE_BACKUP_ENABLED=true` repo variable yalnız bütün məxfi girişlər hazır olanda qoyulur.

Əl ilə workflow çağır, **backup job skipped olmadan** işin keçdiyini, Drive fayl ID/link/ölçü/hash-i yoxla. Şifrəli şəxsi açarı da ayrı fayl kimi qoruyub sahibin parolu ilə yeni formatdan ayrıca restore sınağı et. `restore-check.py` bu məqsəd üçündür; public-key-only CI hər nüsxənin bərpasını keçmiş kimi göstərə bilməz.

`testBackupAlert` ilə sahibə test məktubu göndər, faktiki çatmasını təsdiqlət. Yalnız sınaq işinin qəsdən verilmiş səhvi ilə uğursuzluq bildirişini və stale-copy siqnalını yoxla; real məlumatları dəyişmə. `installBackupTriggers` sonra daily və hourly trigger-lərin həqiqətən yarandığını yoxla. Gündəlik vaxtın dəqiq dəqiqəyə zəmanət olmadığını nəzərə al.

Deploy serverinə ayrıca Actions-only dispatch tokenini gizli qur, `KIRAYE_REQUIRE_CLOUD_BACKUP=1` ver, uğurlu real yerləşdirmədən sonra yaradılan yeni Drive nüsxəsini göstər. Bunun canlı sınağı edilmədən deploy sonrası ehtiyatı hazır sayma.

Əməliyyat hesabatında mütləq saxla: Drive folder/file URL və ID, son uğurlu UTC/Bakı vaxtı, bytes/SHA-256, worker run URL/nəticə, daily/hourly trigger nəticəsi, bildirişin real çatması, ayrıca bərpa sınağının əhatəsi və qalan boşluqlar. Heç bir xidmətin fasiləsizliyinə və parolsuz bərpaya zəmanət vermə.
