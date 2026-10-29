-- Banner places like large classified sites: "top" (strip above the header) and "side"
-- (one advert shown both left and right on wide screens). Earlier left/right banners become "side".
alter table public.banners drop constraint if exists banners_placement_check;
update public.banners set placement='side' where placement in ('left','right');
alter table public.banners add constraint banners_placement_check check (placement in ('home','listing','top','side'));
