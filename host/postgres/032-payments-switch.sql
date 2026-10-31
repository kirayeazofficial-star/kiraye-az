-- Leader's master switch for every paid service (promotion, paid placement, restore, store packages).
-- When off, visitors do not see paid buttons; the leader still uses everything for free.
insert into public.site_settings(key,value) values ('payments','{"enabled":true}') on conflict (key) do nothing;
