-- Listings placed after the free limit is used wait for payment as drafts (not shown, not reviewed).
alter table public.listings add column if not exists payment_required boolean not null default false;
create index if not exists listings_payment_required_idx on public.listings (owner_id) where payment_required;
