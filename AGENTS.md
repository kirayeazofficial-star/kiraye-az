<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Layihə qaydaları (kirayeal.az)

- Sayt tam müstəqildir: verilənlər bazası, giriş, hesab, admin, mesajlaşma, xarici xidmət YOXDUR. Bütün elanlar `data/listings.ts` faylındadır. Yeni xarici xidmət/asılılıq əlavə etmə (cPanel deploy yeni asılılığı qəbul etmir).
- Elan əlavə/dəyişmə: yalnız `data/listings.ts` və şəkillər `public/` qovluğunda. "Elan yerləşdir" düymələri WhatsApp-a (`lib/site-contact.ts`) aparır.
- Dizaynı (`app/globals.css`, komponentlər) istifadəçi istəmədən dəyişmə.
- Domen: `kirayeal.az`. Hosting: cPanel (Node 22, Passenger, `app.js`). Deploy: cPanel Git Version Control → Update from Remote → Deploy HEAD Commit (`.cpanel.yml`).
- Bu mühitdə `npm` işləməyə bilər; build yoxlaması deploy zamanı olur. Uğursuz build canlı saytı dəyişmir.
- İstifadəçi ilə sadə Azərbaycan dilində danış.
