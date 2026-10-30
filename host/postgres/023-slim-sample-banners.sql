-- Lower sample adverts so listings stay in view: 1600×200 (phone 720×180), top strip 1920×100.
update public.banners set image_url='/banners/sample-top-v3.mp4',media_type='video' where id='00000000-0000-4000-8000-0000000b0001';
update public.banners set image_url='/banners/sample-home-v3.mp4',media_type='video',mobile_url='/banners/sample-home-m3.mp4',mobile_media_type='video' where id='00000000-0000-4000-8000-0000000b0003';
update public.banners set image_url='/banners/sample-listing-v3.mp4',media_type='video',mobile_url='/banners/sample-listing-m3.mp4',mobile_media_type='video' where id='00000000-0000-4000-8000-0000000b0004';
