-- Additive migration for existing installations; does not move or delete ads.
begin;
alter table public.listings drop constraint if exists listings_category_check;
alter table public.listings add constraint listings_category_check check(category in (
 'property','car','motorcycle','villa','commercial','equipment','bicycle','event',
 'clothing','electric','photo','camping'
));
commit;
