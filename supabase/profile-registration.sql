-- Back up first. Email remains the authentication channel; no SMS verification.
begin;
create or replace function public.kiraye_create_profile() returns trigger
language plpgsql security definer set search_path='' as $$
declare meta jsonb := coalesce(to_jsonb(new)->'raw_user_meta_data','{}'::jsonb);
begin
 insert into public.profiles(id,display_name,phone)
 values(new.id,left(nullif(trim(meta->>'full_name'),''),100),
 case when meta->>'contact_phone' ~ '^\+994[0-9]{9}$' then meta->>'contact_phone' else null end)
 on conflict(id) do nothing;
 return new;
end $$;
-- Only fill missing profile fields, preserving administrator roles and manual edits.
update public.profiles p set display_name=coalesce(nullif(trim(p.display_name),''),left(nullif(trim(to_jsonb(u)->'raw_user_meta_data'->>'full_name'),''),100)),
 phone=coalesce(nullif(trim(p.phone),''),case when to_jsonb(u)->'raw_user_meta_data'->>'contact_phone' ~ '^\+994[0-9]{9}$' then to_jsonb(u)->'raw_user_meta_data'->>'contact_phone' else null end)
 from auth.users u where u.id=p.id;
create or replace function public.kiraye_validate_email_registration() returns trigger
language plpgsql set search_path='' as $$
declare meta jsonb:=coalesce(to_jsonb(new)->'raw_user_meta_data','{}'::jsonb);
begin
 if to_jsonb(new)->'raw_app_meta_data'->>'provider'='email' then
  if length(coalesce(meta->>'full_name',''))>100 or coalesce(trim(meta->>'full_name'),'') !~ '^[^[:space:]]+[[:space:]]+[^[:space:]].*$' then raise exception 'Ad və soyad tələb olunur';end if;
  if coalesce(meta->>'contact_phone','') !~ '^\+994[0-9]{9}$' then raise exception 'Telefon nömrəsi tələb olunur';end if;
 end if;
 return new;
end $$;
drop trigger if exists kiraye_validate_email_registration on auth.users;
create trigger kiraye_validate_email_registration before insert on auth.users for each row execute function public.kiraye_validate_email_registration();
commit;
