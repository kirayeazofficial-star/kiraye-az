# Google girişi və öz serverində kirayeal.az

Kod Google OAuth girişini, normal e-poçt girişini, elan qəbulu, kabinet və admin yoxlamasını dəstəkləyir. Google girişi e-poçtla kod göndərmə limitindən asılı deyil. Google OAuth xidmətinin özü ayrıca aktivləşdirilməlidir. Kod provider bağlı olanda saxta uğurlu giriş göstərmir.

## 1. Google ilə giriş: bir dəfə edilən ayarlar

1. Google Cloud Console → APIs & Services → OAuth consent screen. Tətbiqin adını, dəstək e-poçtunu və lazımi domenlərini daxil et. Xarici istifadəçilər üçün tətbiqi Production vəziyyətinə gətir; Testing vəziyyətində yalnız əlavə etdiyin test istifadəçiləri girə bilər. İstənilən əlavə Google təsdiqini konsoldakı göstərişlərə əsasən tamamla.
2. Credentials → Create credentials → OAuth client ID → Web application.
3. Authorized JavaScript origins: `https://kirayeal.az`.
4. Authorized redirect URI **Supabase ünvanıdır**:

   ```text
   https://YENI-LAYIHE-REF.supabase.co/auth/v1/callback
   ```

   `YENI-LAYIHE-REF` yeni Supabase layihəsinin referansıdır. Əvvəlki layihə silinib, onun ünvanı artıq işləmir.

5. Supabase → Authentication → Sign In / Providers → Google. Client ID və Client Secret-i oradakı uyğun sahələrə daxil et və Google provider-i aktivləşdir. Secret-i çatda, GitHub-da və `NEXT_PUBLIC_*` dəyişənlərində saxlama.
6. Supabase → Authentication → URL Configuration. Site URL-i `https://kirayeal.az` et. Redirect URLs-ə bunları əlavə et:

   ```text
   https://kirayeal.az/auth/callback**
   https://kirayeal.az/reset-password
   ```

   Sondakı `**` kabinetə və ya yarımçıq elan səhifəsinə qayıdış üçün callback query parametrlərinə icazə verir. Sayt qayıdış ünvanını özü məhdudlaşdırır; xarici sayta yönləndirmə qəbul edilmir. Şifrə yeniləməsi üçün `/reset-password` ünvanı mütləq saxlanmalıdır. Əvvəlki `/profile` ünvanını da saxlamaq olar.
7. Giriş səhifəsini yenilə və “Google ilə davam et” seç. Google-da istifadə olunan e-poçt admin hesabına uyğun gəlməlidir. Admin icazəsi ayrıca `supabase/assign-owner-admin.sql` ilə verilir; Google ilə giriş avtomatik admin etmir.

Google Cloud və Supabase idarəçi hesabları buradan əlçatan olmadığına görə Client ID/Secret yaratmaq və provider-i aktivləşdirmək layihə sahibinin hesabında edilməlidir. Öz Gmail şifrən və ya istifadəçinin Google şifrəsi sayta daxil edilmir.

## 2. Sonradan server və domen qoşmaq

**Uyğun server:** Node.js 22 işlədən Linux VPS/server və ya Docker dəstəyi. Adi yalnız PHP/static cPanel paketinə faylları atmaq kifayət etmir. Node.js dəstəyi olan cPanel-də `npm ci`, `npm run build`, `npm run start` ilə, hostinqin proses meneceri və HTTPS yönləndirməsi altında işlətmək olar. Bu paket Docker və Caddy vasitəsilə VPS üçün hazır nümunə verir.

Verilənlər bazası, giriş və şəkillər Supabase-dədir. Vercel artıq istifadə olunmur. Köhnə Supabase layihəsi silindiyi üçün yeni layihə yaradılıb ehtiyatdan bərpa edilməli, sonra yeni URL/açar `.env`-ə yazılmalıdır. Tam öz serverində Supabase-in də yerləşdirilməsi bu paketə daxil deyil.

VPS-də Docker Engine və Compose plugin quraşdırıldıqdan sonra repozitoriya qovluğunda:

```bash
cp .env.example .env.production
```

`.env.production`-u öz dəyərlərinlə doldur:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YENI-LAYIHE-REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=SUPABASE_PUBLISHABLE_KEY_BURAYA
NEXT_PUBLIC_SITE_URL=https://kirayeal.az
SITE_HOST=kirayeal.az
```

Yalnız browser üçün nəzərdə tutulmuş publishable/anon açar istifadə et. Google Client Secret və Supabase service-role açarı bu faylda lazım deyil. Domenin DNS A qeydini serverin IPv4 ünvanına yönəlt. IPv6 işləmirsə, köhnə AAAA qeydi qoyma. Serverdə 80 və 443 portları açıq olmalıdır.

```bash
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs --tail=80 web proxy
```

Caddy domen DNS-i serverə çatanda HTTPS sertifikatını avtomatik alır və yeniləyir. Yalnız `SITE_HOST` domeni qurulur; `www.kirayeal.az` də istifadə ediləcəksə ayrıca DNS və Caddy host ayarı əlavə et. Supabase Site URL/Redirect URLs və Google origin ayarlarını da yeni domen üçün yenilə.

`NEXT_PUBLIC_*` dəyərləri build zamanı JavaScript-ə yazılır. Domen/URL/açar dəyişəndə mütləq yenidən `up -d --build` et; təkcə konteyneri yenidən başlatmaq kifayət deyil. Docker obrazı `.env.*` fayllarını kopyalamır, yalnız verilən public build arqumentlərini istifadə edir. Caddy sertifikatları volume-da qalır; onları gündəlik yeniləmədə silmə.

## 3. Yoxlama

- `https://kirayeal.az/api/health`: `{ "status": "ok" }` yalnız sayt prosesinin işlədiyini yoxlayır, Google/Supabase bağlantısını təsdiq etmir.
- Google girişi → kabinet → şəkilli elan → admin təsdiqi → giriş etməmiş brauzerdə elanı aç.
- E-poçt təsdiqi və şifrə yeniləməsi yeni domenə qayıtmalıdır.
- `robots.txt`, `sitemap.xml` və elanların canonical ünvanları yeni domeni göstərməlidir.
- Google “redirect_uri_mismatch” göstərirsə, Google console-dakı redirect URI yuxarıdakı Supabase `/auth/v1/callback` ünvanı ilə eyni olmalıdır.
- E-poçtla məktub göndərmək üçün SMTP, SMS üçün SMS provayderi ayrıca konfiqurasiya olunur. Google girişi bu xidmətləri avtomatik aktivləşdirmir.

Yeniləmə zamanı əvvəl işlək image/tag-i saxla, yeni build-in sağlamlığını yoxla. Bu mərhələdə real serverə yerləşdirmə və DNS dəyişiklikləri edilməyib; server hesabı və DNS idarəçisi verildikdə həmin hədəfdə ayrıca tətbiq edilir.
