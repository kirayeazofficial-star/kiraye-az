-- Apply after rental-features.sql, admin-moderation.sql, admin-management.sql.
-- No payment is enabled, no wallet entry, card or promotion is fabricated.
begin;
alter table public.profiles add column if not exists profile_no bigint generated always as identity (start with 30000001);
create unique index if not exists profiles_number_unique on public.profiles(profile_no);
alter table public.listings add column if not exists promotion_kind text check(promotion_kind in ('vip','premium'));
alter table public.listings add column if not exists promotion_until timestamptz;
create or replace function public.protect_marketplace_fields() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_TABLE_NAME='profiles' then
  if new.profile_no is distinct from old.profile_no then raise exception 'Profile number is immutable';end if;
 else
  if auth.uid() is not null then
   if TG_OP='INSERT' then
    if new.promotion_kind is not null or new.promotion_until is not null then raise exception 'Server-managed promotion' using errcode='42501';end if;
   elsif new.promotion_kind is distinct from old.promotion_kind or new.promotion_until is distinct from old.promotion_until then raise exception 'Server-managed promotion' using errcode='42501';end if;
  end if;
 end if;
 return new;
end; $$;
revoke all on function public.protect_marketplace_fields() from public;
drop trigger if exists protect_profile_number on public.profiles;
create trigger protect_profile_number before update on public.profiles for each row execute function public.protect_marketplace_fields();
drop trigger if exists protect_listing_promotion on public.listings;
create trigger protect_listing_promotion before insert or update on public.listings for each row execute function public.protect_marketplace_fields();
create or replace function public.public_listing_info(p_listing_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare ad public.listings;
begin
 select * into ad from public.listings where id=p_listing_id and status='published' and coalesce(expires_at,first_published_at+interval '30 days',created_at+interval '30 days')>now();
 if ad.id is null then return null;end if;
 return jsonb_build_object('seller_name',coalesce(nullif(trim(ad.attributes->>'contact_name'),''),(select display_name from public.profiles where id=ad.owner_id),'Elan sahibi'),
 'views',(select count(*) from public.listing_views where listing_id=ad.id));
end; $$;
revoke all on function public.public_listing_info(uuid) from public;
grant execute on function public.public_listing_info(uuid) to anon,authenticated;
create table if not exists public.wallet_entries (
 id bigint generated always as identity primary key,owner_id uuid not null references auth.users(id),
 amount numeric(12,2) not null check(amount<>0),currency text not null default 'AZN' check(currency='AZN'),
 kind text not null check(kind in ('topup','promotion','refund')),
 provider_reference text not null unique,memo text,created_at timestamptz not null default now(),
 check((kind in ('topup','refund') and amount>0) or (kind='promotion' and amount<0))
);
alter table public.wallet_entries enable row level security;
revoke all on public.wallet_entries from public,anon,authenticated;
create or replace function public.own_wallet_summary() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501';end if;
 return jsonb_build_object('balance',coalesce((select sum(amount) from public.wallet_entries where owner_id=auth.uid()),0),'currency','AZN');
end; $$;
create or replace function public.own_wallet_activity(p_before bigint default null) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare entries jsonb;
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501';end if;
 select coalesce(jsonb_agg(to_jsonb(e)),'[]') into entries from (select id,amount,currency,kind,memo,created_at from public.wallet_entries where owner_id=auth.uid() and (p_before is null or id<p_before) order by id desc limit 25) e;
 return jsonb_build_object('entries',entries,'next',case when jsonb_array_length(entries)=25 then entries->24->>'id' else null end);
end; $$;
revoke all on function public.own_wallet_summary() from public;
revoke all on function public.own_wallet_activity(bigint) from public;
grant execute on function public.own_wallet_summary() to authenticated;
grant execute on function public.own_wallet_activity(bigint) to authenticated;
-- The leader may look up the new numeric account number too.
create or replace function public.leader_find_account(p_query text) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb; value text:=lower(trim(p_query));begin
 if not public.is_leader() then raise exception 'Leader only' using errcode='42501';end if;
 if length(value)>254 or length(value)<3 then raise exception 'Invalid lookup';end if;
 select jsonb_build_object('id',p.id,'profile_no',p.profile_no,'name',p.display_name,'email',u.email,'confirmed',coalesce(to_jsonb(u)->>'email_confirmed_at','')<>'','role',coalesce(s.staff_role,case when p.role='admin' then 'moderator' else 'user' end)) into result from public.profiles p join auth.users u on u.id=p.id left join public.staff_members s on s.user_id=p.id where lower(u.email)=value or p.id::text=value or p.profile_no::text=value limit 1;
 return result;end; $$;
commit;
