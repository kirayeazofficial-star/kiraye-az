-- Daily backups to the leader's Google Drive: the connection (refresh token is stored encrypted),
-- which uploaded files are already on Drive (photos are sent only once) and a log of runs.
create table if not exists public.backup_settings(
  id int primary key default 1 check (id=1),
  drive_token text,
  drive_email text,
  root_folder text,
  db_folder text,
  files_folder text,
  connected_by uuid,
  connected_at timestamptz,
  updated_at timestamptz not null default now()
);
create table if not exists public.backup_files(
  path text primary key,
  drive_id text not null,
  size bigint not null default 0,
  uploaded_at timestamptz not null default now()
);
create table if not exists public.backup_runs(
  id bigserial primary key,
  trigger text not null default 'cron',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  ok boolean,
  db_file text,
  db_bytes bigint,
  db_rows bigint,
  files_new int not null default 0,
  files_bytes bigint not null default 0,
  error text
);
create index if not exists backup_runs_started_idx on public.backup_runs(started_at desc);
