-- Hours between automatic lifts: 8 for a bought "İrəli çək", 24 for the daily lift that comes with VIP / Premium.
alter table public.listings add column if not exists bump_hours integer not null default 8;
