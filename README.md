# kiraye.az

Azərbaycan üçün kirayə elanları platforması. Next.js 16, React 19, TypeScript, Supabase Auth/Postgres/Storage.

## Local development

Node.js 22/24 recommended.

```sh
npm ci --cache /workspace/.npm-cache
npm run dev
```

Create `.env.local` using `.env.example` and supply the project URL and browser-safe publishable key. Never use a secret/service-role key in NEXT_PUBLIC variables. Existing code accepts NEXT_PUBLIC_SUPABASE_ANON_KEY as an alternative.

## Supabase activation

1. Run `supabase/schema.sql` in the project's SQL Editor. It retains existing tables/data and installs RLS, moderation enforcement and storage policies. Review existing third-party policies separately if this project has other applications.
2. In Authentication → URL Configuration, replace the default localhost Site URL with `https://kiraye-az.vercel.app` until the custom domain is active. Add these exact Redirect URLs:
   - `https://kiraye-az.vercel.app/auth/callback`
   - `https://kiraye-az.vercel.app/auth/callback?flow=recovery`
   - `https://kiraye-az.vercel.app/profile` (older deployed emails)
   - `https://kiraye-az.vercel.app/reset-password` (older deployed emails)
     When kiraye.az is connected, add equivalent URLs for that domain and switch Site URL. Supabase falls back to Site URL when a requested redirect is not allowed; this is why a localhost Site URL sends confirmation emails to a blank local page. Request a NEW confirmation email after saving; old emails retain their original URLs.
     New code uses `/auth/callback` for confirmation and password recovery, validates expired links, supports token-hash and code callbacks, and shows explicit recovery actions. If the configured email template includes a numeric OTP, users can also verify it on the login page. Email templates containing only a confirmation link do not supply a numeric code. Optional `NEXT_PUBLIC_SITE_URL` pins the callback host to the production origin; localhost is never selected for new outbound email redirects.
3. Enable email/password authentication. Configure a production SMTP provider before public launch; default email delivery has limits.
4. Register the owner's account (profiles are created automatically by the schema), and designate it as admin using the SQL statement at the bottom of schema.sql. This privileged step must be executed only in the SQL Editor.
5. Verify sign-up, email confirmation, login, password recovery, photo uploads, pending listing visibility, admin approval, public feed and archive with real accounts.

## Vercel

Import this GitHub repository, use the Next.js preset, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in project environment variables, then redeploy. No secret/service-role key is needed. NEXT_PUBLIC values are embedded at build time. Set domain/DNS and Supabase callback URLs for the final hostname. Choose a Vercel plan appropriate for commercial use.

## Checks

```sh
npm run build
npm run lint
npm run test:ui
node tests/auth-flow.cjs
node tests/rental-details.cjs
```

Build includes TypeScript validation. UI tests need `npm run dev -- --port 3001` or a production server on port 3001. They exercise the disconnected/demo state with browser-safe Supabase variables absent. `PLAYWRIGHT_MODULE_PATH` may point to an existing Playwright module; browser binaries must be installed. Set `CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` to use a system browser.

Database-policy tests use an isolated PGlite instance: `PGLITE_MODULE_PATH=/path/to/@electric-sql/pglite node tests/schema.cjs`. They stub the Supabase auth/storage schemas and do not replace live integration tests.

## Implemented

Responsive category marketplace, city/price/period/search/sort filters, persistent favorites, listing detail/gallery/phone/WhatsApp, authenticated photo uploads and listing submission, owner dashboard/archive, database-enforced admin moderation, login/sign-up/password recovery, rules/safety page. Demo listings are explicitly labeled and are used only when the live feed is unavailable. Real listings are stored in Supabase, never browser localStorage.

## Rental marketplace extension

- `/listings/[id]`: shareable public listing pages with title/description metadata, canonical URLs, photos, deposit, minimum rental duration, stated availability, property amenities and vehicle details. `/listings/example-*` pages are marked noindex.
- `/edit/[id]`: authenticated owners can retain/remove/add photos, change terms and resubmit. Every edit sets the status to pending; a published listing leaves the public feed until reapproved. Archived listings can be renewed through the same form. Identity and owner cannot be changed in the database.
- Profile now links to editing, archive, public listing views and `/account` settings.
- Logged-in visitors can report published listings, one report per person/listing. Report content is visible only to its reporter and admins. Owners cannot report their own listings. Admins have a report queue and must provide a reason when rejecting listings.
- Room count, area, vehicle brand/gearbox, deposit and date filters are supported. Availability is the owner's stated interval, not a reservation or live booking calendar.
- `/help` explains how to use the platform; `/privacy` documents current storage behavior. No fictional business address/support contact is published. Business identity, operator contact and a full reviewed privacy/retention policy remain launch requirements.
- `sitemap.xml` refreshes hourly and includes up to 1000 published listings. `robots.txt` excludes account/admin and example routes. Optional `NEXT_PUBLIC_SITE_URL` sets the canonical origin; otherwise the current primary Vercel hostname is used.

**Database upgrade:** Run the updated `supabase/schema.sql` once in the same project's SQL Editor. It adds rental-term columns, report policies and automatic profile creation/backfill without removing listings. Running it twice is covered by the isolated database tests. This file has NOT been executed against the real project from Codex. Until it is applied, new queries/writes can fail. Apply this additive upgrade before deploying the extension.

## Launch limits

No payments, reservations, VIP listings, in-app chat or automated identity verification. Photo bucket is public, including photos uploaded for pending listings; don't upload sensitive material. Feed currently loads the latest 200 listings; introduce server pagination/indexed search before scaling. Rate limits, legal/privacy review, retention/deletion operations and monitoring should be finalized before public launch. Backend integration needs real project credentials and SQL activation and is not established by a successful local build.
