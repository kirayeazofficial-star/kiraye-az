-- Advertising banners managed from the leader panel.
create table if not exists public.banners (
  id uuid primary key,
  title varchar(120) not null default '',
  image_url text not null,
  link_url text,
  placement text not null default 'home' check (placement in ('home','listing')),
  active boolean not null default true,
  starts_at date,
  ends_at date,
  sort_order integer not null default 0,
  clicks integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists banners_placement_idx on public.banners (placement, active, sort_order);
