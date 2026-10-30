-- Clearer, more professional WhatsApp message for the sample adverts' contact link, and redesigned sample files.
update public.banners set link_url='https://wa.me/994502191145?text=Salam%21%0A%0Akirayeal.az%20sayt%C4%B1nda%20reklam%20yerl%C9%99%C5%9Fdirm%C9%99k%20bar%C9%99d%C9%99%20m%C9%99lumat%20almaq%20ist%C9%99rdim.%0AZ%C9%99hm%C9%99t%20olmasa%2C%20m%C3%B6vcud%20reklam%20yerl%C9%99ri%2C%20qiym%C9%99tl%C9%99r%20v%C9%99%20%C5%9F%C9%99rtl%C9%99r%20haqq%C4%B1nda%20m%C9%99lumat%20verin.%20%F0%9F%A4%9D' where id in ('00000000-0000-4000-8000-0000000b0001','00000000-0000-4000-8000-0000000b0002','00000000-0000-4000-8000-0000000b0003','00000000-0000-4000-8000-0000000b0004');
-- Redesigned sample adverts (new file names so browsers don't show cached old versions).
update public.banners set image_url='/banners/sample-top-v2.mp4' where id='00000000-0000-4000-8000-0000000b0001';
update public.banners set image_url='/banners/sample-side-v2.jpg' where id='00000000-0000-4000-8000-0000000b0002';
update public.banners set image_url='/banners/sample-home-v2.mp4' where id='00000000-0000-4000-8000-0000000b0003';
update public.banners set image_url='/banners/sample-listing-v2.mp4' where id='00000000-0000-4000-8000-0000000b0004';
