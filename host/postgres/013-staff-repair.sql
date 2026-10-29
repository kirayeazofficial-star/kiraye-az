-- Leader panel: make sure the staff tables have every column the panel uses.
-- Databases that existed before the host schema may have older copies of these tables.
begin;

create table if not exists public.staff_members (
  user_id uuid primary key references auth.users(id) on delete restrict,
  staff_role text not null check (staff_role in ('moderator','leader')),
  assigned_by uuid references auth.users(id) on delete restrict,
  assigned_at timestamptz not null default now()
);
alter table public.staff_members add column if not exists assigned_by uuid;
alter table public.staff_members add column if not exists assigned_at timestamptz not null default now();

create table if not exists public.staff_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete restrict,
  target_id uuid references auth.users(id) on delete restrict,
  action text not null,
  created_at timestamptz not null default now()
);
alter table public.staff_events add column if not exists actor_id uuid;
alter table public.staff_events add column if not exists target_id uuid;
alter table public.staff_events add column if not exists action text not null default 'unknown';
alter table public.staff_events add column if not exists created_at timestamptz not null default now();

-- Every staff member needs a profile marked admin.
insert into public.profiles(id,display_name,phone,role)
select s.user_id,split_part(u.email,'@',1),'','admin'
from public.staff_members s join auth.users u on u.id=s.user_id
on conflict(id) do update set role='admin',updated_at=now();

-- Banners may be a picture or a short video.
alter table public.banners add column if not exists media_type text not null default 'image';

commit;
