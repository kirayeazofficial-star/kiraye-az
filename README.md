# kiraye.az

Azərbaycan üçün kirayə elanları platforması. Next.js 16, React 19, TypeScript, Supabase Auth/Postgres/Storage.

## Password recovery

The login screen now uses email → six-digit recovery code → new password. Apply the Supabase email template and OTP settings in [EMAIL-RECOVERY.md](docs/EMAIL-RECOVERY.md) before deploying this flow. Existing recovery links remain supported. Browser tests simulate Auth responses and do not prove real email delivery.

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
     New code uses `/auth/callback` for confirmation and `/reset-password` directly for password recovery, validates expired links, supports token-hash and code callbacks, and shows explicit recovery actions. If the configured email template includes a numeric OTP, users can also verify it on the login page. Email templates containing only a confirmation link do not supply a numeric code. Optional `NEXT_PUBLIC_SITE_URL` pins the callback host to the production origin; localhost is never selected for new outbound email redirects.
3. Enable email/password authentication. Configure a production SMTP provider before public launch; default email delivery has limits.
4. Register the owner's account (profiles are created automatically by the schema), and designate it as admin using the SQL statement at the bottom of schema.sql. This privileged step must be executed only in the SQL Editor.
5. Verify sign-up, email confirmation, login, password recovery, photo uploads, pending listing visibility, admin approval, public feed and archive with real accounts.

## Vercel

Import this GitHub repository, use the Next.js preset, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in project environment variables, then redeploy. No secret/service-role key is needed. NEXT_PUBLIC values are embedded at build time. Set domain/DNS and Supabase callback URLs for the final hostname. Choose a Vercel plan appropriate for commercial use.

## Login and deployment fixes

- Login accepts existing shorter passwords; the eight-character minimum applies only to new registration. Invalid credentials, missing confirmation, expired codes and rate limits have separate messages.
- Preview email callbacks use the stable production hostname by default. Only production variables are required on the primary site; enable Preview bindings separately if preview sign-in is needed.
- Header follows session state; profile has status tabs; logout clears the session.
- The public catalog runs search/filter/sort/count in Supabase before pagination (18 results/page). Failed live requests show an error and retry action, rather than replacing real results with sample listings. Samples are explicitly labeled only in the unconfigured state.
- Compact grid/list layouts and real listing links improve navigation. Quick previews remain available separately.

## Checks

```sh
npm run build
npm run lint
npm run test:ui
node tests/auth-flow.cjs
node tests/rental-details.cjs
node tests/catalog.cjs
```

Build includes TypeScript validation. UI tests need `npm run dev -- --port 3001` or a production server on port 3001. They exercise the disconnected/demo state with browser-safe Supabase variables absent. `PLAYWRIGHT_MODULE_PATH` may point to an existing Playwright module; browser binaries must be installed. Set `CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` to use a system browser.

`tests/account-workflow.cjs` requires a configured browser-public Supabase URL/key and running server. It intercepts all Supabase requests and simulates login, navigation, photo submission, editing, archive and logout; it does not create real accounts, send emails or prove a real user's password is valid. Run with `TEST_BASE_URL=http://127.0.0.1:3013 node tests/account-workflow.cjs`. Do not rebuild the same `.next` directory while browser tests are running. The disconnected suite requires empty Supabase variables at build time; test it separately before building the configured version.

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

No payments, reservations, VIP listings, in-app chat or automated identity verification. Photo bucket is public, including photos uploaded for pending listings; don't upload sensitive material. The public feed searches and sorts in the database and pages 18 results at a time; owner/admin queues still load up to 200 rows, so introduce queue pagination before high-volume moderation. Rate limits, legal/privacy review, retention/deletion operations and monitoring should be finalized before public launch. Backend integration needs real project credentials and SQL activation and is not established by a successful local build.

### Phone sign-in and delivery setup

Email/password opens by default; phone/SMS is available as a separate tab when a provider has been configured. The page reads Supabase's public Auth settings and shows the phone tab only when enabled. If Phone Auth is disabled, it explains that SMS is unavailable rather than claiming a code was sent. Once enabled, `signInWithOtp` creates/signs in the phone user; `verifyOtp` establishes the session. The cabinet uses the authenticated user ID, including accounts without email. A profile's editable contact number does not change the verified sign-in number.

**External setup required:** in Supabase → Authentication → Sign In / Providers → Phone, configure a supported SMS provider (for example Twilio), its sending number/service and credentials, then enable Phone. An SMS provider account and delivery charges are required; the repository cannot provision these. Store provider secrets only in Supabase, never a `NEXT_PUBLIC_*` variable, source code or chat. Configure delivery limits and test a real Azerbaijan mobile number before launch. Public provider-enabled settings do not prove that a carrier will deliver messages. An existing email account and a new phone account are separate until deliberately linked; automatic merging is not attempted.

Email confirmation opens the link in the email by default. Numeric OTP entry is optional because Supabase's standard email template may contain only a link. Resend has a cooldown; pending email verification survives a tab reload without storing passwords or tokens. A successful request is not represented as guaranteed inbox delivery. For missing email, the owner must check Auth delivery logs and configure production SMTP; application code cannot repair an unconfigured sender.

Run `TEST_BASE_URL=http://127.0.0.1:3020 node tests/phone-email-login.cjs` against a configured build. All Supabase requests are intercepted. The suite checks disabled/unreachable providers, phone normalization, wrong/valid OTP, resend limits, phone-only cabinet and photo-form identity, email link/code flows, sender failures, repeated registrations and responsive dimensions. It sends no real messages.

### Owner administrator setup

The intended owner account is `kiraye.azofficial@gmail.com` (confirmed by the owner). Open Supabase SQL Editor and run `supabase/assign-owner-admin.sql` once, then refresh `/admin` while signed into that website account. The script promotes only that existing account, is repeatable, and stops with a clear error if the account does not exist. It does not set a password or bypass email verification. This requires the project's SQL Editor access; the browser-public Supabase key cannot grant administrator privileges.

Moderation now filters, searches and paginates in Postgres (24 per page, including records beyond the previous 200-item window). State transitions check the previously loaded status so concurrent changes fail visibly rather than silently overwriting an intervening decision. A reason-validation error keeps the moderation form on screen. The owner can approve, reject with a reason, archive, and resolve reports. User administration or payment processing is not implied.

Posting supports incremental photo selection, a six-photo total limit including retained photos, choosing a cover among the retained/new photo groups, and local preview before submission. Invalid prices are rejected before uploads, duplicate submission is guarded, and a failed upload cleanup cannot hide the original error. Email request throttling persists across reloads and distinguishes sending limits from password login. These frontend checks do not lift Supabase's delivery limits or configure SMTP/SMS.

Additional verification: `node tests/admin-auth-review.cjs` (query and retry rules); `TEST_BASE_URL=http://127.0.0.1:3031 node tests/admin-workflow.cjs` (mocked moderator actions and access checks). The isolated database policy suite also tests the targeted owner assignment and refusal of missing accounts. No integration test sends real email/SMS or modifies production data.

### Google sign-in and moving to your own server

See [Google and server setup (Azerbaijani)](docs/GOOGLE-AND-SERVER.md) for the exact Google Cloud callback, Supabase provider/redirect settings, and domain deployment steps. Inactive Google and phone options are hidden from the login form; enabling it requires the owner's Google Cloud Client ID/Secret in Supabase. No Google secret belongs in this repository or browser environment. OAuth returns only to allowed local pages, including an interrupted rental submission.

`next.config.mjs` generates standalone output. `Dockerfile`, `compose.yaml` and `deploy/Caddyfile` provide a non-root Node.js server behind Caddy HTTPS. `scripts/check-public-env.mjs` validates production public configuration before the Docker build. `/api/health` checks process readiness only. Build-time `NEXT_PUBLIC_*` values must be rebuilt for a new domain. Supabase remains the managed Auth/database/storage backend, so moving the web server preserves existing users and listings when the same project is used.

Deployment verification: standalone Node output served health, static assets and application routes, and the mocked Google/account/moderation browser suites ran against that standalone server. `node tests/deployment.cjs` validates production configuration guards. Docker Compose configuration validates; the full clean Docker build could not finish in this cloud workspace because containers cannot resolve the npm registry (`EAI_AGAIN`). No TLS verification was disabled. Run a clean Docker build on the target server before launch; DNS and a real Google round trip still require the owner's external configuration.

Login recovery simplification: inactive OAuth/SMS choices no longer occupy the email form. A failed password login offers a direct recovery action preserving the email, and the recovery shortcut is above the submit button. Password rejection is not bypassed. Production builds now copy standalone assets automatically and `npm start` launches that output, avoiding the unsupported standalone/`next start` combination. Read-only browser checks against the live site covered category/search/favorites and signed-out route guards; authenticated posting/moderation checks use isolated simulated responses and do not prove the owner's password or email delivery.

Password recovery regression fix: new email requests point directly to `/reset-password`; older `/auth/callback` recovery links remain supported. The return URL is captured in memory before SDK initialization consumes its fragment, and a recovery pending in the original login tab returns to the password form when a session is available. Callback/form initialization and Auth network requests have finite deadlines, and reset success clears only pending recovery UI state. The integrated `tests/password-recovery.cjs` suite uses simulated Auth responses to cover request redirect, direct and legacy links, mismatched/updated passwords, expired links, missing sessions and returning to the original waiting tab. It changes no real password and sends no email.
