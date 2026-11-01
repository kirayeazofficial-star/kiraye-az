<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Layihə qaydaları (kirayeal.az)

- Sayt hostinqdəki **PostgreSQL** (`kiraytfg_kirayeal`) ilə işləyir: hesablar, elanlar, mesajlar, admin. Supabase/Vercel YOXDUR və əlavə edilməməlidir. Bazanın sxemi `host/postgres/*.sql` fayllarındadır; deploy zamanı yeni fayllar avtomatik tətbiq olunur (köhnələr təkrarlanmır).
- Server ayarları (parol, SMTP, baza) yalnız serverdəki `.env.production.local` faylında olur. Onları GitHub-a, söhbətə və loga yazma.
- Deploy: kod `main`-ə göndərilir → GitHub Actions saytı build edib hazır faylları `site` budağına qoyur → cPanel Git Version Control `site` budağı: Update from Remote → Deploy HEAD Commit. Serverdə build olmur (yaddaş limiti).
- Dizayn (`app/*.css`, komponentlər) istifadəçi istəmədən dəyişdirilməsin. Ödəniş/balans/reklam xidmətləri bağlı qalır.
- İstifadəçi ilə sadə Azərbaycan dilində danış.
