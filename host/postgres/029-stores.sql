-- Stores ("Mağaza"): anyone can open one with a monthly package; the leader approves and activates it
-- (by hand until online payment is connected). A store raises the listing limit per category.
create table if not exists public.store_plans(
  id text primary key,
  name text not null,
  price numeric(10,2) not null default 0,
  listing_limit integer,            -- per category; null = no limit
  free_bumps integer not null default 0,
  featured boolean not null default false,
  sort integer not null default 0
);
insert into public.store_plans(id,name,price,listing_limit,free_bumps,featured,sort) values
  ('start','Başlanğıc',15,20,0,false,1),
  ('business','Biznes',35,60,10,false,2),
  ('premium','Premium',70,null,30,true,3)
on conflict (id) do nothing;

create table if not exists public.stores(
  id uuid primary key,
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,40}$'),
  name text not null,
  description text not null default '',
  logo_url text,
  phone text not null default '',
  address text not null default '',
  hours text not null default '',
  cover_url text,
  open_from text check (open_from is null or open_from ~ '^[0-2][0-9]:[0-5][0-9]$'),
  open_to text check (open_to is null or open_to ~ '^[0-2][0-9]:[0-5][0-9]$'),
  plan text not null references public.store_plans(id),
  status text not null default 'pending' check (status in ('pending','active','rejected','expired')),
  active_until timestamptz,
  reject_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists stores_active_idx on public.stores(status,active_until);

-- Price history: the previous price is kept when the owner lowers it ("Qiymət endirildi").
alter table public.listings add column if not exists previous_price numeric(12,2);
alter table public.listings add column if not exists price_lowered_at timestamptz;
