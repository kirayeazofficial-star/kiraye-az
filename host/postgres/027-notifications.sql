-- E-mail notices: new message, listing about to expire, saved search alerts, weekly report for the leader.
-- notification_log makes every notice go out once (unique kind + ref).
create table if not exists public.notification_log(
  id bigserial primary key,
  user_id uuid,
  kind text not null,
  ref text not null,
  sent_at timestamptz not null default now(),
  unique(kind,ref)
);
alter table public.profiles add column if not exists email_notifications boolean not null default true;
create table if not exists public.saved_search_alerts(
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  params jsonb not null default '{}'::jsonb,
  last_checked timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists saved_search_alerts_user_idx on public.saved_search_alerts(user_id);
