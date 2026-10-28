# kirayeal.az

Kirayə elanları saytı (Next.js 16, React 19, TypeScript). Hostinq.az cPanel-də işləyir. Verilənlər bazası: hostinqdəki PostgreSQL.

## Necə yenilənir

1. Kod `main` budağına göndərilir.
2. GitHub Actions saytı build edir və hazır faylları `site` budağına qoyur (təxminən 2 dəqiqə).
3. cPanel → Git Version Control → `site` budağı → **Update from Remote** → **Deploy HEAD Commit**. Deploy bazanın yeni sxem fayllarını (`host/postgres`) avtomatik tətbiq edir.
4. `https://kirayeal.az/api/health` yeni `buildId` göstərməlidir.

## Server ayarları (yalnız serverdə, `.env.production.local`)

`KIRAYE_DB_HOST`, `KIRAYE_DB_PORT`, `KIRAYE_DB_NAME`, `KIRAYE_DB_USER`, `KIRAYE_DB_PASSWORD`, `KIRAYE_SESSION_SECRET` (32+ simvol), `KIRAYE_STORAGE_ROOT` (şəkillər üçün qovluq), `KIRAYE_SMTP_HOST`, `KIRAYE_SMTP_PORT`, `KIRAYE_SMTP_USER`, `KIRAYE_SMTP_PASSWORD`. Bu dəyərləri heç vaxt GitHub-a yükləmə.

## Lokal işə salmaq

```
npm ci
npm run dev
```

Build zamanı yalnız `NEXT_PUBLIC_SITE_URL` (məs. `https://kirayeal.az`) lazımdır.
