-- Paid-style promotions paid from the on-site balance.
begin;
alter table public.listings add column if not exists bump_started timestamptz;
alter table public.listings add column if not exists bump_count integer not null default 0;
create index if not exists listings_promotion_idx on public.listings(promotion_until) where promotion_kind is not null;
commit;
