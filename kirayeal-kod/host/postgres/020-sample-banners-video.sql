-- New sample adverts: three short videos (top strip, home page, listing page) and one picture (sides).
-- Rows from 019 are updated in place, so whether the leader switched them on stays as it was.
update public.banners set title='Nümunə video: Reklamınız burada (yuxarı zolaq)',image_url='/banners/sample-top.mp4',media_type='video' where id='00000000-0000-4000-8000-0000000b0001';
update public.banners set title='Nümunə şəkil: Reklamınız burada (sağ və sol)',image_url='/banners/sample-side.jpg',media_type='image' where id='00000000-0000-4000-8000-0000000b0002';
update public.banners set title='Nümunə video: Reklamınız burada (ana səhifə)',image_url='/banners/sample-home.mp4',media_type='video' where id='00000000-0000-4000-8000-0000000b0003';
update public.banners set title='Nümunə video: Reklamınız burada (elan səhifəsi)',image_url='/banners/sample-listing.mp4',media_type='video' where id='00000000-0000-4000-8000-0000000b0004';
