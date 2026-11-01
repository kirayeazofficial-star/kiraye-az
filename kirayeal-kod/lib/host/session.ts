import "server-only";
import {cookies} from "next/headers";
import {hostQuery} from "./db";
import {newId,newSessionToken,tokenHash} from "./security";

export const sessionCookie="kiraye_session";
const shortAge=60*60*12,longAge=60*60*24*30;

export async function createSession(userId:string,remember:boolean){
  const token=newSessionToken(),maxAge=remember?longAge:shortAge;
  await hostQuery(`insert into auth.sessions(id,user_id,token_hash,expires_at) values($1,$2,$3,now()+make_interval(secs=>$4::int))`,[newId(),userId,tokenHash(token),maxAge]);
  const jar=await cookies();jar.set(sessionCookie,token,{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge});
  return{token_type:"bearer",access_token:token,expires_in:maxAge,user:{id:userId}};
}

export async function currentUser(){
  const token=(await cookies()).get(sessionCookie)?.value;if(!token)return null;
  const rows=await hostQuery<{id:string;email:string;email_confirmed_at:string|null;display_name:string;phone:string}>(`select u.id,u.email,u.email_confirmed_at,p.display_name,p.phone from auth.sessions s join auth.users u on u.id=s.user_id left join public.profiles p on p.id=u.id where s.token_hash=$1 and s.revoked_at is null and s.expires_at>now() and u.disabled_at is null limit 1`,[tokenHash(token)]);
  return rows[0]||null;
}

export async function revokeSession(){
  const jar=await cookies(),token=jar.get(sessionCookie)?.value;
  if(token)await hostQuery(`update auth.sessions set revoked_at=now() where token_hash=$1 and revoked_at is null`,[tokenHash(token)]);
  jar.set(sessionCookie,"",{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:0});
}
