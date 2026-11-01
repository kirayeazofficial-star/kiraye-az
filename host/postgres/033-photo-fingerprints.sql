-- Photo fingerprints (64-bit difference hash, computed in the browser before upload) against people who
-- re-post the same item for free or post someone else's photos. b0..b3 are 16-bit parts for fast lookup.
create table if not exists public.photo_hashes (
  path text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  hash bigint not null,
  b0 integer not null, b1 integer not null, b2 integer not null, b3 integer not null,
  created_at timestamptz not null default now()
);
create index if not exists photo_hashes_b0 on public.photo_hashes (b0);
create index if not exists photo_hashes_b1 on public.photo_hashes (b1);
create index if not exists photo_hashes_b2 on public.photo_hashes (b2);
create index if not exists photo_hashes_b3 on public.photo_hashes (b3);
-- Why a listing waits for payment ('limit' or 'repeat') and a note for moderators about matching photos.
alter table public.listings add column if not exists paid_reason text;
alter table public.listings add column if not exists duplicate_note text;
-- Site settings for the announcement bar and maintenance mode (off by default).
insert into public.site_settings(key,value) values ('announcement','{"enabled":false,"text":"","tone":"info","link":""}') on conflict (key) do nothing;
insert into public.site_settings(key,value) values ('maintenance','{"enabled":false,"text":""}') on conflict (key) do nothing;
