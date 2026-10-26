-- Additive RPC changes after admin-panel-refinements.sql and listing-lifecycle.sql.
-- No existing account, listing, image or staff record is rewritten.
begin;
create or replace function public.leader_find_account(p_query text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare value text:=trim(p_query);result jsonb;
begin
 if not public.is_leader() then raise exception 'Leader only' using errcode='42501';end if;
 if value is null or value !~ '^[1-9][0-9]{0,17}$' then raise exception 'Numeric account ID required' using errcode='22023';end if;
 select jsonb_build_object('id',p.id,'profile_no',p.profile_no,'phone',p.phone,'name',p.display_name,'email',u.email,
 'confirmed',u.email_confirmed_at is not null,'role',coalesce(s.staff_role,case when p.role='admin' then 'moderator' else 'user' end)) into result
 from public.profiles p join auth.users u on u.id=p.id left join public.staff_members s on s.user_id=p.id where p.profile_no=value::bigint;
 return result;
end $$;
revoke all on function public.leader_find_account(text) from public,anon;
grant execute on function public.leader_find_account(text) to authenticated;

create or replace function public.leader_set_moderator_by_number(p_profile_no bigint,p_enabled boolean) returns void
language plpgsql security definer set search_path='' as $$
declare target uuid;
begin
 if not public.is_leader() then raise exception 'Leader only' using errcode='42501';end if;
 if p_profile_no is null or p_profile_no<1 then raise exception 'Numeric account ID required' using errcode='22023';end if;
 select id into target from public.profiles where profile_no=p_profile_no;
 if target is null then raise exception 'Account not found' using errcode='22023';end if;
 perform public.leader_set_moderator(target,p_enabled);
end $$;
revoke all on function public.leader_set_moderator_by_number(bigint,boolean) from public,anon;
grant execute on function public.leader_set_moderator_by_number(bigint,boolean) to authenticated;
revoke all on function public.leader_set_moderator(uuid,boolean) from public,anon,authenticated;

create or replace function public.leader_staff_directory() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.is_leader() then raise exception 'Leader only' using errcode='42501';end if;
 return jsonb_build_object('members',(select coalesce(jsonb_agg(to_jsonb(m)),'[]'::jsonb) from (
 select p.id,p.profile_no,p.phone,p.display_name as name,u.email,coalesce(s.staff_role,'moderator') as role,s.assigned_at,s.assigned_by
 from public.profiles p join auth.users u on u.id=p.id left join public.staff_members s on s.user_id=p.id
 where p.role='admin' order by (s.staff_role='leader') desc nulls last,p.id limit 100)m),
 'events',(select coalesce(jsonb_agg(to_jsonb(e)),'[]'::jsonb) from (select * from public.staff_events order by created_at desc,id desc limit 50)e));
end $$;
revoke all on function public.leader_staff_directory() from public,anon;
grant execute on function public.leader_staff_directory() to authenticated;

create or replace function public.own_listing_limits() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=auth.uid();result jsonb;exempt boolean;
begin
 if actor is null then raise exception 'Sign in required' using errcode='42501';end if;
 select role='admin' into exempt from public.profiles where id=actor;
 select coalesce(jsonb_agg(jsonb_build_object('category',q.category,'active_limit',q.active_limit,'period_limit',q.period_limit,
 'active_used',q.active_used,'period_used',q.period_used,'active_remaining',greatest(q.active_limit-q.active_used,0),
 'period_remaining',greatest(q.period_limit-q.period_used,0),'next_release_at',q.next_release_at,'exempt',coalesce(exempt,false)) order by q.category),'[]'::jsonb)
 into result from (select lim.*,
 (select count(*) from public.listings l where l.owner_id=actor and l.category=lim.category and l.status='published' and l.expires_at>now()) as active_used,
 (select count(*) from public.listing_cycle_usage u where u.owner_id=actor and u.category=lim.category and u.started_at>now()-interval '30 days') as period_used,
 (select min(u.started_at)+interval '30 days' from public.listing_cycle_usage u where u.owner_id=actor and u.category=lim.category and u.started_at>now()-interval '30 days') as next_release_at
 from public.listing_category_limits lim)q;
 return result;
end $$;
revoke all on function public.own_listing_limits() from public,anon;
grant execute on function public.own_listing_limits() to authenticated;
notify pgrst,'reload schema';
commit;
