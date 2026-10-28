create index if not exists listings_category_idx on public.listings (category, status, created_at desc);
create index if not exists listings_owner_created_idx on public.listings (owner_id, category, created_at desc);
