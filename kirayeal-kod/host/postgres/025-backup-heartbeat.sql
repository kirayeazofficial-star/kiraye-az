-- A running backup reports progress, so a copy that the hosting stopped half-way is noticed
-- (and finished by the next cron check) instead of showing "gedir…" for ever.
alter table public.backup_runs add column if not exists heartbeat_at timestamptz;
alter table public.backup_settings add column if not exists run_requested boolean not null default false;
