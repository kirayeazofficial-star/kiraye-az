-- Site settings the leader changes in the panel. limit_rules: free listings per group of categories
-- (Nəqliyyat / Əmlak / Əşya) and categories that are always paid. Off until online payment is connected.
create table if not exists public.site_settings(
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
insert into public.site_settings(key,value) values
  ('limit_rules','{"enabled":false,"free":{"transport":1,"property":1,"goods":1},"paid":["villa","commercial"]}')
on conflict (key) do nothing;

-- Store package prices ending in .99 (only where the leader has not changed them yet).
update public.store_plans set price=14.99 where id='start' and price=15;
update public.store_plans set price=34.99 where id='business' and price=35;
update public.store_plans set price=69.99 where id='premium' and price=70;
