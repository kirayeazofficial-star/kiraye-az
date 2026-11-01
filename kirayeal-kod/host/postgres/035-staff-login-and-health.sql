-- Login protection: every sign-in attempt (5 wrong passwords in 15 minutes lock that e-mail for 15 minutes).
create table if not exists auth.login_attempts (
  id bigserial primary key,
  email text not null,
  ip text,
  ok boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists login_attempts_email_idx on auth.login_attempts (lower(email), created_at desc);
create index if not exists login_attempts_ip_idx on auth.login_attempts (ip, created_at desc);
-- Leader and admins confirm a new device with an e-mailed code; a confirmed device is trusted for 3 days.
create table if not exists auth.trusted_devices (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash bytea not null,
  user_agent text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists trusted_devices_user_idx on auth.trusted_devices (user_id, expires_at desc);
alter table auth.verification_codes drop constraint if exists verification_codes_purpose_check;
alter table auth.verification_codes add constraint verification_codes_purpose_check check (purpose in ('signup','recovery','email_change','staff_login'));
-- Site health, checked every 5 minutes by the server job; a problem is e-mailed to the leader and shown in the panel.
create table if not exists public.site_health (
  key text primary key,
  ok boolean not null,
  level text not null default 'ok',
  detail text not null default '',
  checked_at timestamptz not null default now(),
  alerted_at timestamptz
);
