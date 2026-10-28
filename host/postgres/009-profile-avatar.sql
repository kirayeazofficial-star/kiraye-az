-- Profile photo: path served by /api/media/<user>/<file>.jpg, null when the user has none.
alter table public.profiles add column if not exists avatar_url text;
