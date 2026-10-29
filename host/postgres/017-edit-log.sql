-- Up to two edits per listing in any 24 hours: the times of recent edits are kept on the listing.
alter table public.listings add column if not exists edit_log timestamptz[] not null default '{}';
update public.listings set edit_log=array[last_edited_at] where last_edited_at>now()-interval '1 day' and edit_log='{}';
