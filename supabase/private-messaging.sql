-- Additive migration. Back up all schemas and Storage first. No existing records are rewritten.
begin;
create table if not exists public.chat_threads (
 id uuid primary key default gen_random_uuid(),
 listing_id uuid not null references public.listings(id) on delete restrict,
 buyer_id uuid not null references public.profiles(id) on delete restrict,
 seller_id uuid not null references public.profiles(id) on delete restrict,
 listing_title text not null,listing_image text,
 created_at timestamptz not null default now(),last_message_at timestamptz not null default now(),
 unique(listing_id,buyer_id,seller_id),check(buyer_id<>seller_id)
);
create table if not exists public.chat_messages (
 id bigint generated always as identity primary key,
 thread_id uuid not null references public.chat_threads(id) on delete restrict,
 author_id uuid not null references public.profiles(id) on delete restrict,
 body text not null check(length(trim(body)) between 1 and 3000),
 created_at timestamptz not null default now()
);
create index if not exists chat_messages_thread on public.chat_messages(thread_id,id desc);
create index if not exists chat_messages_author on public.chat_messages(author_id,created_at desc);
create index if not exists chat_threads_buyer on public.chat_threads(buyer_id,last_message_at desc,id);
create index if not exists chat_threads_seller on public.chat_threads(seller_id,last_message_at desc,id);
create table if not exists public.chat_reads (
 thread_id uuid not null references public.chat_threads(id) on delete restrict,
 user_id uuid not null references public.profiles(id) on delete restrict,
 last_message_id bigint not null default 0 check(last_message_id>=0),
 primary key(thread_id,user_id)
);
create table if not exists public.chat_blocks (
 blocker_id uuid not null references public.profiles(id) on delete restrict,
 blocked_id uuid not null references public.profiles(id) on delete restrict,
 created_at timestamptz not null default now(),primary key(blocker_id,blocked_id),check(blocker_id<>blocked_id)
);
create table if not exists public.chat_reports (
 id bigint generated always as identity (start with 40000001) primary key,
 thread_id uuid not null references public.chat_threads(id) on delete restrict,
 message_id bigint references public.chat_messages(id) on delete restrict,
 reporter_id uuid not null references public.profiles(id) on delete restrict,
 reported_id uuid not null references public.profiles(id) on delete restrict,
 reason text not null check(length(trim(reason)) between 10 and 1000),
 created_at timestamptz not null default now(),status text not null default 'open' check(status in ('open','resolved')),
 resolved_by uuid references public.profiles(id) on delete restrict,resolved_at timestamptz,resolution_note text
);
create unique index if not exists chat_reports_one_open on public.chat_reports(thread_id,reporter_id) where status='open';
alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_reads enable row level security;
alter table public.chat_blocks enable row level security;
alter table public.chat_reports enable row level security;
revoke all on public.chat_threads,public.chat_messages,public.chat_reads,public.chat_blocks,public.chat_reports from public,anon,authenticated;
grant select on public.chat_threads,public.chat_messages,public.chat_reads,public.chat_blocks,public.chat_reports to authenticated;

create or replace function public.chat_participant(p_thread uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.chat_threads where id=p_thread and auth.uid() in (buyer_id,seller_id));
$$;
revoke all on function public.chat_participant(uuid) from public,anon;
grant execute on function public.chat_participant(uuid) to authenticated;
drop policy if exists chat_threads_participants on public.chat_threads;
create policy chat_threads_participants on public.chat_threads for select to authenticated using(auth.uid() in (buyer_id,seller_id));
drop policy if exists chat_messages_participants on public.chat_messages;
create policy chat_messages_participants on public.chat_messages for select to authenticated using(public.chat_participant(thread_id));
drop policy if exists chat_reads_own on public.chat_reads;
create policy chat_reads_own on public.chat_reads for select to authenticated using(user_id=auth.uid() and public.chat_participant(thread_id));
drop policy if exists chat_blocks_own on public.chat_blocks;
create policy chat_blocks_own on public.chat_blocks for select to authenticated using(blocker_id=auth.uid());
drop policy if exists chat_reports_own on public.chat_reports;
create policy chat_reports_own on public.chat_reports for select to authenticated using(reporter_id=auth.uid());

create or replace function public.chat_require_user() returns uuid
language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=auth.uid();
begin
 if actor is null or not exists(select 1 from auth.users where id=actor and email_confirmed_at is not null) then raise exception 'Confirmed account required' using errcode='42501';end if;
 return actor;
end $$;
revoke all on function public.chat_require_user() from public,anon,authenticated;

create or replace function public.chat_send(p_thread uuid,p_body text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=public.chat_require_user();thread public.chat_threads;sent public.chat_messages;body text:=trim(coalesce(p_body,''));peer uuid;
begin
 if length(body) not between 1 and 3000 then raise exception 'Message must contain 1 to 3000 characters' using errcode='22023';end if;
 select * into thread from public.chat_threads where id=p_thread and actor in (buyer_id,seller_id);
 if thread.id is null then raise exception 'Conversation unavailable' using errcode='42501';end if;
 peer:=case when thread.buyer_id=actor then thread.seller_id else thread.buyer_id end;
 if exists(select 1 from public.chat_blocks where (blocker_id=actor and blocked_id=peer) or (blocker_id=peer and blocked_id=actor)) then raise exception 'Messaging blocked' using errcode='PCB01';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,88105));
 if (select count(*) from public.chat_messages where author_id=actor and created_at>now()-interval '1 minute')>=20
 or (select count(*) from public.chat_messages where author_id=actor and created_at>now()-interval '1 day')>=500 then raise exception 'Message rate limit' using errcode='PCR01';end if;
 insert into public.chat_messages(thread_id,author_id,body) values(p_thread,actor,body) returning * into sent;
 update public.chat_threads set last_message_at=clock_timestamp() where id=p_thread;
 insert into public.chat_reads(thread_id,user_id,last_message_id) values(p_thread,actor,sent.id)
 on conflict(thread_id,user_id) do update set last_message_id=greatest(chat_reads.last_message_id,excluded.last_message_id);
 return jsonb_build_object('id',sent.id,'author_id',sent.author_id,'body',sent.body,'created_at',sent.created_at);
end $$;
revoke all on function public.chat_send(uuid,text) from public,anon;
grant execute on function public.chat_send(uuid,text) to authenticated;

create or replace function public.chat_start(p_listing uuid,p_body text) returns uuid
language plpgsql security definer set search_path='' as $$
declare actor uuid:=public.chat_require_user();ad public.listings;thread uuid;
begin
 select * into ad from public.listings where id=p_listing and status='published'
 and coalesce(expires_at,first_published_at+interval '30 days',created_at+interval '30 days')>now();
 if ad.id is null then raise exception 'Listing is not active' using errcode='22023';end if;
 if ad.owner_id=actor then raise exception 'Cannot message yourself' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,88105));
 select id into thread from public.chat_threads where listing_id=p_listing and buyer_id=actor and seller_id=ad.owner_id;
 if thread is null then
  if (select count(*) from public.chat_threads where buyer_id=actor and created_at>now()-interval '1 hour')>=10 then raise exception 'Conversation rate limit' using errcode='PCR01';end if;
  insert into public.chat_threads(listing_id,buyer_id,seller_id,listing_title,listing_image)
  values(p_listing,actor,ad.owner_id,ad.title,ad.images[1]) returning id into thread;
 end if;
 perform public.chat_send(thread,p_body);
 return thread;
end $$;
revoke all on function public.chat_start(uuid,text) from public,anon;
grant execute on function public.chat_start(uuid,text) to authenticated;

create or replace function public.chat_get_thread(p_thread uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=public.chat_require_user();result jsonb;
begin
 select jsonb_build_object('id',t.id,'listing_id',t.listing_id,'listing_title',t.listing_title,'listing_image',t.listing_image,
 'peer_id',case when actor=t.buyer_id then t.seller_id else t.buyer_id end,
 'peer_name',coalesce(nullif(trim(p.display_name),''),'İstifadəçi'),'peer_no',p.profile_no,
 'listing_active',l.status='published' and coalesce(l.expires_at,l.first_published_at+interval '30 days',l.created_at+interval '30 days')>now(),
 'blocked_by_me',exists(select 1 from public.chat_blocks where blocker_id=actor and blocked_id=p.id),
 'blocked',exists(select 1 from public.chat_blocks where (blocker_id=actor and blocked_id=p.id) or (blocker_id=p.id and blocked_id=actor))) into result
 from public.chat_threads t join public.listings l on l.id=t.listing_id
 join public.profiles p on p.id=case when actor=t.buyer_id then t.seller_id else t.buyer_id end
 where t.id=p_thread and actor in(t.buyer_id,t.seller_id);
 if result is null then raise exception 'Conversation unavailable' using errcode='42501';end if;
 return result;
end $$;
revoke all on function public.chat_get_thread(uuid) from public,anon;
grant execute on function public.chat_get_thread(uuid) to authenticated;

create or replace function public.chat_inbox(p_before timestamptz default null,p_before_id uuid default null,p_limit integer default 30) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=public.chat_require_user();result jsonb;
begin
 select coalesce(jsonb_agg(row_data order by stamp desc,thread_id desc),'[]'::jsonb) into result from (
  select t.id thread_id,t.last_message_at stamp,public.chat_get_thread(t.id)||jsonb_build_object('last_message_at',t.last_message_at,
   'preview',(select left(body,120) from public.chat_messages where thread_id=t.id order by id desc limit 1),
   'unread',(select count(*) from public.chat_messages m where m.thread_id=t.id and m.author_id<>actor and m.id>coalesce((select last_message_id from public.chat_reads where thread_id=t.id and user_id=actor),0))) row_data
  from public.chat_threads t where actor in(t.buyer_id,t.seller_id)
   and (p_before is null or (t.last_message_at,t.id)<(p_before,coalesce(p_before_id,'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid)))
  order by t.last_message_at desc,t.id desc limit least(greatest(p_limit,1),50)
 ) q;
 return result;
end $$;
revoke all on function public.chat_inbox(timestamptz,uuid,integer) from public,anon;
grant execute on function public.chat_inbox(timestamptz,uuid,integer) to authenticated;

create or replace function public.chat_page(p_thread uuid,p_before bigint default null,p_limit integer default 50) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if public.chat_require_user() is null or not public.chat_participant(p_thread) then raise exception 'Conversation unavailable' using errcode='42501';end if;
 return (select coalesce(jsonb_agg(to_jsonb(q) order by id),'[]'::jsonb) from (
  select id,author_id,body,created_at from public.chat_messages where thread_id=p_thread and(p_before is null or id<p_before)
  order by id desc limit least(greatest(p_limit,1),100)
 )q);
end $$;
revoke all on function public.chat_page(uuid,bigint,integer) from public,anon;
grant execute on function public.chat_page(uuid,bigint,integer) to authenticated;

create or replace function public.chat_mark_read(p_thread uuid,p_message bigint) returns void
language plpgsql security definer set search_path='' as $$
declare actor uuid:=public.chat_require_user();
begin
 if not public.chat_participant(p_thread) or not exists(select 1 from public.chat_messages where id=p_message and thread_id=p_thread) then raise exception 'Conversation unavailable' using errcode='42501';end if;
 insert into public.chat_reads(thread_id,user_id,last_message_id) values(p_thread,actor,p_message)
 on conflict(thread_id,user_id) do update set last_message_id=greatest(chat_reads.last_message_id,excluded.last_message_id);
end $$;
revoke all on function public.chat_mark_read(uuid,bigint) from public,anon;
grant execute on function public.chat_mark_read(uuid,bigint) to authenticated;

create or replace function public.chat_unread_count() returns bigint
language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=public.chat_require_user();
begin
 return (select count(*) from public.chat_messages m join public.chat_threads t on t.id=m.thread_id
 left join public.chat_reads r on r.thread_id=t.id and r.user_id=actor
 where actor in(t.buyer_id,t.seller_id) and m.author_id<>actor and m.id>coalesce(r.last_message_id,0));
end $$;
revoke all on function public.chat_unread_count() from public,anon;
grant execute on function public.chat_unread_count() to authenticated;

create or replace function public.chat_set_block(p_thread uuid,p_block boolean) returns void
language plpgsql security definer set search_path='' as $$
declare actor uuid:=public.chat_require_user();peer uuid;
begin
 if not public.chat_participant(p_thread) then raise exception 'Conversation unavailable' using errcode='42501';end if;
 select case when buyer_id=actor then seller_id else buyer_id end into peer from public.chat_threads where id=p_thread;
 if p_block then insert into public.chat_blocks values(actor,peer,now()) on conflict do nothing;
 else delete from public.chat_blocks where blocker_id=actor and blocked_id=peer;end if;
end $$;
revoke all on function public.chat_set_block(uuid,boolean) from public,anon;
grant execute on function public.chat_set_block(uuid,boolean) to authenticated;

create or replace function public.chat_report(p_thread uuid,p_message bigint,p_reason text) returns bigint
language plpgsql security definer set search_path='' as $$
declare actor uuid:=public.chat_require_user();peer uuid;number bigint;
begin
 if not public.chat_participant(p_thread) then raise exception 'Conversation unavailable' using errcode='42501';end if;
 if length(trim(coalesce(p_reason,''))) not between 10 and 1000 then raise exception 'Explain the report in 10 to 1000 characters' using errcode='22023';end if;
 select case when buyer_id=actor then seller_id else buyer_id end into peer from public.chat_threads where id=p_thread;
 if p_message is not null and not exists(select 1 from public.chat_messages where id=p_message and thread_id=p_thread and author_id=peer) then raise exception 'Invalid reported message' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,88106));
 select id into number from public.chat_reports where thread_id=p_thread and reporter_id=actor and status='open';
 if number is not null then return number;end if;
 if (select count(*) from public.chat_reports where reporter_id=actor and created_at>now()-interval '1 hour')>=3 then raise exception 'Report rate limit' using errcode='PCR01';end if;
 insert into public.chat_reports(thread_id,message_id,reporter_id,reported_id,reason) values(p_thread,p_message,actor,peer,trim(p_reason)) returning id into number;
 return number;
end $$;
revoke all on function public.chat_report(uuid,bigint,text) from public,anon;
grant execute on function public.chat_report(uuid,bigint,text) to authenticated;

create or replace function public.chat_admin_reports(p_before bigint default null,p_limit integer default 25) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.is_admin() then raise exception 'Admin only' using errcode='42501';end if;
 -- Only explicitly reported message content is shared with moderation, never arbitrary conversations.
 return (select coalesce(jsonb_agg(to_jsonb(q) order by id desc),'[]'::jsonb) from (
  select r.id,r.thread_id,r.reason,r.created_at,r.status,r.resolved_at,r.resolved_by,r.resolution_note,
   t.listing_id,t.listing_title,p.profile_no as reporter_no,p.display_name as reporter_name,
   other.profile_no as reported_no,other.display_name as reported_name,m.body as reported_message
  from public.chat_reports r join public.chat_threads t on t.id=r.thread_id
  join public.profiles p on p.id=r.reporter_id join public.profiles other on other.id=r.reported_id
  left join public.chat_messages m on m.id=r.message_id where p_before is null or r.id<p_before
  order by r.id desc limit least(greatest(p_limit,1),50)
 )q);
end $$;
revoke all on function public.chat_admin_reports(bigint,integer) from public,anon;
grant execute on function public.chat_admin_reports(bigint,integer) to authenticated;

create or replace function public.chat_admin_resolve(p_report bigint,p_note text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not public.is_admin() then raise exception 'Admin only' using errcode='42501';end if;
 if length(trim(coalesce(p_note,''))) not between 3 and 1000 then raise exception 'Resolution note required' using errcode='22023';end if;
 update public.chat_reports set status='resolved',resolved_by=auth.uid(),resolved_at=clock_timestamp(),resolution_note=trim(p_note)
 where id=p_report and status='open';
 if not found then raise exception 'Open report not found' using errcode='22023';end if;
end $$;
revoke all on function public.chat_admin_resolve(bigint,text) from public,anon;
grant execute on function public.chat_admin_resolve(bigint,text) to authenticated;
notify pgrst,'reload schema';
commit;
