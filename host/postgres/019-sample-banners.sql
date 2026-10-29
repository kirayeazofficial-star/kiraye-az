-- Sample adverts ("Reklamınız burada ola bilər") for every banner place, switched off by default:
-- the leader turns them on or off in the panel. Files are served from /banners/ (part of the site).
insert into public.banners(id,title,image_url,link_url,placement,active,sort_order,media_type) values
 ('00000000-0000-4000-8000-0000000b0001','Nümunə: Reklamınız burada ola bilər (yuxarı zolaq)','/banners/sample-top.jpg','https://wa.me/994502191145?text=Salam%2C%20kirayeal.az-da%20reklam%20yerl%C9%99%C5%9Fdirm%C9%99k%20ist%C9%99yir%C9%99m','top',false,90,'image'),
 ('00000000-0000-4000-8000-0000000b0002','Nümunə: Reklamınız burada ola bilər (sağ və sol)','/banners/sample-side.jpg','https://wa.me/994502191145?text=Salam%2C%20kirayeal.az-da%20reklam%20yerl%C9%99%C5%9Fdirm%C9%99k%20ist%C9%99yir%C9%99m','side',false,90,'image'),
 ('00000000-0000-4000-8000-0000000b0003','Nümunə video: Reklamınız burada ola bilər (ana səhifə)','/banners/sample-wide.mp4','https://wa.me/994502191145?text=Salam%2C%20kirayeal.az-da%20reklam%20yerl%C9%99%C5%9Fdirm%C9%99k%20ist%C9%99yir%C9%99m','home',false,90,'video'),
 ('00000000-0000-4000-8000-0000000b0004','Nümunə: Reklamınız burada ola bilər (elan səhifəsi)','/banners/sample-wide.jpg','https://wa.me/994502191145?text=Salam%2C%20kirayeal.az-da%20reklam%20yerl%C9%99%C5%9Fdirm%C9%99k%20ist%C9%99yir%C9%99m','listing',false,90,'image')
on conflict (id) do nothing;
