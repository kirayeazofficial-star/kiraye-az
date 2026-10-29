import {sameOrigin} from '../../../../lib/server-request';
import {normalizePhone} from '../../../../lib/rental-details';
import {hostQuery} from '../../../../lib/host/db';
import {currentUser} from '../../../../lib/host/session';
import {passwordMatches,newEmailCode,emailCodeHash,safeEqual} from '../../../../lib/host/security';
import {sendVerificationCode} from '../../../../lib/host/mailer';
export const runtime='nodejs';export const dynamic='force-dynamic';
const reply=(body:object,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function status(id:string){
 const rows=await hostQuery<{profile_no:number;name:string;phone:string;email:string}>(`select p.profile_no,p.display_name as name,p.phone,u.email from auth.users u join public.profiles p on p.id=u.id where u.id=$1`,[id]);
 const row=rows[0];if(!row)return null;
 let staff_role:string|null=null,role=row.email.toLowerCase()==='kirayeal.az@gmail.com'?'admin':'user';
 try{const staff=await hostQuery<{staff_role:string}>(`select staff_role from public.staff_members where user_id=$1`,[id]);staff_role=staff[0]?.staff_role||null;}catch{}
 try{const access=await hostQuery<{role:string}>(`select role from public.profiles where id=$1`,[id]);if(access[0]?.role)role=access[0].role;}catch{}
 let avatar_url:string|null=null,created_at:string|null=null;
 try{const extra=await hostQuery<{avatar_url:string|null;created_at:string|null}>(`select p.avatar_url,u.created_at from auth.users u join public.profiles p on p.id=u.id where u.id=$1`,[id]);avatar_url=extra[0]?.avatar_url||null;created_at=extra[0]?.created_at||null;}catch{}
 return{...row,avatar_url,created_at,role,staff_role,phone_changes:0,email_changes:0,display_name:row.name,phone_remaining:3,email_remaining:3,phone_verified:false,pending_email:null};
}
async function ensureProfile(user:{id:string;email:string;display_name:string;phone:string}){await hostQuery(`insert into public.profiles(id,display_name,phone) values($1,$2,$3) on conflict(id) do nothing`,[user.id,user.display_name||user.email.split('@')[0]||'İstifadəçi',user.phone||'']);}
export async function GET(){
 try{
  const user=await currentUser();if(!user)return reply({code:'sign_in_required'},401);
  let profile_no:number|string=0,role=user.email.toLowerCase()==='kirayeal.az@gmail.com'?'admin':'user',staff_role:string|null=null;
  try{const rows=await hostQuery<{profile_no:number;role:string}>(`select profile_no,role from public.profiles where id=$1`,[user.id]);if(rows[0]){profile_no=rows[0].profile_no;role=rows[0].role||role;}}catch{}
  try{const rows=await hostQuery<{staff_role:string}>(`select staff_role from public.staff_members where user_id=$1`,[user.id]);staff_role=rows[0]?.staff_role||null;}catch{}
  let avatar_url:string|null=null;
  try{const rows=await hostQuery<{avatar_url:string|null}>(`select avatar_url from public.profiles where id=$1`,[user.id]);avatar_url=rows[0]?.avatar_url||null;}catch{}
  let created_at:string|null=null;
  try{const ts=await hostQuery<{created_at:string}>(`select created_at from auth.users where id=$1`,[user.id]);created_at=ts[0]?.created_at||null;}catch{}
  return reply({profile:{profile_no,name:user.display_name||user.email.split('@')[0]||'İstifadəçi',display_name:user.display_name||'',phone:user.phone||'',email:user.email,role,staff_role,phone_changes:0,email_changes:0,phone_remaining:3,email_remaining:3,phone_verified:false,pending_email:null,created_at,avatar_url}});
 }catch(error){console.error('profile get',error);return reply({code:'profile_unavailable',stage:'session'},503);}
}
export async function POST(request:Request){
 if(!sameOrigin(request))return reply({code:'forbidden'},403);
 try{
  const input=await request.json();if(!input||!['profile','email','email_confirm'].includes(input.action))return reply({code:'invalid_request'},400);
  const user=await currentUser();if(!user)return reply({code:'sign_in_required'},401);
  await ensureProfile(user);
  const attempts=await hostQuery<{attempts:number}>(`insert into public.profile_change_attempts(user_id,attempts) values($1,1) on conflict(user_id) do update set attempts=case when profile_change_attempts.started_at<now()-interval '15 minutes' then 1 else profile_change_attempts.attempts+1 end,started_at=case when profile_change_attempts.started_at<now()-interval '15 minutes' then now() else profile_change_attempts.started_at end returning attempts`,[user.id]);if(attempts[0].attempts>8)return reply({code:'rate_limited'},429);
  const cleanNew=String(input.email||'').trim().toLowerCase();
  if(input.action==='email_confirm'){
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanNew))return reply({code:'invalid_email'},400);
   const code=String(input.code||'').trim();
   const rows=await hostQuery<{id:number;code_hash:Buffer;attempts:number}>(`select id,code_hash,attempts from auth.verification_codes where user_id=$1 and lower(email)=$2 and purpose='email_change' and consumed_at is null and expires_at>now() order by id desc limit 1`,[user.id,cleanNew]);
   const item=rows[0];
   if(!item||item.attempts>=6||!/^\d{6}$/.test(code)||!safeEqual(item.code_hash,emailCodeHash(cleanNew,'email_change',code))){if(item)await hostQuery(`update auth.verification_codes set attempts=attempts+1 where id=$1`,[item.id]);return reply({code:'invalid_code'},400);}
   const taken=await hostQuery(`select 1 from auth.users where lower(email)=$1 and id<>$2`,[cleanNew,user.id]);if(taken[0])return reply({code:'email_taken'},409);
   await hostQuery(`update auth.verification_codes set consumed_at=now() where id=$1`,[item.id]);
   await hostQuery(`update auth.users set email=$1,updated_at=now() where id=$2`,[cleanNew,user.id]);
   return reply({profile:await status(user.id),email_changed:true});
  }
  if(input.action==='email'){
   // Only changing the sign-in e-mail asks for the password again; name and phone do not.
   const password=String(input.password||'');const auth=await hostQuery<{password_hash:string|null}>(`select password_hash from auth.users where id=$1`,[user.id]);
   if(!password||!auth[0]?.password_hash||!await passwordMatches(password,auth[0].password_hash))return reply({code:'reauth_failed'},401);
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanNew)||cleanNew.length>254)return reply({code:'invalid_email'},400);
   if(cleanNew===user.email.toLowerCase())return reply({code:'same_email'},400);
   const taken=await hostQuery(`select 1 from auth.users where lower(email)=$1`,[cleanNew]);if(taken[0])return reply({code:'email_taken'},409);
   const recent=await hostQuery<{count:string}>(`select count(*)::text count from auth.verification_codes where user_id=$1 and purpose='email_change' and created_at>now()-interval '1 hour'`,[user.id]);if(Number(recent[0]?.count||0)>=5)return reply({code:'rate_limited'},429);
   const code=newEmailCode();
   await hostQuery(`insert into auth.verification_codes(user_id,email,purpose,code_hash,expires_at) values($1,$2,'email_change',$3,now()+interval '10 minutes')`,[user.id,cleanNew,emailCodeHash(cleanNew,'email_change',code)]);
   try{await sendVerificationCode(user.email,code,'email_change');}catch{return reply({code:'mail_delivery_failed'},503);}
   return reply({code_sent:true});
  }
  const name=String(input.name||'').trim().replace(/\s+/g,' '),phone=normalizePhone(String(input.phone||''));if(name.length>100||!/^\S+\s+\S/.test(name)||!phone)return reply({code:'invalid_profile'},400);
  const current=await status(user.id);if(!current)return reply({code:'profile_unavailable'},503);const changed=normalizePhone(current.phone)!==phone;if(changed&&current.phone_remaining<=0)return reply({code:'phone_limit_reached'},409);
  await hostQuery(`update public.profiles set display_name=$1,phone=$2,updated_at=now() where id=$3`,[name,phone,user.id]);
  return reply({profile:await status(user.id)});
 }catch(error){console.error('profile post',error);return reply({code:'profile_unavailable'},503);}
}
