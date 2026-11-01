-- Side banners on wide computer screens: left and right of the page content.
alter table public.banners drop constraint if exists banners_placement_check;
alter table public.banners add constraint banners_placement_check check (placement in ('home','listing','left','right'));
