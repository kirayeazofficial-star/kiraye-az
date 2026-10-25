-- After public-marketplace.sql. Existing sole-admin leader bootstrap is in admin-management.sql.
-- Read-only history and leader-only account lookup; does not enable payments.
begin;
create or replace function public.leader_find_account(p_query text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare value text:=lower(trim(p_query)); digits text; target uuid; matches integer; result jsonb;
begin
 if not public.is_leader() then raise exception 'Leader only' using errcode='42501';end if;
 if length(value)>254 or length(value)<3 then raise exception 'Invalid lookup';end if;
 select p.id into target from public.profiles p join auth.users u on u.id=p.id
 where lower(u.email)=value or p.id::text=value or p.profile_no::text=value limit 1;
 if target is null then
  digits:=regexp_replace(value,'[^0-9]','','g');
  if value ~ '^[+0-9 ()-]+$' and (digits ~ '^994[0-9]{9}$' or digits ~ '^0[0-9]{9}$' or digits ~ '^[0-9]{9}$') then
   select count(*),min(p.id::text)::uuid into matches,target from public.profiles p
   where right(regexp_replace(p.phone,'[^0-9]','','g'),9)=right(digits,9);
   if matches>1 then raise exception 'Multiple accounts use this phone. Use account ID or email.' using errcode='21000';end if;
  end if;
 end if;
 select jsonb_build_object('id',p.id,'profile_no',p.profile_no,'phone',p.phone,'name',p.display_name,'email',u.email,
 'confirmed',coalesce(to_jsonb(u)->>'email_confirmed_at','')<>'','role',coalesce(s.staff_role,case when p.role='admin' then 'moderator' else 'user' end)) into result
 from public.profiles p join auth.users u on u.id=p.id left join public.staff_members s on s.user_id=p.id where p.id=target;
 return result;
end; $$;
revoke all on function public.leader_find_account(text) from public;
grant execute on function public.leader_find_account(text) to authenticated;
create or replace function public.admin_moderation_history_page(p_before bigint default null) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare records jsonb; cursor_id bigint;
begin
 if not public.is_admin() then raise exception 'Admin only' using errcode='42501';end if;
 select coalesce(jsonb_agg(to_jsonb(e)),'[]') into records from (
 select ev.*,p.display_name as actor_name from public.moderation_events ev left join public.profiles p on p.id=ev.actor_id
 where p_before is null or ev.id<p_before order by ev.id desc limit 25) e;
 if jsonb_array_length(records)=25 then cursor_id:=(records->24->>'id')::bigint;end if;
 return jsonb_build_object('events',records,'next',cursor_id::text);
end; $$;
revoke all on function public.admin_moderation_history_page(bigint) from public;
grant execute on function public.admin_moderation_history_page(bigint) to authenticated;
create or replace function public.leader_staff_directory() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.is_leader() then raise exception 'Leader only' using errcode='42501'; end if;
 return jsonb_build_object('members',(select coalesce(jsonb_agg(to_jsonb(m)),'[]') from (
  select p.id,p.profile_no,p.phone,p.display_name as name,u.email,coalesce(s.staff_role,'moderator') as role,s.assigned_at,s.assigned_by
  from public.profiles p join auth.users u on u.id=p.id left join public.staff_members s on s.user_id=p.id
  where p.role='admin' order by (s.staff_role='leader') desc nulls last,p.id limit 100) m),
 'events',(select coalesce(jsonb_agg(to_jsonb(e)),'[]') from (select * from public.staff_events order by id desc limit 50) e));
end; $$;
revoke all on function public.leader_staff_directory() from public;
grant execute on function public.leader_staff_directory() to authenticated;


create or replace function public.leader_staff_history_page(p_before bigint default null) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare records jsonb;
begin
 if not public.is_leader() then raise exception 'Leader only' using errcode='42501';end if;
 select coalesce(jsonb_agg(to_jsonb(e)),'[]') into records from (select * from public.staff_events where p_before is null or id<p_before order by id desc limit 25) e;
 return jsonb_build_object('events',records,'next',case when jsonb_array_length(records)=25 then records->24->>'id' else null end);
end; $$;
revoke all on function public.leader_staff_history_page(bigint) from public;
grant execute on function public.leader_staff_history_page(bigint) to authenticated;

-- Refresh the cached RPC schema after commit.
notify pgrst, 'reload schema';
commit;
