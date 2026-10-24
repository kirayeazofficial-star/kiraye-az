<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Live access priority — user instruction, 24 October 2026

As soon as authorized working SSH or live database access is available, complete the pending server work in `docs/HOSTING-MIGRATION-CHECKLIST.md` BEFORE subsequent feature tasks, unless the user explicitly reprioritizes. This includes all deferred database migrations, old and new listing policies, public access, auth, six-digit email delivery, SMTP and deployment checks, not only listing limits. Preserve data and backups; verify replacements before removing Supabase/Vercel. Source commits do not prove live activation. Payments stay inactive until separately authorized.

## Product choices — 24 October 2026

Read `docs/FUTURE-IDEAS.md` during future product planning. The user deferred the “Kirayə axtarıram” board and rejected availability status and listing comparison. Do not add those without a new instruction. Weekly rates and view statistics require the migration and server setup in the hosting checklist; do not claim they are live from a source commit.

## Latest archive policy — 24 October 2026

The user now requires all archived/expired listing restoration to be paid, including early manual removal. Payments are still inactive. Apply `supabase/paid-restoration.sql` AFTER `listing-lifecycle.sql`; never re-enable the old free restoration RPC or direct edit path. Preserve archived data/photos. Do not invent a restoration price.
