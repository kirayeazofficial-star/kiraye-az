-- Apply after schema.sql and listing-submission-rules.sql. Transactional and repeatable.
-- Retains the site's existing count (1/category), not an invented Tap.az category table.
begin;
alter table public.listings add column if not exists first_published_at timestamptz;
alter table public.listings add column if not exists expires_at timestamptz;
alter table public.listings drop constraint if exists listings_status_check;
alter table public.listings add constraint listings_status_check check(status in ('draft','pending','published','rejected','archived','expired'));
create table if not exists public.listing_category_limits (
 category text primary key, active_limit integer not null check(active_limit>0),
 period_limit integer not null check(period_limit>0)
);
alter table public.listing_category_limits enable row level security;
drop policy if exists "read category limits" on public.listing_category_limits;
create policy "read category limits" on public.listing_category_limits for select to anon,authenticated using(true);
revoke all on public.listing_category_limits from anon,authenticated;
grant select on public.listing_category_limits to anon,authenticated;
insert into public.listing_category_limits select category,1,1 from unnest(array['property','car','motorcycle','villa','commercial','equipment','clothing','electric','photo','camping','bicycle','event']) category on conflict do nothing;
create table if not exists public.listing_cycle_usage (
 listing_id uuid not null, owner_id uuid not null references auth.users(id) on delete cascade,
 category text not null, started_at timestamptz not null,
 primary key(listing_id,started_at)
);
alter table public.listing_cycle_usage enable row level security;
revoke all on public.listing_cycle_usage from anon,authenticated;
create index if not exists listing_cycle_owner_period on public.listing_cycle_usage(owner_id,category,started_at);
alter table public.listings disable trigger enforce_listing_submission_rules;
alter table public.listings disable trigger validate_listing;
update public.listings l set first_published_at=coalesce((select min(first_approved_at) from public.listing_approval_usage u where u.listing_id=l.id),l.created_at)
 where l.first_published_at is null and (l.status='published' or exists(select 1 from public.listing_approval_usage u where u.listing_id=l.id));
update public.listings set expires_at=first_published_at+interval '30 days' where first_published_at is not null and expires_at is null;
insert into public.listing_cycle_usage select id,owner_id,category,first_published_at from public.listings where first_published_at is not null on conflict do nothing;
update public.listings set status='expired' where status='published' and expires_at<=now();
alter table public.listings enable trigger validate_listing;

create or replace function public.listing_allowance(p_category text,p_listing_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare who uuid:=auth.uid(); lim public.listing_category_limits; ad public.listings; active_count bigint; used_count bigint;
begin
 if who is null then raise exception 'Sign in required' using errcode='42501'; end if;
 if p_listing_id is not null then
  select * into ad from public.listings where id=p_listing_id and owner_id=who;
  if ad.id is null then raise exception 'Listing not found' using errcode='42501'; end if;
  if ad.category<>p_category then raise exception 'Invalid category' using errcode='22023'; end if;
 end if;
 if public.is_admin() then return jsonb_build_object('allowed',true); end if;
 select * into lim from public.listing_category_limits where category=p_category;
 if lim.category is null then return jsonb_build_object('allowed',false,'reason','unconfigured'); end if;
 select count(*) into active_count from public.listings where owner_id=who and category=p_category and status='published' and expires_at>now() and (p_listing_id is null or id<>p_listing_id);
 if active_count>=lim.active_limit then return jsonb_build_object('allowed',false,'reason','active','active_limit',lim.active_limit,'period_limit',lim.period_limit); end if;
 -- Restoring within the original active period keeps its original expiry and usage.
 if ad.expires_at>now() then return jsonb_build_object('allowed',true); end if;
 select count(*) into used_count from public.listing_cycle_usage where owner_id=who and category=p_category and started_at>now()-interval '30 days';
 return jsonb_build_object('allowed',used_count<lim.period_limit,'reason','period','active_limit',lim.active_limit,'period_limit',lim.period_limit);
end; $$;
revoke all on function public.listing_allowance(text,uuid) from public;
grant execute on function public.listing_allowance(text,uuid) to authenticated;
create or replace function public.has_category_listing_allowance(p_category text) returns boolean
language sql stable security definer set search_path='' as $$ select coalesce((public.listing_allowance(p_category,null)->>'allowed')::boolean,false) $$;

create or replace function public.enforce_listing_submission_rules() returns trigger
language plpgsql security definer set search_path='' as $$
declare lim public.listing_category_limits; owner_admin boolean; new_cycle boolean; active_count bigint; period_count bigint;
begin
 if auth.uid() is not null and new.owner_id<>auth.uid() and not public.is_admin() then raise exception 'Invalid owner' using errcode='42501'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.owner_id::text,0));
 if TG_OP='INSERT' then
  if auth.uid() is not null and (new.first_published_at is not null or new.expires_at is not null) then raise exception 'Server managed dates' using errcode='42501'; end if;
  if auth.uid() is not null then new.created_at=now(); end if;
 else
  if auth.uid() is not null and (new.first_published_at is distinct from old.first_published_at or new.expires_at is distinct from old.expires_at) then raise exception 'Server managed dates' using errcode='42501'; end if;
  if old.first_published_at is not null and old.category<>new.category then raise exception 'Published listing category cannot change' using errcode='PLC01'; end if;
 end if;
 select exists(select 1 from public.profiles where id=new.owner_id and role='admin') into owner_admin;
 if new.status in ('draft','pending','published') and exists (
  select 1 from public.listings l where l.owner_id=new.owner_id and l.id<>new.id and l.category=new.category
   and (l.status in ('draft','pending') or (l.status='published' and l.expires_at>now()) or exists(select 1 from public.listing_cycle_usage u where u.listing_id=l.id and u.started_at>now()-interval '30 days'))
   and lower(regexp_replace(trim(l.city),'\s+',' ','g'))=lower(regexp_replace(trim(new.city),'\s+',' ','g'))
   and ((lower(regexp_replace(trim(l.title),'\s+',' ','g'))=lower(regexp_replace(trim(new.title),'\s+',' ','g')) and lower(regexp_replace(trim(l.description),'\s+',' ','g'))=lower(regexp_replace(trim(new.description),'\s+',' ','g'))) or l.images && new.images)
 ) then raise exception 'DUPLICATE_LISTING' using errcode='PDU01'; end if;
 new_cycle:=new.expires_at is null or new.expires_at<=now();
 if not owner_admin and ((TG_OP='INSERT' and new.status in ('draft','pending','published')) or new.status='published') then
  select * into lim from public.listing_category_limits where category=new.category;
  if lim.category is null then raise exception 'Category limits not configured' using errcode='PLC02'; end if;
  select count(*) into active_count from public.listings where owner_id=new.owner_id and category=new.category and id<>new.id and status='published' and expires_at>now();
  if active_count>=lim.active_limit then raise exception 'ACTIVE_LISTING_LIMIT' using errcode='PLA01'; end if;
  if new_cycle then
   select count(*) into period_count from public.listing_cycle_usage where owner_id=new.owner_id and category=new.category and started_at>now()-interval '30 days';
   if period_count>=lim.period_limit then raise exception 'ROLLING_LISTING_LIMIT' using errcode='PLR01'; end if;
  end if;
 end if;
 if new.status='published' and new_cycle then
  new.first_published_at:=coalesce(new.first_published_at,now());
  new.expires_at:=now()+interval '30 days';
  insert into public.listing_cycle_usage values(new.id,new.owner_id,new.category,now()) on conflict do nothing;
 end if;
 return new;
end; $$;
alter table public.listings enable trigger enforce_listing_submission_rules;
-- Restrictive policy also covers owner/admin OR policies on public queries.
-- Owners/admins may still inspect their private expired listings.
drop policy if exists "published listings anonymous access" on public.listings;
create policy "published listings anonymous access" on public.listings for select to anon,authenticated using(status='published' and expires_at>now());
drop policy if exists "expired listings require owner access" on public.listings;
create policy "expired listings require owner access" on public.listings as restrictive for select to anon,authenticated using(expires_at is null or expires_at>now() or owner_id=auth.uid() or public.is_admin());

create or replace function public.renew_listing(p_listing_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare ad public.listings; allowance jsonb;
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
 select * into ad from public.listings where id=p_listing_id and owner_id=auth.uid() for update;
 if ad.id is null then raise exception 'Listing not found' using errcode='42501'; end if;
 if not (ad.status in ('archived','expired') or (ad.status='published' and ad.expires_at<=now())) then raise exception 'Listing cannot be renewed' using errcode='22023'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(ad.owner_id::text,0));
 allowance:=public.listing_allowance(ad.category,ad.id);
 if not coalesce((allowance->>'allowed')::boolean,false) then
  if allowance->>'reason'='active' then raise exception 'ACTIVE_LISTING_LIMIT' using errcode='PLA01'; end if;
  raise exception 'ROLLING_LISTING_LIMIT' using errcode='PLR01';
 end if;
 update public.listings set status='pending' where id=ad.id;
end; $$;
revoke all on function public.renew_listing(uuid) from public;
grant execute on function public.renew_listing(uuid) to authenticated;
create or replace function public.expire_listings() returns integer
language plpgsql security definer set search_path='' as $$
declare affected integer;
begin
 update public.listings set status='expired' where status='published' and expires_at<=now();
 get diagnostics affected=row_count;
 return affected;
end; $$;
revoke all on function public.expire_listings() from public;
do $$ begin if exists(select 1 from pg_roles where rolname='service_role') then grant execute on function public.expire_listings() to service_role; end if; end $$;
create or replace function public.listing_lifecycle_ready() returns boolean
language sql stable security definer set search_path='' as $$ select true $$;
revoke all on function public.listing_lifecycle_ready() from public;
grant execute on function public.listing_lifecycle_ready() to anon,authenticated;
commit;
