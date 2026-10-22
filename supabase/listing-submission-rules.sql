-- Apply AFTER schema.sql through an authorized SQL connection. Repeatable.
-- Replaces the former account-wide submission quota. Pending/rejected ads are free.
begin;
create table if not exists public.listing_approval_usage (
 listing_id uuid not null,
 owner_id uuid not null references auth.users(id) on delete cascade,
 category text not null,
 first_approved_at timestamptz not null default now(),
 primary key(listing_id, category)
);
-- No listing FK: deleting/archiving an already approved ad must not reset usage.
create index if not exists listing_approval_usage_owner_month on public.listing_approval_usage(owner_id,category,first_approved_at);
alter table public.listing_approval_usage enable row level security;
revoke all on public.listing_approval_usage from anon, authenticated;
-- Existing published ads have no historical approval timestamp. Use their original
-- date once; never backfill pending/rejected/archived ads or reset recorded usage.
insert into public.listing_approval_usage(listing_id,owner_id,category,first_approved_at)
 select id,owner_id,category,created_at from public.listings where status='published'
on conflict do nothing;

create or replace function public.has_category_listing_allowance(p_category text) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (
  public.is_admin() or not exists (
   select 1 from public.listing_approval_usage u
   where u.owner_id=auth.uid() and u.category=p_category
    and u.first_approved_at >= (date_trunc('month', now() at time zone 'Asia/Baku') at time zone 'Asia/Baku')
    and u.first_approved_at < ((date_trunc('month', now() at time zone 'Asia/Baku') + interval '1 month') at time zone 'Asia/Baku')
  )
 );
$$;
revoke all on function public.has_category_listing_allowance(text) from public;
grant execute on function public.has_category_listing_allowance(text) to authenticated;

create or replace function public.enforce_listing_submission_rules() returns trigger
language plpgsql security definer set search_path='' as $$
declare
 month_start timestamptz := date_trunc('month', now() at time zone 'Asia/Baku') at time zone 'Asia/Baku';
 owner_is_admin boolean;
begin
 if auth.uid() is not null and new.owner_id<>auth.uid() and not public.is_admin() then
  raise exception 'Invalid listing owner' using errcode='42501';
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.owner_id::text,0));
 select exists(select 1 from public.profiles where id=new.owner_id and role='admin') into owner_is_admin;
 -- Never count insertions as approvals or trust a browser-supplied creation date.
 if TG_OP='INSERT' and auth.uid() is not null then new.created_at=now(); end if;
 if new.status in ('draft','pending','published') and exists (
  select 1 from public.listings existing
  where existing.owner_id=new.owner_id and existing.id<>new.id
   and existing.status in ('draft','pending','published')
   and existing.category=new.category
   and lower(regexp_replace(trim(existing.city),'\s+',' ','g'))=lower(regexp_replace(trim(new.city),'\s+',' ','g'))
   and ((lower(regexp_replace(trim(existing.title),'\s+',' ','g'))=lower(regexp_replace(trim(new.title),'\s+',' ','g'))
    and lower(regexp_replace(trim(existing.description),'\s+',' ','g'))=lower(regexp_replace(trim(new.description),'\s+',' ','g')))
    or existing.images && new.images)
 ) then raise exception 'DUPLICATE_LISTING' using errcode='PDU01'; end if;
 -- New submissions in an already-used category are blocked; edits/resubmissions
 -- remain allowed. Approval is checked as well, including when an admin approves
 -- another user's pending ad. The actor's admin role must not exempt that owner.
 if not owner_is_admin and (
  (TG_OP='INSERT' and new.status in ('draft','pending','published')) or
  (new.status='published' and not exists (
   select 1 from public.listing_approval_usage where listing_id=new.id and category=new.category
  ))
 ) and exists (
  select 1 from public.listing_approval_usage u
  where u.owner_id=new.owner_id and u.category=new.category
   and u.first_approved_at>=month_start
   and u.first_approved_at<(month_start at time zone 'Asia/Baku' + interval '1 month') at time zone 'Asia/Baku'
 ) then raise exception 'MONTHLY_LISTING_LIMIT' using errcode='PML01'; end if;
 if new.status='published' then
  insert into public.listing_approval_usage(listing_id,owner_id,category)
   values(new.id,new.owner_id,new.category) on conflict do nothing;
 end if;
 return new;
end;
$$;
revoke all on function public.enforce_listing_submission_rules() from public;
drop trigger if exists enforce_listing_submission_rules on public.listings;
create trigger enforce_listing_submission_rules before insert or update on public.listings
 for each row execute function public.enforce_listing_submission_rules();
commit;
