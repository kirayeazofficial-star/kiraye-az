-- Listings deleted by their owner are kept (status 'archived' + deleted_at) so they can be restored later.
alter table public.listings add column if not exists deleted_at timestamptz;
