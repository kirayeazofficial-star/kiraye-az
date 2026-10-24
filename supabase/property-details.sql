-- Additive validation: existing rows remain unchanged, new writes are checked.
begin;
alter table public.listings drop constraint if exists listing_bathrooms_valid;
alter table public.listings add constraint listing_bathrooms_valid check (
 not (attributes ? 'bathrooms') or case when attributes->>'bathrooms' ~ '^[0-9]{1,2}$'
 then (attributes->>'bathrooms')::integer between 1 and 20 else false end
) not valid;
commit;
