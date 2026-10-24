-- Apply AFTER listing-lifecycle.sql. Payments remain off; no fabricated order/receipt.
begin;
create or replace function public.renew_listing(p_listing_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.listings where id=p_listing_id and owner_id=auth.uid()) then raise exception 'Listing not found' using errcode='42501';end if;
 raise exception 'PAID_RESTORATION_UNAVAILABLE' using errcode='PRP01';
end $$;
revoke all on function public.renew_listing(uuid) from public;
grant execute on function public.renew_listing(uuid) to authenticated;
create or replace function public.block_unpaid_listing_restoration() returns trigger
language plpgsql set search_path='' as $$
begin
 if (old.status in ('archived','expired') or (old.status='published' and old.expires_at<=now()))
  and new.status in ('pending','published') then
  raise exception 'PAID_RESTORATION_UNAVAILABLE' using errcode='PRP01';
 end if;
 return new;
end $$;
drop trigger if exists block_unpaid_listing_restoration on public.listings;
create trigger block_unpaid_listing_restoration before update on public.listings for each row execute function public.block_unpaid_listing_restoration();
commit;
