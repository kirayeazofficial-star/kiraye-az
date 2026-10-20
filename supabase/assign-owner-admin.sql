-- Supabase SQL Editor-də bir dəfə Run et. Başqa hesabların icazəsi dəyişmir.
-- Bu əməliyyat giriş şifrəsini və e-poçt təsdiqini dəyişmir.
begin;
do $$
declare owner_id uuid;
begin
 select id into owner_id from auth.users where lower(email) = 'kiraye.azofficial@gmail.com';
 if owner_id is null then
  raise exception 'Bu e-poçtla saytda hesab tapılmadı: kiraye.azofficial@gmail.com. Əvvəl saytda bu ünvanla qeydiyyatdan keçin.';
 end if;
 insert into public.profiles(id, role) values (owner_id, 'admin')
 on conflict (id) do update set role = 'admin';
end $$;
commit;
select p.id, u.email, p.role, (u.email_confirmed_at is not null) as email_confirmed
from public.profiles p join auth.users u on u.id=p.id
where lower(u.email)='kiraye.azofficial@gmail.com';
