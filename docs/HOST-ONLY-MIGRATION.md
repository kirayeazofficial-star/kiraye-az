# Hostinq.az-a tam müstəqil keçid

Bu iş Supabase/Vercel-i dərhal söndürmür. Əvvəl yeni MariaDB/Auth/Storage sistemi
ayrıca qurulur, məlumatlar köçürülür və real qəbul sınaqları keçirilir.

## Təsdiqlənmiş host imkanları — 27 oktyabr 2026

- Node.js 22 tətbiqi işləyir.
- MariaDB 10.11 client mövcuddur və cPanel database xidməti hədəfdir.
- PostgreSQL yalnız 13.23 client-dir; `postgres`, `initdb`, `pg_isready` yoxdur.
- Docker yoxdur. Buna görə Supabase konteynerlərini bu shared hostinqdə qaldırmaq olmur.
- Canlı `.env` hazırda Supabase public URL/key və server service-role açarından istifadə edir.

## Təhlükəsiz keçid sırası

1. cPanel-də ayrıca boş MariaDB bazası və yalnız həmin bazaya səlahiyyətli istifadəçi yarat.
2. Server-only `KIRAYE_DB_*`, `KIRAYE_SESSION_SECRET` və `KIRAYE_STORAGE_ROOT`
   dəyərlərini canlı `.env.production.local` faylına daxil et. Heç birini GitHub-a yazma.
3. `scripts/host/check-readiness.mjs` ilə bağlantı və yazı qovluğunu yoxla.
4. `host/mariadb/001-core.sql` sxemini yalnız boş yeni bazaya tətbiq et.
5. Auth/API/Storage adapterini əvvəl paralel rejimdə işə sal; real trafik hələ Supabase-də qalsın.
6. Supabase-dən istifadəçi, profil, elan, şəkil, audit və mesajları dəyişməz ID-lərlə
   köçür; saylar, əlaqələr və SHA-256 şəkil manifestini müqayisə et.
7. İki ayrı test hesabı ilə qeydiyyat, 6 rəqəmli kod, giriş/çıxış, Google,
   şifrə bərpası, elan, şəkil, moderasiya və mesajlaşmanı yoxla.
8. Şifrəli tam ehtiyat və başqa mühitdə bərpa sınağından sonra domeni yeni backendə keçir.
9. Köhnə asılılıq qalmadığı sübut ediləndən sonra həmin sayta aid Supabase layihəsi və
   Vercel deployment-ları ləğv edilə bilər. Hesabların özü və başqa layihələr silinmir.

Ödəniş sistemi bütün mərhələlərdə bağlı qalır.
