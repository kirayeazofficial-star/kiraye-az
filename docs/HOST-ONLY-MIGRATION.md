# Hostinq.az-da sıfırdan müstəqil sistem

## 27 oktyabr 2026 qərarı

Sahib Supabase-dəki köhnə elan və istifadəçi məlumatlarının köçürülməsini ləğv edib.
Yeni cPanel PostgreSQL bazası boş başlanır. Supabase export/import alətləri layihədən
çıxarılıb. Supabase bağlantısı yalnız bütün DB/Auth/Storage çağırışlarının işlək host
əvəzi tamamlanana və qəbul sınaqları keçənə qədər canlı geriyə dönüş kimi saxlanılır;
sonra koddan və canlı mühitdən silinir.

Bu iş Supabase/Vercel-i dərhal söndürmür. Əvvəl yeni PostgreSQL/Auth/Storage sistemi
ayrıca qurulur və real qəbul sınaqları keçirilir.

## Təsdiqlənmiş host imkanları — 27 oktyabr 2026

- Node.js 22 tətbiqi işləyir.
- cPanel-in idarə etdiyi PostgreSQL bazası, istifadəçisi və PostgreSQL 13.23 client-i mövcuddur.
- Server prosesinin binarilərinin shell-də görünməməsi cPanel-in idarə etdiyi bazanın olmadığı demək deyil.
- Docker yoxdur. Buna görə Supabase konteynerlərini bu shared hostinqdə qaldırmaq olmur.
- Canlı `.env` hazırda Supabase public URL/key və server service-role açarından istifadə edir.

## Təhlükəsiz keçid sırası

1. cPanel-də ayrıca boş PostgreSQL bazası və yalnız həmin bazaya səlahiyyətli istifadəçi yarat.
2. Server-only `KIRAYE_DB_*`, `KIRAYE_SESSION_SECRET` və `KIRAYE_STORAGE_ROOT`
   dəyərlərini canlı `.env.production.local` faylına daxil et. Heç birini GitHub-a yazma.
3. `scripts/host/check-readiness.mjs` ilə bağlantı və yazı qovluğunu yoxla.
4. `host/postgres/001-core.sql` sxemini yalnız boş yeni bazaya tətbiq et.
5. Auth/API/Storage adapterini əvvəl paralel rejimdə işə sal; real trafik hələ Supabase-də qalsın.
6. Boş host bazasında iki ayrı test hesabı ilə qeydiyyat, 6 rəqəmli kod, giriş/çıxış, Google,
   şifrə bərpası, elan, şəkil, moderasiya və mesajlaşmanı yoxla.
7. Şifrəli tam ehtiyat və başqa mühitdə bərpa sınağından sonra domeni yeni backendə keçir.
8. Köhnə asılılıq qalmadığı sübut ediləndən sonra həmin sayta aid Supabase layihəsi və
   Vercel deployment-ları ləğv edilə bilər. Hesabların özü və başqa layihələr silinmir.

Ödəniş sistemi bütün mərhələlərdə bağlı qalır.
