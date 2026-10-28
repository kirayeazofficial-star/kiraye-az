-- Imported listings follow the same 30-day term as new listings.
begin;
update public.listings
   set expires_at = now() + interval '30 days'
 where status = 'published'
   and (expires_at is null or expires_at > now() + interval '30 days');
commit;
