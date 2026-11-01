-- Optional map location of a listing (homes, villas, premises). Without "exact" only an area is shown.
alter table public.listings add column if not exists lat double precision;
alter table public.listings add column if not exists lng double precision;
alter table public.listings add column if not exists location_exact boolean not null default false;
