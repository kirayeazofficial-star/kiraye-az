# Mövcud cPanel tətbiqini yenilə

Bu üsul xarici SSH işləməyəndə istifadəçinin cPanel terminalından icra üçündür. Avtomatik canlıya qoşulma deyil. Mənbə ZIP-i production build və ya yeni yerli baza deyil.

1. `kirayeal-update.zip` paketini kompüterə endir.
2. cPanel → File Manager → `/home/kiraytfg` altında **yeni** `kirayeal-update` qovluğu yarat. ZIP-i həmin qovluğa yüklə və Extract et. `scripts` və `DEPLOY-FILES.json` birbaşa bu qovluqda olmalıdır. `public_html` və işlək `kirayeal` qovluğuna çıxarma.
3. cPanel Terminal:

```bash
source /home/kiraytfg/nodevenv/kirayeal/22/bin/activate
cd /home/kiraytfg/kirayeal-update
node scripts/deploy-cpanel.mjs /home/kiraytfg/kirayeal
```

Skript:

- Mövcud Node.js asılılıqlarının eyni versiya tələblərində olduğunu yoxlayır; nodevenv/node_modules və tətbiq kökü dəyişmir. Asılılıq dəyişibsə avtomatik canlı npm install etmir.
- Mövcud `.env` ayarlarını və terminalın mühitini istifadə edir; dəyərləri ekrana yazmır. Düzgün ictimai baza konfiqurasiyası yoxdursa dayanır, işlək saytı nümunə rejimi ilə əvəz etmir. Belə xəta çıxsa parol deyil, yalnız xəta mətnini paylaş.
- `/home/kiraytfg/.kirayeal-backups` altında 0700 qovluğa 0600 arxiv yaradır. Tətbiq faylları və `.env` daxildir, xarici Supabase bazası və storage bu backup-a daxil deyil. Baza/provider ehtiyatını ayrıca saxlamadan məlumat köçürməsini başlatma.
- Ayrı update qovluğunda Webpack, `KIRAYE_BUILD_WORKERS=1`, `UV_THREADPOOL_SIZE=1`, `--v8-pool-size=1` ilə build edir. Build və modul yoxlaması keçmədən canlı faylları dəyişmir.
- Mövcud istifadəçi fayllarını silmədən mənbə fayllarını yeniləyir, köhnə build-i ayrıca saxlayır və `tmp/restart.txt` ilə Passenger restart istəyir. Fayl yerləşdirməsi xətasında arxivi geri açmağa çalışır.
- `/api/health` cavabındakı build ID-ni gözlənilən yeni ID ilə müqayisə edir. `HTTP release NOT verified` çıxsa uğur kimi təqdim etmə: cPanel Node.js → Restart, sonra domeni və sağlamlıq cavabını yoxla. 503 varsa tətbiq logunu oxu.

Son nəticəni paylaş. Məxfi `.env` məzmununu və şəxsi açarları paylaşma.

## Ayrıca gözləyən işlər

Bu skript SQL icra etmir. Rəhbər/Admin, limitlər, həftəlik qiymət, 30 günlük arxiv, audit və digər migrations `HOSTING-MIGRATION-CHECKLIST.md` sırası ilə icazəli baza bağlantısı vasitəsilə tamamlanmalıdır. SMTP, Google OAuth, Auth və şəkillər daxil host-only köçürmə ayrıca işdir. Mövcud Supabase/Vercel məlumatları/xidmətləri silinmir. Ödəniş, kart əlavə etmə və balans yükləmə bağlı qalır. Ana səhifə və health-in işləməsi bütün xidmətlərin hazır olduğu sübutu deyil.
