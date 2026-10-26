-- Source database scheduler during the transition. No network credential is stored.
-- Host-only migration must recreate this job in its verified target scheduler.
begin;
create extension if not exists pg_cron with schema pg_catalog;
do $$
declare existing record;
begin
 select * into existing from cron.job where jobname='kirayeal-expire-listings';
 if found and (existing.command<>'SELECT public.expire_listings();' or existing.schedule<>'* * * * *' or not existing.active) then
  raise exception 'Inspect the existing kirayeal expiry job before changing it';
 elsif not found then
  perform cron.schedule('kirayeal-expire-listings','* * * * *','SELECT public.expire_listings();');
 end if;
end $$;
commit;