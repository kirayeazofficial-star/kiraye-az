import {sameOrigin} from '../../../../lib/server-request';
import {normalizePhone} from '../../../../lib/rental-details';
import {hostQuery,hostTransaction} from '../../../../lib/host/db';
import {currentUser} from '../../../../lib/host/session';
import {passwordMatches} from '../../../../lib/host/security';
export const runtime='nodejs';export const dynamic='force-dynamic';
const reply=(body:object,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function status(id:string){const rows=await hostQuery<{profile_no:number;name:string;phone:string;email:string;role:string;staff_role:string|null;phone_changes:number;email_changes:number}>(`select p.profile_no,p.display_name name,p.phone,p.role,s.staff_role,u.email,coalesce(c.phone_changes,0) phone_changes,coalesce(c.email_changes,0) email_changes from auth.users u join public.profiles p on p.id=u.id left join public.profile_contact_changes c on c.user_id=u.id left join public.staff_members s on s.user_id=u.id where u.id=$1`,[id]);const row=rows[0];return row&&{...row,display_name:row.name,phone_remaining:Math.max(0,3-row.phone_changes),email_remaining:Math.max(0,3-row.email_changes),phone_verified:false,pending_email:null};}
export async function GET(){try{const user=await currentUser();if(!user)return reply({code:'sign_in_required'},401);const profile=await status(user.id);return profile?reply({profile}):reply({code:'profile_unavailable'},503);}catch{return reply({code:'profile_unavailable'},503);}}
export async function POST(request:Request){
 if(!sameOrigin(request))return reply({code:'forbidden'},403);
 try{
  const input=await request.json();if(!input||!['profile','email'].includes(input.action))return reply({code:'invalid_request'},400);
  const user=await currentUser();if(!user)return reply({code:'sign_in_required'},401);
  const attempts=await hostQuery<{attempts:number}>(`insert into public.profile_change_attempts(user_id,attempts) values($1,1) on conflict(user_id) do update set attempts=case when profile_change_attempts.started_at<now()-interval '15 minutes' then 1 else profile_change_attempts.attempts+1 end,started_at=case when profile_change_attempts.started_at<now()-interval '15 minutes' then now() else profile_change_attempts.started_at end returning attempts`,[user.id]);if(attempts[0].attempts>8)return reply({code:'rate_limited'},429);
  const password=String(input.password||'');const auth=await hostQuery<{password_hash:string|null}>(`select password_hash from auth.users where id=$1`,[user.id]);
  if(!password||!auth[0]?.password_hash||!await passwordMatches(password,auth[0].password_hash))return reply({code:'reauth_failed'},401);
  if(input.action==='email')return reply({code:'email_change_not_started'},503);
  const name=String(input.name||'').trim().replace(/\s+/g,' '),phone=normalizePhone(String(input.phone||''));if(name.length>100||!/^\S+\s+\S/.test(name)||!phone)return reply({code:'invalid_profile'},400);
  const current=await status(user.id);if(!current)return reply({code:'profile_unavailable'},503);const changed=normalizePhone(current.phone)!==phone;if(changed&&current.phone_remaining<=0)return reply({code:'phone_limit_reached'},409);
  await hostTransaction(async client=>{await client.query(`update public.profiles set display_name=$1,phone=$2,updated_at=now() where id=$3`,[name,phone,user.id]);if(changed)await client.query(`insert into public.profile_contact_changes(user_id,phone_changes) values($1,1) on conflict(user_id) do update set phone_changes=profile_contact_changes.phone_changes+1`,[user.id]);});
  return reply({profile:await status(user.id)});
 }catch{return reply({code:'profile_unavailable'},503);}
}
