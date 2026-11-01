-- Optional phone version of a banner (picture or video, 2:1, e.g. 720×360). On phones a wide
-- 4:1 banner is too small to read, so when a phone version exists it is shown there instead.
alter table public.banners add column if not exists mobile_url text;
alter table public.banners add column if not exists mobile_media_type text;
update public.banners set mobile_url='/banners/sample-home-m.mp4',mobile_media_type='video' where id='00000000-0000-4000-8000-0000000b0003';
update public.banners set mobile_url='/banners/sample-listing-m.mp4',mobile_media_type='video' where id='00000000-0000-4000-8000-0000000b0004';
