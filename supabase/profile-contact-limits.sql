-- Additive. No existing phone/email/listing is rewritten. Back up Auth and Storage first.
begin;
create table if not exists public.profile_contact_changes (
 user_id uuid primary key references auth.users(id) on delete cascade,
 phone_changes integer not null default 0 check(phone_changes between 0 and 3),
 email_changes integer not null default 0 check(email_changes between 0 and 3)
);
alter table public.profile_contact_changes enable row level security;
revoke all on public.profile_contact_changes from public,anon,authenticated,service_role;

create or replace function public.canonical_profile_phone(p_value text) returns text
language sql immutable set search_path='' as $$
 select case when p_value is null or trim(p_value)='' or p_value !~ '^[+0-9[:space:]()-]+$' then null
 when regexp_replace(p_value,'[^0-9]','','g') ~ '^994[0-9]{9}$' then '+'||regexp_replace(p_value,'[^0-9]','','g')
 when regexp_replace(p_value,'[^0-9]','','g') ~ '^0[0-9]{9}$' then '+994'||substr(regexp_replace(p_value,'[^0-9]','','g'),2)
 when regexp_replace(p_value,'[^0-9]','','g') ~ '^[0-9]{9}$' then '+994'||regexp_replace(p_value,'[^0-9]','','g') else null end;
$$;
revoke all on function public.canonical_profile_phone(text) from public,anon,authenticated;

create or replace function public.require_recent_profile_auth() returns void
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is not null and not exists(
 select 1 from jsonb_array_elements(case when jsonb_typeof(auth.jwt()->'amr')='array' then auth.jwt()->'amr' else '[]'::jsonb end) item
 where item->>'method' in('password','oauth','otp','email') and case when item->>'timestamp' ~ '^[0-9]{1,12}$'
 then (item->>'timestamp')::bigint between extract(epoch from now())::bigint-300 and extract(epoch from now())::bigint+60 else false end
 ) then raise exception 'Recent sign-in required' using errcode='PRA01';end if;
end $$;
revoke all on function public.require_recent_profile_auth() from public,anon,authenticated;

create or replace function public.enforce_profile_contact_changes() returns trigger
language plpgsql security definer set search_path='' as $$
declare value text;used integer;
begin
 if new.display_name is distinct from old.display_name and (length(coalesce(new.display_name,''))>100 or coalesce(trim(new.display_name),'') !~ '^[^[:space:]]+[[:space:]]+[^[:space:]].*$') then
 raise exception 'Full name required' using errcode='22023';end if;
 if new.phone is distinct from old.phone then
  value:=public.canonical_profile_phone(new.phone);
  if value is null then raise exception 'Valid primary phone required' using errcode='22023';end if;
  new.phone:=value;
  if value is distinct from public.canonical_profile_phone(old.phone) then
   perform public.require_recent_profile_auth();
   insert into public.profile_contact_changes(user_id) values(old.id) on conflict do nothing;
   select phone_changes into used from public.profile_contact_changes where user_id=old.id for update;
   if used>=3 then raise exception 'Phone change limit reached' using errcode='PCL03';end if;
   update public.profile_contact_changes set phone_changes=phone_changes+1 where user_id=old.id;
  end if;
 end if;
 return new;
end $$;
revoke all on function public.enforce_profile_contact_changes() from public,anon,authenticated;
drop trigger if exists enforce_profile_contact_changes on public.profiles;
create trigger enforce_profile_contact_changes before update on public.profiles for each row execute function public.enforce_profile_contact_changes();

create or replace function public.enforce_auth_email_change_limit() returns trigger
language plpgsql security definer set search_path='' as $$
declare changed boolean:=lower(new.email) is distinct from lower(old.email);pending text:=coalesce(to_jsonb(new)->>'email_change','');used integer;
begin
 -- Initial INSERT/registration is not a change. Pending requests never consume a change.
 if (changed and old.email is not null and old.email<>'') or (pending<>'' and lower(pending) is distinct from lower(old.email) and lower(pending) is distinct from lower(coalesce(to_jsonb(old)->>'email_change',''))) then
  insert into public.profile_contact_changes(user_id) values(old.id) on conflict do nothing;
  select email_changes into used from public.profile_contact_changes where user_id=old.id for update;
  if used>=3 then raise exception 'Email change limit reached' using errcode='PCL03';end if;
  if changed and new.email_confirmed_at is not null then
   update public.profile_contact_changes set email_changes=email_changes+1 where user_id=old.id;
  elsif changed then raise exception 'Confirm changed email first' using errcode='42501';end if;
 end if;
 return new;
end $$;
revoke all on function public.enforce_auth_email_change_limit() from public,anon,authenticated;
drop trigger if exists enforce_auth_email_change_limit on auth.users;
create trigger enforce_auth_email_change_limit before update on auth.users for each row execute function public.enforce_auth_email_change_limit();

create or replace function public.own_profile_contact_status() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=auth.uid();result jsonb;
begin
 if actor is null then raise exception 'Sign in required' using errcode='42501';end if;
 select jsonb_build_object('profile_no',p.profile_no,'name',p.display_name,'phone',p.phone,'email',u.email,
 'phone_changes',coalesce(c.phone_changes,0),'email_changes',coalesce(c.email_changes,0),
 'phone_remaining',3-coalesce(c.phone_changes,0),'email_remaining',3-coalesce(c.email_changes,0),
 'phone_verified',false,'pending_email',nullif(to_jsonb(u)->>'email_change','')) into result
 from public.profiles p join auth.users u on u.id=p.id left join public.profile_contact_changes c on c.user_id=p.id where p.id=actor;
 return result;
end $$;
revoke all on function public.own_profile_contact_status() from public,anon;
grant execute on function public.own_profile_contact_status() to authenticated;

create or replace function public.update_own_profile(p_name text,p_phone text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();value text:=public.canonical_profile_phone(p_phone);
begin
 if actor is null then raise exception 'Sign in required' using errcode='42501';end if;
 if value is null or length(coalesce(p_name,''))>100 or coalesce(trim(p_name),'') !~ '^[^[:space:]]+[[:space:]]+[^[:space:]].*$' then raise exception 'Valid name and primary phone required' using errcode='22023';end if;
 update public.profiles set display_name=trim(p_name),phone=value where id=actor;
 if not found then raise exception 'Profile not found' using errcode='22023';end if;
 return public.own_profile_contact_status();
end $$;
revoke all on function public.update_own_profile(text,text) from public,anon;
grant execute on function public.update_own_profile(text,text) to authenticated;

create or replace function public.enforce_primary_listing_phone() returns trigger
language plpgsql security definer set search_path='' as $$
declare value text;
begin
 if TG_OP='INSERT' or new.contact is distinct from old.contact then
  select public.canonical_profile_phone(phone) into value from public.profiles where id=new.owner_id;
  if value is null then raise exception 'Primary account phone required' using errcode='22023';end if;
  if TG_OP='UPDATE' and public.canonical_profile_phone(new.contact) is distinct from value then raise exception 'Use primary account phone' using errcode='42501';end if;
  new.contact:=value;
 end if;
 return new;
end $$;
revoke all on function public.enforce_primary_listing_phone() from public,anon,authenticated;
drop trigger if exists enforce_primary_listing_phone on public.listings;
create trigger enforce_primary_listing_phone before insert or update on public.listings for each row execute function public.enforce_primary_listing_phone();

create table if not exists public.profile_change_attempts(user_id uuid primary key references auth.users(id) on delete cascade,started_at timestamptz not null default now(),attempts integer not null default 0);
alter table public.profile_change_attempts enable row level security;
revoke all on public.profile_change_attempts from public,anon,authenticated,service_role;
create or replace function public.allow_profile_change_attempt(p_user_id uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare used integer;
begin
 insert into public.profile_change_attempts(user_id,attempts) values(p_user_id,1)
 on conflict(user_id) do update set attempts=case when profile_change_attempts.started_at<now()-interval '15 minutes' then 1 else profile_change_attempts.attempts+1 end,
 started_at=case when profile_change_attempts.started_at<now()-interval '15 minutes' then now() else profile_change_attempts.started_at end returning attempts into used;
 return used<=8;
end $$;
revoke all on function public.allow_profile_change_attempt(uuid) from public,anon,authenticated;
grant execute on function public.allow_profile_change_attempt(uuid) to service_role;
notify pgrst,'reload schema';
commit;
