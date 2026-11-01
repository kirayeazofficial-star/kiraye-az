-- Free placements: one row each time a listing is first published or restored.
-- The free limit counts rows from the last 30 days, so deleting a listing does not give the slot back.
create table if not exists public.listing_placements (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  category varchar(64) not null,
  kind text not null default 'free' check (kind in ('free','paid')),
  reason text not null default 'publish' check (reason in ('publish','restore')),
  placed_at timestamptz not null default now()
);
create index if not exists listing_placements_owner_idx on public.listing_placements (owner_id, category, placed_at desc);

-- Keep current limits unchanged: count listings first published in the last 30 days.
insert into public.listing_placements (owner_id, listing_id, category, placed_at)
select l.owner_id, l.id, l.category, l.first_published_at
  from public.listings l
 where l.first_published_at > now() - interval '30 days'
   and not exists (select 1 from public.listing_placements p where p.listing_id = l.id);
