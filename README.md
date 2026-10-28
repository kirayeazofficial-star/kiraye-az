# kirayeal.az

Kirayə elanları saytı. Next.js 16 + React 19 + TypeScript. Verilənlər bazası və ya xarici xidmət yoxdur — hər şey bu repodadır, istənilən Node 22 hostinqə köçürülə bilər.

## Elanları dəyişmək

Bütün elanlar `data/listings.ts` faylındadır (faylın başındakı izaha bax). Şəkilləri `public/` qovluğuna qoy, elanda `/ad.jpg` kimi yaz. `status: "hidden"` elanı gizlədir. `demo: true` olan elanlar "Nümunə" kimi göstərilir və axtarış sisteminə (sitemap) düşmür.

## Lokal işə salmaq

```
npm ci
cp .env.example .env.local
npm run dev
```

Yoxlama: `npm run lint`, `npm run build`. Testlər: `node tests/<fayl>.cjs`.

## Mühit dəyişənləri

Yalnız `NEXT_PUBLIC_SITE_URL` (məs. `https://kirayeal.az`). Dəyişəndə yenidən build lazımdır. Docker üçün əlavə `SITE_HOST`.

## cPanel-ə yerləşdirmə (hostinq.az)

1. Node.js App: Node 22, startup file `app.js`, `NEXT_PUBLIC_SITE_URL` əlavə et.
2. Git Version Control: repo `https://github.com/kirayeazofficial-star/kiraye-az`, branch `main`.
3. Dəyişiklikdən sonra: **Update from Remote** → **Deploy HEAD Commit**.
4. Nəticədə `HTTP verified` yazısına və `https://kirayeal.az/api/health` cavabına bax.

Build uğursuz olsa canlı sayt toxunulmaz qalır. Hər deploydan əvvəl `.kirayeal-backups` qovluğunda ehtiyat saxlanır.

## Başqa hostinqə köçürmək

Repo fayllarını köçür, Node 22 + `NEXT_PUBLIC_SITE_URL` təyin et, `npm ci && npm run build && npm start`. Docker: `compose.yaml`.
