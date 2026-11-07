-- The leader panel counts, for each listing on the page, other people's listings with the same phone
-- or a shared photo. Without these indexes every row scans the whole listings table, which grows slow.
create index if not exists listings_contact_idx on public.listings (contact) where contact is not null and contact <> '';
create index if not exists listings_images_gin_idx on public.listings using gin (images);
