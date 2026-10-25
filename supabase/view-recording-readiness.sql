-- Apply after public-marketplace.sql. Operator enables recording only after
-- the service credential and proxy/owner checks have been verified live.
begin;
create table if not exists public.site_runtime_features (
 feature text primary key,enabled boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.site_runtime_features enable row level security;
revoke all on public.site_runtime_features from public,anon,authenticated,service_role;
insert into public.site_runtime_features(feature,enabled) values('listing_views',false) on conflict do nothing;
create or replace function public.listing_view_recording_ready() returns boolean
language sql stable security definer set search_path='' as $$
 select coalesce((select enabled from public.site_runtime_features where feature='listing_views'),false);
$$;
revoke all on function public.listing_view_recording_ready() from public;
grant execute on function public.listing_view_recording_ready() to anon,authenticated,service_role;
create or replace function public.own_listing_view_counts()
returns table(listing_id uuid,views bigint) language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501';end if;
 if not public.listing_view_recording_ready() then raise exception 'VIEW_RECORDING_NOT_READY' using errcode='55000';end if;
 return query select l.id,count(v.listing_id) from public.listings l left join public.listing_views v on v.listing_id=l.id where l.owner_id=auth.uid() group by l.id;
end $$;
revoke all on function public.own_listing_view_counts() from public,anon;
grant execute on function public.own_listing_view_counts() to authenticated;
create or replace function public.public_listing_info(p_listing_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare ad public.listings;result jsonb;
begin
 select * into ad from public.listings where id=p_listing_id and status='published' and coalesce(expires_at,first_published_at+interval '30 days',created_at+interval '30 days')>now();
 if ad.id is null then return null;end if;
 result:=jsonb_build_object('seller_name',coalesce(nullif(trim(ad.attributes->>'contact_name'),''),(select display_name from public.profiles where id=ad.owner_id),'Elan sahibi'));
 if public.listing_view_recording_ready() then result:=result||jsonb_build_object('views',(select count(*) from public.listing_views where listing_id=ad.id));end if;
 return result;
end $$;
revoke all on function public.public_listing_info(uuid) from public;
grant execute on function public.public_listing_info(uuid) to anon,authenticated;
-- This legacy writer becomes internal-only. The checked writer is service-only.
revoke all on function public.record_listing_view(uuid,text) from public,anon,authenticated,service_role;
create or replace function public.record_listing_view_checked(p_listing_id uuid,p_visitor_hash text,p_viewer_id uuid default null)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if not public.listing_view_recording_ready() then return false;end if;
 if p_viewer_id is not null and exists(select 1 from public.listings where id=p_listing_id and owner_id=p_viewer_id) then return false;end if;
 return public.record_listing_view(p_listing_id,p_visitor_hash);
end $$;
revoke all on function public.record_listing_view_checked(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.record_listing_view_checked(uuid,text,uuid) to service_role;
notify pgrst,'reload schema';
commit;