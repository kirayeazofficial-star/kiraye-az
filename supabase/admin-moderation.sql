-- Apply after schema, lifecycle and paid-restoration migrations. Repeatable.
-- No fabricated historical approvals. Records begin when this migration is applied.
begin;
create table if not exists public.moderation_events (
 id bigint generated always as identity primary key,
 listing_id uuid not null, owner_id uuid not null, actor_id uuid,
 actor_kind text not null check(actor_kind in ('admin','owner','system')),
 action text not null, old_status text, new_status text,
 changed_fields text[] not null default '{}',
 before_values jsonb, after_values jsonb,
 reason text, created_at timestamptz not null default now()
);
create index if not exists moderation_events_listing_date on public.moderation_events(listing_id,created_at desc,id desc);
create index if not exists moderation_events_date on public.moderation_events(created_at desc,id desc);
alter table public.moderation_events enable row level security;
revoke all on public.moderation_events from public,anon,authenticated;
-- No client INSERT/UPDATE/DELETE grants or policies. Only the trigger writes.

create or replace function public.moderation_snapshot(ad public.listings) returns jsonb
language sql immutable set search_path='' as $$
 select jsonb_build_object('title',ad.title,'description',ad.description,'category',ad.category,
 'city',ad.city,'district',ad.district,'price',ad.price,'rental_period',ad.rental_period,
 'contact',ad.contact,'images',ad.images,'attributes',ad.attributes,'deposit',ad.deposit,
 'min_days',ad.min_days,'rooms',ad.rooms,'area_m2',ad.area_m2,
 'available_from',ad.available_from,'available_until',ad.available_until);
$$;
revoke all on function public.moderation_snapshot(public.listings) from public;

-- Alphabetically before existing validators, including lifecycle/paid-restoration.
-- Never turns an expired/archived listing into pending, never extends its dates.
create or replace function public.recheck_changed_listing() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if old.status='published' and new.status in ('published','pending')
  and public.moderation_snapshot(old) is distinct from public.moderation_snapshot(new) then
  new.status:='pending'; new.rejection_reason:=null;
 end if;
 return new;
end; $$;
revoke all on function public.recheck_changed_listing() from public;
drop trigger if exists a_recheck_changed_listing on public.listings;
create trigger a_recheck_changed_listing before update on public.listings for each row execute function public.recheck_changed_listing();

create or replace function public.record_moderation_event() returns trigger
language plpgsql security definer set search_path='' as $$
declare b jsonb; a jsonb; fields text[]; previous text; next_status text; kind text; event text; ad public.listings;
begin
 if TG_OP<>'INSERT' then b:=public.moderation_snapshot(old); previous:=old.status; end if;
 if TG_OP<>'DELETE' then a:=public.moderation_snapshot(new); next_status:=new.status; ad:=new; else ad:=old; end if;
 select coalesce(array_agg(k order by k),'{}') into fields
 from jsonb_object_keys(coalesce(a,b,'{}'::jsonb)) k where b->k is distinct from a->k;
 if TG_OP='UPDATE' and cardinality(fields)=0 and previous is not distinct from next_status
  and old.rejection_reason is not distinct from new.rejection_reason then return new; end if;
 kind:=case when auth.uid() is null then 'system' when public.is_admin() then 'admin' else 'owner' end;
 event:=case when TG_OP='INSERT' then 'submitted' when TG_OP='DELETE' then 'deleted'
 when previous='published' and next_status='pending' and cardinality(fields)>0 then 'resubmitted'
 when next_status='published' and previous is distinct from next_status then 'approved'
 when next_status='rejected' and previous is distinct from next_status then 'rejected'
 when previous is distinct from next_status then 'status_changed' else 'edited' end;
 insert into public.moderation_events(listing_id,owner_id,actor_id,actor_kind,action,old_status,new_status,changed_fields,before_values,after_values,reason)
 values(ad.id,ad.owner_id,auth.uid(),kind,event,previous,next_status,fields,b,a,ad.rejection_reason);
 if TG_OP='DELETE' then return old; end if; return new;
end; $$;
revoke all on function public.record_moderation_event() from public;
drop trigger if exists record_moderation_event on public.listings;
create trigger record_moderation_event after insert or update or delete on public.listings for each row execute function public.record_moderation_event();

-- Private normalized text comparison; does not label anyone a fraudster.
create or replace function public.moderation_text(value text) returns text
language sql immutable set search_path='' as $$
 select regexp_replace(translate(lower(coalesce(value,'')),'əıöüşçğ','eiouscg'),'[^a-z0-9]+',' ','g');
$$;
revoke all on function public.moderation_text(text) from public;
create or replace function public.admin_listing_context(p_listing_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare ad public.listings; result jsonb;
begin
 if not public.is_admin() then raise exception 'Admin only' using errcode='42501'; end if;
 select * into ad from public.listings where id=p_listing_id;
 if ad.id is null then raise exception 'Not found' using errcode='P0002'; end if;
 select jsonb_build_object(
 'owner',jsonb_build_object('id',p.id,'name',p.display_name,'joined_at',coalesce((to_jsonb(u)->>'created_at')::timestamptz,p.created_at)),
 'owner_listings',(select coalesce(jsonb_agg(to_jsonb(l)),'[]') from
  (select id,title,status,rejection_reason,created_at from public.listings where owner_id=ad.owner_id order by created_at desc,id desc limit 20) l),
 'reports',jsonb_build_object('open',(select count(*) from public.listing_reports r join public.listings l on l.id=r.listing_id where l.owner_id=ad.owner_id and r.status='open'),
 'resolved',(select count(*) from public.listing_reports r join public.listings l on l.id=r.listing_id where l.owner_id=ad.owner_id and r.status='resolved')),
 'events',(select coalesce(jsonb_agg(to_jsonb(e)),'[]') from
  (select ev.*,actor.display_name as actor_name from public.moderation_events ev left join public.profiles actor on actor.id=ev.actor_id
   where ev.listing_id=ad.id order by ev.created_at desc,ev.id desc limit 10) e),
 'signals',(select coalesce(jsonb_agg(to_jsonb(s)),'[]') from (select * from (
  select l.id,l.title,l.owner_id,l.status,
   right(regexp_replace(coalesce(l.contact,''),'[^0-9]','','g'),9)=right(regexp_replace(coalesce(ad.contact,''),'[^0-9]','','g'),9) and length(regexp_replace(coalesce(ad.contact,''),'[^0-9]','','g'))>=9 as same_phone,
   l.images && ad.images as same_image,
   l.category=ad.category and (
    trim(public.moderation_text(l.title))=trim(public.moderation_text(ad.title))
    or (length(coalesce(ad.description,''))>=40 and trim(public.moderation_text(l.description))=trim(public.moderation_text(ad.description)))
    or (select count(distinct w) from unnest(string_to_array(public.moderation_text(ad.title),' ')) w
       where length(w)>=4 and w=any(string_to_array(public.moderation_text(l.title),' ')))>=greatest(3,
       (select count(distinct w)*0.6 from unnest(string_to_array(public.moderation_text(ad.title),' ')) w where length(w)>=4))
   ) as similar_text
  from (select * from public.listings where id<>ad.id and created_at>now()-interval '180 days' order by created_at desc,id desc limit 500) l
 ) candidates where candidates.same_phone or candidates.same_image or candidates.similar_text limit 8) s)
 ) into result from public.profiles p left join auth.users u on u.id=p.id where p.id=ad.owner_id;
 return result;
end; $$;
revoke all on function public.admin_listing_context(uuid) from public;
grant execute on function public.admin_listing_context(uuid) to authenticated;

create or replace function public.admin_moderation_history() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.is_admin() then raise exception 'Admin only' using errcode='42501'; end if;
 return (select coalesce(jsonb_agg(to_jsonb(e)),'[]') from (
 select ev.*,p.display_name as actor_name from public.moderation_events ev left join public.profiles p on p.id=ev.actor_id
 order by ev.created_at desc,ev.id desc limit 50) e);
end; $$;
revoke all on function public.admin_moderation_history() from public;
grant execute on function public.admin_moderation_history() to authenticated;
commit;
