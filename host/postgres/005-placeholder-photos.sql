-- Existing listings carried photos with old baked-in marks; replace with category placeholders until real photos are added.
begin;
update public.listings
   set images = array['/placeholders/' || category || '.svg']
 where category in ('property','car','motorcycle','villa','commercial','equipment','clothing','electric','photo','camping','bicycle','event');
commit;
