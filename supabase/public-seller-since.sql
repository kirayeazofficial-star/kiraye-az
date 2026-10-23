-- Public account age only for owners of published listings. Never exposes email/phone.
-- Apply with database administrator privileges; private profile policies stay unchanged.
begin;
create or replace function public.public_seller_since(listing_id uuid)
returns timestamptz language sql stable security definer set search_path = ''
as $$
 select date_trunc('month', u.created_at at time zone 'Asia/Baku') at time zone 'Asia/Baku'
 from auth.users u join public.listings l on l.owner_id = u.id
 where l.id = listing_id and l.status = 'published'
 limit 1;
$$;
revoke all on function public.public_seller_since(uuid) from public;
grant execute on function public.public_seller_since(uuid) to anon, authenticated;
commit;
