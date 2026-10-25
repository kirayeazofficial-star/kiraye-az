-- Apply after admin-moderation.sql and lifecycle/paid-restoration migrations.
-- Back up first. DDL assigns reference numbers to existing rows without editing
-- their content/timestamps or manufacturing historical moderation events.
begin;
alter table public.listings add column if not exists listing_no bigint generated always as identity (start with 10000001);
alter table public.listing_reports add column if not exists report_no bigint generated always as identity (start with 20000001);
alter table public.listings add column if not exists review_kind text not null default 'new' check(review_kind in ('new','edited'));
create unique index if not exists listings_number_unique on public.listings(listing_no);
create unique index if not exists reports_number_unique on public.listing_reports(report_no);
alter table public.listing_reports add column if not exists resolved_at timestamptz;
alter table public.listing_reports add column if not exists resolved_by uuid;

create table if not exists public.staff_members (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 staff_role text not null check(staff_role in ('leader','moderator')),
 assigned_at timestamptz not null default now(), assigned_by uuid
);
alter table public.staff_members enable row level security;
revoke all on public.staff_members from public,anon,authenticated;
create table if not exists public.staff_events (
 id bigint generated always as identity primary key, actor_id uuid,
 target_id uuid not null, action text not null, created_at timestamptz not null default now()
);
alter table public.staff_events enable row level security;
revoke all on public.staff_events from public,anon,authenticated;

create or replace function public.is_leader() returns boolean
language sql stable security definer set search_path='' as $$
 select public.is_admin() and exists(select 1 from public.staff_members where user_id=auth.uid() and staff_role='leader');
$$;
revoke all on function public.is_leader() from public;
grant execute on function public.is_leader() to authenticated;

-- Browser profile writes still cannot grant/revoke any role. A trusted definer
-- owned by the profiles table owner can perform the explicitly guarded RPC.
create or replace function public.protect_profile_role() returns trigger
language plpgsql set search_path='' as $$
begin
 if auth.uid() is not null and current_user<>pg_catalog.pg_get_userbyid((select relowner from pg_catalog.pg_class where oid='public.profiles'::regclass)) then
  if TG_OP='INSERT' and new.role<>'user' then raise exception 'Role cannot be assigned by a client' using errcode='42501'; end if;
  if TG_OP='UPDATE' and (new.role is distinct from old.role or new.id is distinct from old.id) then raise exception 'Role and identity cannot be changed by a client' using errcode='42501'; end if;
 end if;
 return new;
end; $$;

create or replace function public.admin_current_access() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare staff text;
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
 if not public.is_admin() then return jsonb_build_object('role','user','allowed',false); end if;
 select staff_role into staff from public.staff_members where user_id=auth.uid();
 return jsonb_build_object('role',coalesce(staff,'moderator'),'allowed',true);
end; $$;
revoke all on function public.admin_current_access() from public;
grant execute on function public.admin_current_access() to authenticated;

-- Initial leader can ONLY be bootstrapped by an authorized SQL administrator.
-- Never auto-select by screen name or promote an arbitrary existing admin.
create or replace function public.bootstrap_staff_leader(p_user_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform pg_catalog.pg_advisory_xact_lock(734291);
 if exists(select 1 from public.staff_members where staff_role='leader') then raise exception 'Leader already configured'; end if;
 if not exists(select 1 from public.profiles where id=p_user_id and role='admin') then raise exception 'Verify the existing admin UUID first'; end if;
 insert into public.staff_members(user_id,staff_role,assigned_by) values(p_user_id,'leader',p_user_id);
 insert into public.staff_events(actor_id,target_id,action) values(null,p_user_id,'leader_initialized');
end; $$;
revoke all on function public.bootstrap_staff_leader(uuid) from public,anon,authenticated;
-- User authorized the currently sole existing admin as the initial leader.
do $$ declare chosen uuid; admins bigint; begin
 perform pg_catalog.pg_advisory_xact_lock(734291);
 if not exists(select 1 from public.staff_members where staff_role='leader') then
  select count(*) into admins from public.profiles where role='admin';
  if admins=1 then select id into chosen from public.profiles where role='admin';perform public.bootstrap_staff_leader(chosen);
  else raise notice 'Leader not assigned: expected exactly one existing admin, found %',admins; end if;
 end if;
end $$;


create or replace function public.leader_find_account(p_query text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb; value text:=lower(trim(p_query));
begin
 if not public.is_leader() then raise exception 'Leader only' using errcode='42501'; end if;
 if length(value)>254 or length(value)<3 then raise exception 'Invalid account lookup'; end if;
 select jsonb_build_object('id',p.id,'name',p.display_name,'email',u.email,
 'confirmed',coalesce(to_jsonb(u)->>'email_confirmed_at','')<>'',
 'role',coalesce(s.staff_role,case when p.role='admin' then 'moderator' else 'user' end)) into result
 from public.profiles p join auth.users u on u.id=p.id left join public.staff_members s on s.user_id=p.id
 where lower(u.email)=value or p.id::text=value limit 1;
 return result;
end; $$;
revoke all on function public.leader_find_account(text) from public;
grant execute on function public.leader_find_account(text) to authenticated;

create or replace function public.leader_set_moderator(p_user_id uuid,p_enabled boolean) returns void
language plpgsql security definer set search_path='' as $$
declare was_admin boolean;
begin
 perform pg_catalog.pg_advisory_xact_lock(734291);
 if not public.is_leader() then raise exception 'Leader only' using errcode='42501'; end if;
 if exists(select 1 from public.staff_members where user_id=p_user_id and staff_role='leader') then raise exception 'Leader role cannot be removed here' using errcode='42501'; end if;
 select role='admin' into was_admin from public.profiles where id=p_user_id for update;
 if was_admin is null then raise exception 'Account not found'; end if;
 if p_enabled is null then raise exception 'Choose grant or revoke';end if;
 if p_enabled and not exists(select 1 from auth.users u where u.id=p_user_id and coalesce(to_jsonb(u)->>'email_confirmed_at','')<>'') then raise exception 'Confirm the account email first'; end if;
 if p_enabled then
  insert into public.staff_members(user_id,staff_role,assigned_by) values(p_user_id,'moderator',auth.uid()) on conflict(user_id) do update set staff_role='moderator',assigned_by=auth.uid(),assigned_at=now();
  update public.profiles set role='admin' where id=p_user_id;
 else
  delete from public.staff_members where user_id=p_user_id;
  update public.profiles set role='user' where id=p_user_id;
 end if;
 if was_admin is distinct from p_enabled then
  insert into public.staff_events(actor_id,target_id,action) values(auth.uid(),p_user_id,case when p_enabled then 'moderator_granted' else 'moderator_revoked' end);
 end if;
end; $$;
revoke all on function public.leader_set_moderator(uuid,boolean) from public;
grant execute on function public.leader_set_moderator(uuid,boolean) to authenticated;

create or replace function public.leader_staff_directory() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.is_leader() then raise exception 'Leader only' using errcode='42501'; end if;
 return jsonb_build_object('members',(select coalesce(jsonb_agg(to_jsonb(m)),'[]') from (
  select p.id,p.display_name as name,u.email,coalesce(s.staff_role,'moderator') as role,s.assigned_at,s.assigned_by
  from public.profiles p join auth.users u on u.id=p.id left join public.staff_members s on s.user_id=p.id
  where p.role='admin' order by (s.staff_role='leader') desc nulls last,p.id limit 100) m),
 'events',(select coalesce(jsonb_agg(to_jsonb(e)),'[]') from (select * from public.staff_events order by created_at desc,id desc limit 50) e));
end; $$;
revoke all on function public.leader_staff_directory() from public;
grant execute on function public.leader_staff_directory() to authenticated;

create or replace function public.protect_listing_number() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='INSERT' then new.review_kind:='new';return new;end if;
 new.review_kind:=old.review_kind;
 if old.status='published' and new.status='pending' and public.moderation_snapshot(old) is distinct from public.moderation_snapshot(new) then new.review_kind:='edited';end if;
 if new.listing_no is distinct from old.listing_no then raise exception 'Listing number is immutable'; end if;
 return new;
end; $$;
drop trigger if exists protect_listing_number on public.listings;
create trigger protect_listing_number before insert or update on public.listings for each row execute function public.protect_listing_number();

create or replace function public.protect_report_resolution() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='INSERT' then new.resolved_at:=null;new.resolved_by:=null;if auth.uid() is not null then new.created_at:=now();end if; return new; end if;
 if new.id is distinct from old.id or new.report_no is distinct from old.report_no
  or new.reporter_id is distinct from old.reporter_id or new.listing_id is distinct from old.listing_id
  or new.created_at is distinct from old.created_at or new.reason is distinct from old.reason or new.message is distinct from old.message then raise exception 'Report identity/content cannot be changed'; end if;
 if old.status='resolved' and new.status<>'resolved' then raise exception 'Resolved report is archived'; end if;
 new.resolved_at:=old.resolved_at;new.resolved_by:=old.resolved_by;
 if old.status='open' and new.status='resolved' then
  if auth.uid() is not null and not public.is_admin() then raise exception 'Admin only' using errcode='42501'; end if;
  new.resolved_at:=now();new.resolved_by:=auth.uid();
  insert into public.staff_events(actor_id,target_id,action) values(auth.uid(),new.id,'report_resolved');
 end if;
 return new;
end; $$;
revoke all on function public.protect_listing_number() from public;
revoke all on function public.protect_report_resolution() from public;
drop trigger if exists protect_report_resolution on public.listing_reports;
create trigger protect_report_resolution before insert or update on public.listing_reports for each row execute function public.protect_report_resolution();
commit;
