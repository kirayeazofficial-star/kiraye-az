-- Additive compatibility upgrade for cPanel databases created during the
-- Supabase-to-host transition. Existing users, listings and messages remain.
begin;

alter table public.profiles add column if not exists profile_no bigint generated always as identity;
alter table public.profiles add column if not exists display_name varchar(100) not null default '';
alter table public.profiles add column if not exists phone varchar(32) not null default '';
alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists phone_change_count smallint not null default 0;
alter table public.profiles add column if not exists email_change_count smallint not null default 0;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();
create unique index if not exists profiles_profile_no_unique on public.profiles(profile_no);

create table if not exists public.profile_change_attempts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts>=0)
);

create table if not exists public.staff_members (
  user_id uuid primary key references auth.users(id) on delete restrict,
  staff_role text not null check (staff_role in ('moderator','leader')),
  assigned_by uuid references auth.users(id) on delete restrict,
  assigned_at timestamptz not null default now()
);

create table if not exists public.staff_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete restrict,
  target_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  created_at timestamptz not null default now()
);

update public.profiles p
set role='admin'
from auth.users u
where u.id=p.id and lower(u.email)='kirayeal.az@gmail.com';

insert into public.staff_members(user_id,staff_role,assigned_by)
select u.id,'leader',u.id from auth.users u
where lower(u.email)='kirayeal.az@gmail.com'
on conflict(user_id) do update set staff_role='leader';

commit;
