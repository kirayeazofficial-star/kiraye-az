import {sameOrigin} from '../../../../lib/server-request';
import {normalizePhone} from '../../../../lib/rental-details';
import {hostQuery} from '../../../../lib/host/db';
import {currentUser} from '../../../../lib/host/session';
import {passwordMatches} from '../../../../lib/host/security';
export const runtime='nodejs';export const dynamic='force-dynamic';
const reply=(body:object,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function status(id:string){
 const rows=await hostQuery<{profile_no:number;name:string;phone:string;email:string;role:string;phone_changes:number;email_changes:number}>(`select p.profile_no,p.display_name name,p.phone,p.role,u.email,coalesce(p.phone_change_count,0) phone_changes,coalesce(p.email_change_count,0) email_changes from auth.users u join public.profiles p on p.id=u.id where u.id=$1`,[id]);
 const row=rows[0];if(!row)return null;
 let staff_role:string|null=null;
 try{const staff=await hostQuery<{staff_role:string}>(`select staff_role from public.staff_members where user_id=$1`,[id]);staff_role=staff[0]?.staff_role||null;}catch{}
 return{...row,staff_role,display_name:row.name,phone_remaining:Math.max(0,3-Number(row.phone_changes||0)),email_remaining:Math.max(0,3-Number(row.email_changes||0)),phone_verified:false,pending_email:null};
}
async function ensureProfile(user:{id:string;email:string;display_name:string;phone:string}){await hostQuery(`insert into public.profiles(id,display_name,phone) values($1,$2,$3) on conflict(id) do nothing`,[user.id,user.display_name||user.email.split('@')[0]||'İstifadəçi',user.phone||'']);}
export async function GET(){try{const user=await currentUser();if(!user)return reply({code:'sign_in_required'},401);await ensureProfile(user);const profile=await status(user.id);return profile?reply({profile}):reply({code:'profile_unavailable'},503);}catch(error){console.error('profile get',error);return reply({code:'profile_unavailable'},503);}}
export async function POST(request:Request){
 if(!sameOrigin(request))return reply({code:'forbidden'},403);
 try{
  const input=await request.json();if(!input||!['profile','email'].includes(input.action))return reply({code:'invalid_request'},400);
  const user=await currentUser();if(!user)return reply({code:'sign_in_required'},401);
  await ensureProfile(user);
  const attempts=await hostQuery<{attempts:number}>(`insert into public.profile_change_attempts(user_id,attempts) values($1,1) on conflict(user_id) do update set attempts=case when profile_change_attempts.started_at<now()-interval '15 minutes' then 1 else profile_change_attempts.attempts+1 end,started_at=case when profile_change_attempts.started_at<now()-interval '15 minutes' then now() else profile_change_attempts.started_at end returning attempts`,[user.id]);if(attempts[0].attempts>8)return reply({code:'rate_limited'},429);
  const password=String(input.password||'');const auth=await hostQuery<{password_hash:string|null}>(`select password_hash from auth.users where id=$1`,[user.id]);
  if(!password||!auth[0]?.password_hash||!await passwordMatches(password,auth[0].password_hash))return reply({code:'reauth_failed'},401);
  if(input.action==='email')return reply({code:'email_change_not_started'},503);
  const name=String(input.name||'').trim().replace(/\s+/g,' '),phone=normalizePhone(String(input.phone||''));if(name.length>100||!/^\S+\s+\S/.test(name)||!phone)return reply({code:'invalid_profile'},400);
  const current=await status(user.id);if(!current)return reply({code:'profile_unavailable'},503);const changed=normalizePhone(current.phone)!==phone;if(changed&&current.phone_remaining<=0)return reply({code:'phone_limit_reached'},409);
  await hostQuery(`update public.profiles set display_name=$1,phone=$2,phone_change_count=phone_change_count+case when $4 then 1 else 0 end,updated_at=now() where id=$3`,[name,phone,user.id,changed]);
  return reply({profile:await status(user.id)});
 }catch(error){console.error('profile post',error);return reply({code:'profile_unavailable'},503);}
}
