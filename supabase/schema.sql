-- Run this once in Supabase Dashboard > SQL Editor > New query.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('property', 'car', 'motorcycle', 'villa')),
  title text not null check (char_length(title) between 10 and 120),
  city text not null,
  district text,
  price numeric(12,2) not null check (price > 0),
  rental_period text not null check (rental_period in ('daily', 'monthly')),
  status text not null default 'pending' check (status in ('draft', 'pending', 'published', 'rejected', 'archived')),
  description text,
  rooms smallint,
  area_m2 integer,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  path text not null,
  position smallint not null default 0
);

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;

create policy "profiles are visible to owner" on public.profiles for select using (auth.uid() = id);
create policy "users create own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "published listings are public" on public.listings for select using (status = 'published' or owner_id = auth.uid());
create policy "users create own listings" on public.listings for insert with check (owner_id = auth.uid());
create policy "users update own listings" on public.listings for update using (owner_id = auth.uid());
create policy "listing images follow listing visibility" on public.listing_images for select using (exists (select 1 from public.listings where listings.id = listing_images.listing_id and (listings.status = 'published' or listings.owner_id = auth.uid())));
create policy "owners manage images" on public.listing_images for all using (exists (select 1 from public.listings where listings.id = listing_images.listing_id and listings.owner_id = auth.uid()));
