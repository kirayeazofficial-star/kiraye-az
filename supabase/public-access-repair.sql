-- Apply through an authorized SQL connection. Keeps pending/private listings private.
-- Repeatable; does not publish, delete or change existing listings.
begin;
alter table public.listings enable row level security;
grant usage on schema public to anon, authenticated;
grant select on public.listings to anon;
grant select, insert, update on public.listings to authenticated;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
drop policy if exists "published listings are public" on public.listings;
drop policy if exists "published listings anonymous access" on public.listings;
drop policy if exists "owners and admins read listings" on public.listings;
create policy "published listings anonymous access" on public.listings
 for select to anon, authenticated using (status = 'published');
create policy "owners and admins read listings" on public.listings
 for select to authenticated using (owner_id = (select auth.uid()) or (select public.is_admin()));
commit;
-- If listing_reports is missing, apply the complete additive schema.sql as well.
