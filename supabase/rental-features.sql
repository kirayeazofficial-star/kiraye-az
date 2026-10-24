-- Additive migration. Back up first; run after schema.sql on the live database.
begin;
alter table public.listings drop constraint if exists listings_rental_period_check;
alter table public.listings add constraint listings_rental_period_check check(rental_period in ('daily','weekly','monthly'));
create or replace function public.rental_features_ready() returns boolean language sql stable set search_path=public as $$select true$$;
revoke all on function public.rental_features_ready() from public;
grant execute on function public.rental_features_ready() to anon,authenticated;

-- Anonymous visitor fingerprints are daily salted hashes generated on the server.
-- No IP addresses or contact details are persisted. No public read/write policy.
create table if not exists public.listing_views (
 listing_id uuid not null references public.listings(id) on delete cascade,
 view_day date not null default (now() at time zone 'UTC')::date,
 visitor_hash text not null check(visitor_hash ~ '^[a-f0-9]{64}$'),
 primary key(listing_id,view_day,visitor_hash)
);
alter table public.listing_views enable row level security;
revoke all on public.listing_views from public,anon,authenticated;
create or replace function public.record_listing_view(p_listing_id uuid,p_visitor_hash text)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if p_visitor_hash is null or p_visitor_hash !~ '^[a-f0-9]{64}$' then return false;end if;
 if not exists(select 1 from public.listings l where l.id=p_listing_id and l.status='published'
   and coalesce((to_jsonb(l)->>'expires_at')::timestamptz,'infinity'::timestamptz)>now()) then return false;end if;
 insert into public.listing_views(listing_id,visitor_hash) values(p_listing_id,p_visitor_hash) on conflict do nothing;
 return true;
end $$;
revoke all on function public.record_listing_view(uuid,text) from public,anon,authenticated;
grant execute on function public.record_listing_view(uuid,text) to service_role;
create or replace function public.own_listing_view_counts()
returns table(listing_id uuid,views bigint) language sql stable security definer set search_path=public,pg_temp as $$
 select l.id,count(v.listing_id) from public.listings l left join public.listing_views v on v.listing_id=l.id
 where l.owner_id=auth.uid() group by l.id;
$$;
revoke all on function public.own_listing_view_counts() from public,anon;
grant execute on function public.own_listing_view_counts() to authenticated;
commit;
