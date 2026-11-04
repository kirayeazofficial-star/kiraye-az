# kirayeal.az

Kirayə elanları saytı (Next.js 16, React 19, TypeScript). Hostinq.az cPanel-də işləyir. Verilənlər bazası: hostinqdəki PostgreSQL.

## Necə yenilənir

1. Kod `main` budağına göndərilir.
2. GitHub Actions saytı build edir və hazır faylları `site` budağına qoyur (təxminən 2 dəqiqə).
3. cPanel → Git Version Control → `site` budağı → **Update from Remote** → **Deploy HEAD Commit**. Deploy bazanın yeni sxem fayllarını (`host/postgres`) avtomatik tətbiq edir.
4. `https://kirayeal.az/api/health` yeni `buildId` göstərməlidir.

## Server ayarları (yalnız serverdə, `.env.production.local`)

`KIRAYE_DB_HOST`, `KIRAYE_DB_PORT`, `KIRAYE_DB_NAME`, `KIRAYE_DB_USER`, `KIRAYE_DB_PASSWORD`, `KIRAYE_SESSION_SECRET` (32+ simvol), `KIRAYE_STORAGE_ROOT` (şəkillər üçün qovluq), `KIRAYE_SMTP_HOST`, `KIRAYE_SMTP_PORT`, `KIRAYE_SMTP_USER`, `KIRAYE_SMTP_PASSWORD`. Bu dəyərləri heç vaxt GitHub-a yükləmə.

## Ehtiyat nüsxə (hər gecə Google Drive-a)

- Rəhbər panelində **Ehtiyat nüsxə → Google Drive-a qoş** (bir dəfə). Google OAuth client-də redirect URI: `https://kirayeal.az/api/admin/backup/drive/callback`, layihədə **Google Drive API** aktiv olmalıdır.
- cPanel → **Cron Jobs**, **hər 10 dəqiqədən bir** (`*/10 * * * *`). Skript özü yalnız gündə bir dəfə (Bakı vaxtı ilə 03:00-dan sonra), Drive yenicə qoşulanda və ya yarımçıq qalmış nüsxəni tamamlamaq üçün işləyir:
  `/bin/bash -lc 'source /home/kiraytfg/nodevenv/kirayeal/22/bin/activate && cd /home/kiraytfg/kirayeal && node backup-to-drive.mjs'`
- Drive-da: `kirayeal.az ehtiyat nüsxə/kirayeal-baza.json.gz` (bütün baza, hər gecə yenilənir; köhnə versiyalar Drive-da 30 gün) və `Şəkillər və videolar/` (yalnız yeni fayllar əlavə olunur).
- Bərpa (yeni hostinqdə, sayt bir dəfə deploy olunandan sonra, app qovluğunda):
  `node restore-backup.mjs kirayeal-baza.json.gz "Şəkillər və videolar"`

## Lokal işə salmaq

```
npm ci
npm run dev
```

Build zamanı yalnız `NEXT_PUBLIC_SITE_URL` (məs. `https://kirayeal.az`) lazımdır.

## İnkişaf zamanı yoxlamalar

`npm run lint` tipləri, `npm run test:quality` ayarların xəta halında davranışını, təhlükəsiz giriş keçidlərini, nümunə elan limitini və şəkil/e-mail regresiyalarını yoxlayır.

`npm run test:ui` üçün yerli tətbiq işləməlidir (standart: `http://127.0.0.1:3000`). Başqa port üçün `KIRAYE_TEST_BASE_URL` təyin edin. Testlər 320–1440 px ekranları, seçilmişləri, dil dəyişməsini, kömək səhifəsini və e-mail şablonlarını yoxlayır; real məktub və mesaj göndərmir. Sistem Chromium-u yoxdursa əvvəl `npx playwright install chromium` işlədin. Alternativ Chromium yolu `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` ilə verilə bilər.

`npm run test:gallery` üçün yerli bazada üç şəkilli sınaq elanının yolunu `KIRAYE_TEST_LISTING_PATH=/listings/<id>` ilə verin. Bu sınaq həqiqi toxunuşla sürüşməni, barmaq qalxmamış hərəkəti, tam ekran keçidini, ləğv edilmiş jesti, şəkil sərhədini, klaviaturanı, böyütməni, gec yüklənən şəkli və native dialog/decode API-si olmadıqda ehtiyat davranışı yoxlayır. Statistik baxış sorğusu sınaqda əvəz olunur; elan və mesaj yaradılmır.

`npm run test:messages` yazışma məlumatlarını təcrid olunmuş cavablarla əvəz edir: uzun ad/mətn, 320–1440 px düzülüş, mətn sahəsinin avtomatik böyüməsi və gecikən cavabların düzgün yazışmada qalması yoxlanılır. Real mesaj göndərilmir.

`npm run test:auth` Google düyməsi açıq halda giriş formasını, səhv şifrə/kodu, serverin `retry_at` gözləmə müddətini və şifrə bərpasının xəta/uğur fərqini yoxlayır. Cavablar təcrid olunur; real hesab dəyişdirilmir və məktub göndərilmir.

`npm run test:release` quraşdırıcını müvəqqəti qovluqlarda yoxlayır: yalnız bir əvvəlki yığımın saxlanması, uğursuz quraşdırmada geri dönüş, ayarların, orijinal şəkillərin və baza ehtiyat nüsxələrinin qorunması. Canlı hostinqə və Google Drive-a qoşulmur.

`npm run test:account` kabinet bölmələrini boş siyahı, rəhbər hesabı, bağlı/açıq ödəniş xidməti və mövcud ödəniş gözləyən elan üçün təcrid olunmuş cavablarla yoxlayır. Elan və ya ödəniş yaradılmır.

`npm run test:recovery` yalnız yerli `kiraye_dev` PostgreSQL bazasında işləyir. Bərpa, rəhbər səlahiyyəti, ödəniş gözləyən köhnə vəziyyət, təkrar göndərmə və audit xətasında geri qaytarılma real sorğularla yoxlanılır; bütün sınaq məlumatları sonda `ROLLBACK` edilir.

`npm run test:audit` qaralamanın yerləşməsini, təhlükəsiz Google hesabı axınını, tərcümə zamanı sabit şəhər dəyərini, e-poçt mövzusunu və mobil plus/düymə ölçülərini təcrid edilmiş cavablarla yoxlayır.

`npm run test:responsive` 320–767 px ekranlarda üç dildə plus dairəsi ilə yazının arasını, mesaj sayğacını, toxunma sahələrini və ekranın aşağı təhlükəsiz boşluğunu yoxlayır. `npm run test:history` rəhbər panelində son fəaliyyətlərin və tarixçə səhifələrinin dörd qeydlə məhdud qalmasını, geri/irəli keçidi və xəta zamanı yenidən cəhdi yoxlayır. Bu yoxlamalar yerli tətbiq və təcrid edilmiş cavablarla işləyir.
