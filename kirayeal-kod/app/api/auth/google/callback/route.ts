import {NextRequest,NextResponse} from "next/server";
import {cookies} from "next/headers";
import {hostQuery,hostTransaction} from "../../../../../lib/host/db";
import {newId} from "../../../../../lib/host/security";
import {createSession} from "../../../../../lib/host/session";
import {publicSiteUrl} from "../../../../../lib/site-url";

export const dynamic="force-dynamic";
const ownerEmail="kirayeal.az@gmail.com";
export async function GET(request:NextRequest){
  const site=publicSiteUrl(),fail=()=>NextResponse.redirect(`${site}/login?google=error`);
  try{
    const params=request.nextUrl.searchParams,code=params.get("code")||"",state=params.get("state")||"";
    const jar=await cookies(),saved=jar.get("kiraye_gstate")?.value||"";
    jar.set("kiraye_gstate","",{path:"/api/auth/google",maxAge:0});
    if(!code||!state||state!==saved)return fail();
    const token=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({code,client_id:process.env.GOOGLE_CLIENT_ID||"",client_secret:process.env.GOOGLE_CLIENT_SECRET||"",redirect_uri:`${site}/api/auth/google/callback`,grant_type:"authorization_code"})});
    if(!token.ok)return fail();
    const {access_token}=await token.json();
    const info=await fetch("https://openidconnect.googleapis.com/v1/userinfo",{headers:{Authorization:`Bearer ${access_token}`}});
    if(!info.ok)return fail();
    const g=await info.json() as {sub?:string;email?:string;email_verified?:boolean;name?:string};
    const email=String(g.email||"").trim().toLowerCase();
    if(!g.sub||!email||g.email_verified!==true)return fail();
    let userId:string;
    const linked=await hostQuery<{user_id:string}>(`select user_id from auth.oauth_identities where provider='google' and provider_user_id=$1`,[g.sub]);
    if(linked[0])userId=linked[0].user_id;
    else{
      const existing=await hostQuery<{id:string}>(`select id from auth.users where lower(email)=$1 and disabled_at is null limit 1`,[email]);
      if(existing[0]){userId=existing[0].id;}
      else{userId=newId();await hostTransaction(async client=>{await client.query(`insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())`,[userId,email]);await client.query(`insert into public.profiles(id,display_name,phone) values($1,$2,'')`,[userId,String(g.name||email.split("@")[0]).slice(0,100)]);});}
      await hostQuery(`insert into auth.oauth_identities(provider,provider_user_id,user_id) values('google',$1,$2) on conflict do nothing`,[g.sub,userId]);
      await hostQuery(`update auth.users set email_confirmed_at=coalesce(email_confirmed_at,now()) where id=$1`,[userId]);
    }
    const alive=await hostQuery<{id:string}>(`select id from auth.users where id=$1 and disabled_at is null`,[userId]);
    if(!alive[0])return fail();
    if(email===ownerEmail){await hostTransaction(async client=>{await client.query(`update public.profiles set role='admin',updated_at=now() where id=$1`,[userId]);await client.query(`insert into public.staff_members(user_id,staff_role,assigned_by) values($1,'leader',$1) on conflict(user_id) do update set staff_role='leader'`,[userId]);});}
    await createSession(userId,true);
    return NextResponse.redirect(`${site}/profile`);
  }catch(error){console.error("google auth failed:",(error as Error).message);return fail();}
}
