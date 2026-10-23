-- Server-only account lookup. Never grant this function to browser roles.
begin;
create table if not exists public.recovery_check_usage (
 client_key text not null, window_start timestamptz not null, attempts integer not null,
 primary key(client_key,window_start)
);
alter table public.recovery_check_usage enable row level security;
revoke all on public.recovery_check_usage from public,anon,authenticated;
create or replace function public.recovery_email_exists(p_email text,p_client_key text) returns boolean
language plpgsql security definer set search_path='' as $$
declare bucket timestamptz:=date_trunc('hour',now()) + floor(extract(minute from now())/15)*interval '15 minutes'; n integer;
begin
 if char_length(p_client_key)<>64 or char_length(p_email)>254 then raise exception 'Invalid recovery check'; end if;
 insert into public.recovery_check_usage values(p_client_key,bucket,1)
 on conflict(client_key,window_start) do update set attempts=recovery_check_usage.attempts+1 returning attempts into n;
 if n>10 then raise exception 'Too many recovery checks' using errcode='PR429'; end if;
 -- Keep only recent rate-limit buckets; no raw e-mail or IP is stored.
 delete from public.recovery_check_usage where window_start<now()-interval '1 day';
 return exists(select 1 from auth.users where lower(email)=lower(trim(p_email)));
end;
$$;
revoke all on function public.recovery_email_exists(text,text) from public,anon,authenticated;
grant execute on function public.recovery_email_exists(text,text) to service_role;
commit;
