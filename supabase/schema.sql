-- Run in Supabase SQL Editor. Additive and repeatable; existing data is retained.
begin;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text, phone text,
 role text not null default 'user' check(role in ('user','admin')),
 created_at timestamptz not null default now()
);
create table if not exists public.listings (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.profiles(id) on delete cascade,
 category text not null,
 title text not null check(char_length(title) between 10 and 120),
 city text not null, district text,
 price numeric(12,2) not null check(price > 0),
 rental_period text not null check(rental_period in ('daily','monthly')),
 status text not null default 'pending' check(status in ('draft','pending','published','rejected','archived')),
 description text, rooms smallint, area_m2 integer,
 attributes jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.listings add column if not exists contact text not null default '';
alter table public.listings add column if not exists images text[] not null default '{}';
alter table public.listings drop constraint if exists listings_category_check;
alter table public.listings add constraint listings_category_check check(category in ('property','car','motorcycle','villa','commercial','equipment','bicycle','event'));
alter table public.listings add column if not exists deposit numeric(12,2) not null default 0;
alter table public.listings add column if not exists min_days integer not null default 1;
alter table public.listings add column if not exists available_from date;
alter table public.listings add column if not exists available_until date;
alter table public.listings add column if not exists rejection_reason text;
alter table public.listings drop constraint if exists listings_rental_terms_check;
alter table public.listings add constraint listings_rental_terms_check check(deposit between 0 and 1000000 and min_days between 1 and 365 and (available_from is null or available_until is null or available_from<=available_until));
create index if not exists listings_public_feed on public.listings(status,created_at desc);
create index if not exists listings_owner on public.listings(owner_id,created_at desc);

-- Admin authority is read from the database, never from client input or metadata.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon,authenticated;

create or replace function public.protect_profile_role() returns trigger
language plpgsql set search_path = '' as $$
begin
 if auth.uid() is not null then
  if TG_OP='INSERT' and new.role <> 'user' then raise exception 'Role cannot be assigned by a client'; end if;
  if TG_OP='UPDATE' and (new.role is distinct from old.role or new.id is distinct from old.id) then raise exception 'Role and identity cannot be changed by a client'; end if;
 end if;
 return new;
end;
$$;
drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role before insert or update on public.profiles for each row execute function public.protect_profile_role();

create or replace function public.validate_listing() returns trigger
language plpgsql set search_path = '' as $$
begin
 if TG_OP='UPDATE' and (new.owner_id is distinct from old.owner_id or new.id is distinct from old.id or new.created_at is distinct from old.created_at) then raise exception 'Listing identity cannot be changed'; end if;
 if auth.uid() is not null and not public.is_admin() then
  if TG_OP='INSERT' and (new.owner_id <> auth.uid() or new.status <> 'pending') then raise exception 'New listings require review'; end if;
  if TG_OP='UPDATE' and new.status not in ('pending','archived') then raise exception 'Only administrators can publish listings'; end if;
 end if;
 if new.status<>'rejected' then new.rejection_reason=null; end if;
 if new.status='rejected' and (new.rejection_reason is null or char_length(trim(new.rejection_reason))<10 or char_length(new.rejection_reason)>500) then raise exception 'Provide a rejection reason'; end if;
 if jsonb_typeof(new.attributes)<>'object' then raise exception 'Invalid attributes'; end if;
 if char_length(new.attributes::text)>5000 then raise exception 'Attributes too large'; end if;
 if char_length(trim(new.city)) not between 2 and 80 or char_length(coalesce(new.district,''))>80 then raise exception 'Invalid location'; end if;
 if new.price > 1000000 or new.price <= 0 then raise exception 'Invalid price'; end if;
 if new.description is null or char_length(trim(new.description)) < 30 or char_length(new.description)>5000 then raise exception 'Description must contain 30-5000 characters'; end if;
 if new.contact is null or new.contact !~ '^\+?[0-9 ()-]{9,25}$' then raise exception 'Invalid contact'; end if;
 if new.images is null or cardinality(new.images) not between 1 and 6 then raise exception 'Provide 1-6 images'; end if;
 if exists(select 1 from unnest(new.images) image_url where image_url not like 'https://%/storage/v1/object/public/listing-images/' || new.owner_id::text || '/%') then raise exception 'Images must belong to the listing owner'; end if;
 if new.rooms is not null and (new.rooms<1 or new.rooms>100) then raise exception 'Invalid room count'; end if;
 if new.area_m2 is not null and (new.area_m2<1 or new.area_m2>1000000) then raise exception 'Invalid area'; end if;
 new.updated_at=now();
 return new;
end;
$$;
drop trigger if exists validate_listing on public.listings;
create trigger validate_listing before insert or update on public.listings for each row execute function public.validate_listing();

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
drop policy if exists "profiles are visible to owner" on public.profiles;
drop policy if exists "users create own profile" on public.profiles;
drop policy if exists "users update own profile" on public.profiles;
create policy "profiles are visible to owner" on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy "users create own profile" on public.profiles for insert to authenticated with check(id=(select auth.uid()) and role='user');
create policy "users update own profile" on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
drop policy if exists "published listings are public" on public.listings;
drop policy if exists "users create own listings" on public.listings;
drop policy if exists "users update own listings" on public.listings;
drop policy if exists "published listings anonymous access" on public.listings;
drop policy if exists "owners and admins read listings" on public.listings;
create policy "published listings anonymous access" on public.listings for select to anon,authenticated using(status='published');
create policy "owners and admins read listings" on public.listings for select to authenticated using(owner_id=(select auth.uid()) or (select public.is_admin()));
create policy "users create own listings" on public.listings for insert to authenticated with check(owner_id=(select auth.uid()) and status='pending');
create policy "users update own listings" on public.listings for update to authenticated using(owner_id=(select auth.uid()) or (select public.is_admin())) with check(owner_id=(select auth.uid()) or (select public.is_admin()));
grant select,insert,update on public.profiles to authenticated;
grant select on public.listings to anon;
grant select,insert,update on public.listings to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('listing-images','listing-images',true,5242880,array['image/jpeg','image/png','image/webp'])
 on conflict(id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists "public listing photos" on storage.objects;
drop policy if exists "owners upload listing photos" on storage.objects;
drop policy if exists "owners remove listing photos" on storage.objects;
create policy "public listing photos" on storage.objects for select to anon,authenticated using(bucket_id='listing-images');
create policy "owners upload listing photos" on storage.objects for insert to authenticated with check(bucket_id='listing-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "owners remove listing photos" on storage.objects for delete to authenticated using(bucket_id='listing-images' and (storage.foldername(name))[1]=(select auth.uid())::text);

-- Create account profiles automatically and preserve existing roles during upgrades.
create or replace function public.kiraye_create_profile() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id) values(new.id) on conflict(id) do nothing;
 return new;
end;
$$;
drop trigger if exists kiraye_create_profile on auth.users;
create trigger kiraye_create_profile after insert on auth.users for each row execute function public.kiraye_create_profile();
insert into public.profiles(id) select id from auth.users on conflict(id) do nothing;

-- One authenticated report per listing/person. Only moderators can resolve reports.
create table if not exists public.listing_reports(
 id uuid primary key default gen_random_uuid(),
 listing_id uuid not null references public.listings(id) on delete cascade,
 reporter_id uuid not null references auth.users(id) on delete cascade,
 reason text not null check(reason in ('Saxta və ya şübhəli elan','Yanlış qiymət və məlumat','Artıq kirayəyə verilib','Uyğunsuz məzmun','Başqa səbəb')),
 message text not null check(char_length(trim(message)) between 10 and 1000),
 status text not null default 'open' check(status in ('open','resolved')),
 created_at timestamptz not null default now(),
 unique(listing_id,reporter_id)
);
create index if not exists listing_reports_queue on public.listing_reports(status,created_at desc);
alter table public.listing_reports enable row level security;
drop policy if exists "reporters and admins read reports" on public.listing_reports;
drop policy if exists "users report public listings" on public.listing_reports;
drop policy if exists "admins resolve reports" on public.listing_reports;
create policy "reporters and admins read reports" on public.listing_reports for select to authenticated using(reporter_id=(select auth.uid()) or (select public.is_admin()));
create policy "users report public listings" on public.listing_reports for insert to authenticated with check(reporter_id=(select auth.uid()) and status='open' and exists(select 1 from public.listings where id=listing_id and status='published' and owner_id<>(select auth.uid())));
create policy "admins resolve reports" on public.listing_reports for update to authenticated using((select public.is_admin())) with check((select public.is_admin()));
grant select,insert,update on public.listing_reports to authenticated;

commit;

-- To designate the owner, run separately in the SQL Editor after signing up:
-- update public.profiles set role='admin'
-- where id=(select id from auth.users where email='YOUR_ADMIN_EMAIL');
-- Never grant admin from a browser or user-editable metadata.
