-- Apply after admin-panel-refinements.sql. Protect previously published listings
-- whose edit is still pending when the original publication period ends.
begin;
create or replace function public.block_unpaid_listing_restoration() returns trigger
language plpgsql set search_path='' as $$
begin
 if (old.status in ('archived','expired')
     or (old.first_published_at is not null and old.expires_at<=now()))
    and new.status in ('pending','published') then
  raise exception 'PAID_RESTORATION_UNAVAILABLE' using errcode='PRP01';
 end if;
 return new;
end $$;
create or replace function public.expire_listings() returns integer
language plpgsql security definer set search_path='' as $$
declare affected integer;
begin
 update public.listings set status='expired'
 where status in ('published','pending') and first_published_at is not null and expires_at<=now();
 get diagnostics affected=row_count;
 return affected;
end $$;
revoke all on function public.expire_listings() from public,anon,authenticated;
grant execute on function public.expire_listings() to service_role;
create or replace function public.public_seller_since(listing_id uuid)
returns timestamptz language sql stable security definer set search_path='' as $$
 select date_trunc('month',u.created_at at time zone 'Asia/Baku') at time zone 'Asia/Baku'
 from auth.users u join public.listings l on l.owner_id=u.id
 where l.id=listing_id and l.status='published'
 and coalesce(l.expires_at,l.first_published_at+interval '30 days',l.created_at+interval '30 days')>now()
 limit 1;
$$;
revoke all on function public.public_seller_since(uuid) from public;
grant execute on function public.public_seller_since(uuid) to anon,authenticated;
notify pgrst,'reload schema';
commit;