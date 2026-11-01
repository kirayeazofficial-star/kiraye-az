# kirayeal.az — saytın kodunu bərpa etmək

Bu arxiv (`kirayeal-kod.tar.gz`) Google Drive-da, «kirayeal.az ehtiyat nüsxə» qovluğundadır.
Hər deploydan sonra (5 dəqiqə ərzində) yenilənir. Drive köhnə versiyaları 30 gün saxlayır
(faylın üstündə sağ klik → «Versiyaları idarə et»).

## GitHub hesabı itərsə — kodu yeni hesaba qaytarmaq
1. Drive-dan `kirayeal-kod.tar.gz` faylını yükləyin və açın (Windows-da 7-Zip ilə).
   İçində `kirayeal-kod` qovluğu var — saytın tam kodu (`KOD-VERSIYASI.txt` — versiya və tarix).
2. Yeni GitHub hesabında boş repozitoriya yaradın (məsələn `kiraye-az`).
3. Qovluğu ora yükləyin: GitHub səhifəsində «uploading an existing file» → bütün faylları sürükləyin
   → «Commit changes». (Və ya kompüterdə: `git init`, `git add .`, `git commit`, `git push`.)
4. Repozitoriyada Settings → Actions → General → «Read and write permissions» seçin.
   İlk push-dan sonra «Build release» işləyib `site` budağını yaradacaq.
5. cPanel → Git™ Version Control: köhnə repozitoriyanın ünvanını yeni GitHub ünvanı ilə əvəz edin,
   `site` budağını seçin → «Update from Remote» → «Deploy HEAD Commit».

Server ayarları (`.env.production.local`) arxivdə YOXDUR — onlar yalnız serverdə qalır.

## Baza və şəkillər
Baza (`kirayeal-baza.json.gz`) və «Şəkillər və videolar» qovluğu ilə bərpa: serverdə
`node restore-backup.mjs kirayeal-baza.json.gz "Şəkillər və videolar"` (ətraflı — `scripts/restore-backup.mjs`).
