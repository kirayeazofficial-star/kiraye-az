-- A store keeps the package terms it was activated with (price, listing limit, free bumps) until
-- the next renewal: later price or limit changes by the leader apply only from the next renewal.
alter table public.stores add column if not exists terms_set boolean not null default false;
alter table public.stores add column if not exists terms_price numeric(10,2);
alter table public.stores add column if not exists terms_listing_limit integer;
alter table public.stores add column if not exists terms_free_bumps integer not null default 0;
-- Free bumps used in the current month of the store (counted from bumps_month_start).
alter table public.stores add column if not exists bumps_used integer not null default 0;
alter table public.stores add column if not exists bumps_month_start timestamptz;
