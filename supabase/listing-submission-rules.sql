-- Apply AFTER schema.sql through an authorized SQL connection.
-- Existing listings remain unchanged. Repeatable; no payment or VIP activation.
begin;
create table if not exists public.listing_monthly_usage (
 owner_id uuid not null references auth.users(id) on delete cascade,
 month_start date not null,
 submission_count integer not null check (submission_count > 0),
 primary key(owner_id, month_start)
);
alter table public.listing_monthly_usage enable row level security;
revoke all on public.listing_monthly_usage from anon, authenticated;
-- Only the trigger writes usage. Archiving/deleting an ad never refunds its slot.
insert into public.listing_monthly_usage(owner_id, month_start, submission_count)
 select owner_id, date_trunc('month', created_at at time zone 'Asia/Baku')::date, count(*)::integer
 from public.listings group by 1,2
on conflict (owner_id, month_start) do update
 set submission_count=greatest(listing_monthly_usage.submission_count, excluded.submission_count);

create or replace function public.enforce_listing_submission_rules() returns trigger
language plpgsql security definer set search_path = '' as $$
declare current_month date := date_trunc('month', now() at time zone 'Asia/Baku')::date;
begin
 -- Trusted imports run without an end-user identity. Browser users cannot choose it.
 if auth.uid() is null then return new; end if;
 if new.owner_id <> auth.uid() then
   -- Admin moderation of another owner's existing listing does not consume quota.
   if TG_OP='UPDATE' and public.is_admin() then return new; end if;
   raise exception 'Invalid listing owner' using errcode='42501';
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.owner_id::text, 0));
 if new.status in ('draft','pending','published') and exists (
   select 1 from public.listings existing
   where existing.owner_id=new.owner_id and existing.id<>new.id
    and existing.status in ('draft','pending','published')
    and existing.category=new.category
    and lower(regexp_replace(trim(existing.city), '\s+', ' ', 'g'))=lower(regexp_replace(trim(new.city), '\s+', ' ', 'g'))
    and ((lower(regexp_replace(trim(existing.title), '\s+', ' ', 'g'))=lower(regexp_replace(trim(new.title), '\s+', ' ', 'g'))
      and lower(regexp_replace(trim(existing.description), '\s+', ' ', 'g'))=lower(regexp_replace(trim(new.description), '\s+', ' ', 'g')))
      or existing.images && new.images)
 ) then raise exception 'DUPLICATE_LISTING' using errcode='PDU01'; end if;
 if TG_OP='INSERT' then
   if exists(select 1 from public.listing_monthly_usage where owner_id=new.owner_id and month_start=current_month) then
     raise exception 'MONTHLY_LISTING_LIMIT' using errcode='PML01';
   end if;
   -- Do not trust a client-supplied timestamp to move the insert into another month.
   new.created_at=now();
   insert into public.listing_monthly_usage values(new.owner_id, current_month, 1);
 end if;
 return new;
end;
$$;
revoke all on function public.enforce_listing_submission_rules() from public;
drop trigger if exists enforce_listing_submission_rules on public.listings;
create trigger enforce_listing_submission_rules before insert or update on public.listings
 for each row execute function public.enforce_listing_submission_rules();
commit;
