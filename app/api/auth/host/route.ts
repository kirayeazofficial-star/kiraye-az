import {NextRequest,NextResponse} from "next/server";
import {hostQuery,hostTransaction} from "../../../../lib/host/db";
import {emailCodeHash,newEmailCode,newId,passwordHash,passwordMatches,safeEqual} from "../../../../lib/host/security";
import {sendVerificationCode} from "../../../../lib/host/mailer";
import {createSession,currentUser,revokeSession} from "../../../../lib/host/session";

export const dynamic="force-dynamic";
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ownerEmail="kirayeal.az@gmail.com";
function response(data:unknown,status=200){return NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});}
function cleanEmail(value:unknown){const email=String(value||"").trim().toLowerCase();return emailPattern.test(email)&&email.length<=254?email:"";}
async function issueCode(userId:string|null,email:string,purpose:"signup"|"recovery"){
  const recent=await hostQuery<{count:string}>(`select count(*)::text count from auth.verification_codes where lower(email)=lower($1) and purpose=$2 and created_at>now()-interval '1 hour'`,[email,purpose]);
  if(Number(recent[0]?.count||0)>=6)throw new Error("RATE_LIMIT");
  const code=newEmailCode();
  await hostQuery(`insert into auth.verification_codes(user_id,email,purpose,code_hash,expires_at) values($1,$2,$3,$4,now()+interval '10 minutes')`,[userId,email,purpose,emailCodeHash(email,purpose,code)]);
  await sendVerificationCode(email,code,purpose);
}
async function ensureOwnerRole(userId:string,email:string){if(email!==ownerEmail)return;await hostTransaction(async client=>{await client.query(`update public.profiles set role='admin',updated_at=now() where id=$1`,[userId]);await client.query(`insert into public.staff_members(user_id,staff_role,assigned_by) values($1,'leader',$1) on conflict(user_id) do update set staff_role='leader'`,[userId]);});}

export async function GET(){const user=await currentUser();return response({user});}

export async function DELETE(){await revokeSession();return response({ok:true});}

export async function POST(request:NextRequest){
  try{
    const body=await request.json(),action=String(body.action||"");
    if(action==="login"){
      const email=cleanEmail(body.email),password=String(body.password||"");
      const rows=await hostQuery<{id:string;password_hash:string|null;email_confirmed_at:string|null}>(`select id,password_hash,email_confirmed_at from auth.users where lower(email)=lower($1) and disabled_at is null limit 1`,[email]);
      const user=rows[0];if(!user||!user.password_hash||!await passwordMatches(password,user.password_hash))return response({error:"INVALID_CREDENTIALS"},401);
      if(!user.email_confirmed_at)return response({error:"EMAIL_NOT_CONFIRMED"},403);
      await ensureOwnerRole(user.id,email);
      return response({session:await createSession(user.id,body.remember!==false)});
    }
    if(action==="signup"){
      const email=cleanEmail(body.email),password=String(body.password||""),name=String(body.name||"").trim(),phone=String(body.phone||"").trim();
      if(!email||password.length<8||name.length<3||name.length>100||phone.length<9||phone.length>32)return response({error:"INVALID_INPUT"},400);
      const hash=await passwordHash(password),id=newId();
      try{await hostTransaction(async client=>{await client.query(`insert into auth.users(id,email,password_hash) values($1,$2,$3)`,[id,email,hash]);await client.query(`insert into public.profiles(id,display_name,phone) values($1,$2,$3)`,[id,name,phone]);});}
      catch(error){
        if((error as {code?:string}).code!=="23505")throw error;
        const old=await hostQuery<{id:string;email_confirmed_at:string|null}>(`select id,email_confirmed_at from auth.users where lower(email)=lower($1) limit 1`,[email]);
        if(!old[0]||old[0].email_confirmed_at)return response({error:"ACCOUNT_EXISTS"},409);
        await hostTransaction(async client=>{await client.query(`update auth.users set password_hash=$1,updated_at=now() where id=$2`,[hash,old[0].id]);await client.query(`insert into public.profiles(id,display_name,phone) values($1,$2,$3) on conflict(id) do update set display_name=excluded.display_name,phone=excluded.phone`,[old[0].id,name,phone]);});
        await issueCode(old[0].id,email,"signup");
        return response({verification:"signup"},201);
      }
      try{await issueCode(id,email,"signup");}catch(error){await hostQuery(`delete from auth.users where id=$1 and email_confirmed_at is null`,[id]);throw error;}
      return response({verification:"signup"},201);
    }
    if(action==="request_recovery"){
      const email=cleanEmail(body.email);if(!email)return response({error:"INVALID_INPUT"},400);
      const users=await hostQuery<{id:string}>(`select id from auth.users where lower(email)=lower($1) and disabled_at is null limit 1`,[email]);
      if(users[0])await issueCode(users[0].id,email,"recovery");
      return response({verification:"recovery"});
    }
    if(action==="resend_signup"){
      const email=cleanEmail(body.email);if(!email)return response({error:"INVALID_INPUT"},400);
      const users=await hostQuery<{id:string;email_confirmed_at:string|null}>(`select id,email_confirmed_at from auth.users where lower(email)=lower($1) and disabled_at is null limit 1`,[email]);
      if(users[0]&&!users[0].email_confirmed_at)await issueCode(users[0].id,email,"signup");
      return response({verification:"signup"});
    }
    if(action==="verify"){
      const email=cleanEmail(body.email),purpose=body.purpose==="recovery"?"recovery":"signup",code=String(body.code||"");
      if(!email||!/^\d{6}$/.test(code))return response({error:"INVALID_CODE"},400);
      const rows=await hostQuery<{id:string;user_id:string;code_hash:Buffer;attempts:number}>(`select id,user_id,code_hash,attempts from auth.verification_codes where lower(email)=lower($1) and purpose=$2 and consumed_at is null and expires_at>now() order by id desc limit 1`,[email,purpose]);
      const item=rows[0];if(!item||item.attempts>=6||!safeEqual(item.code_hash,emailCodeHash(email,purpose,code))){if(item)await hostQuery(`update auth.verification_codes set attempts=attempts+1 where id=$1`,[item.id]);return response({error:"INVALID_CODE"},400);}
      await hostQuery(`update auth.verification_codes set consumed_at=now() where id=$1`,[item.id]);
      if(purpose==="signup"){await hostQuery(`update auth.users set email_confirmed_at=coalesce(email_confirmed_at,now()),updated_at=now() where id=$1`,[item.user_id]);await ensureOwnerRole(item.user_id,email);return response({session:await createSession(item.user_id,body.remember!==false)});}
      return response({recovery_token:code});
    }
    if(action==="reset_password"){
      const email=cleanEmail(body.email),code=String(body.code||""),password=String(body.password||"");if(!email||!/^\d{6}$/.test(code)||password.length<8)return response({error:"INVALID_INPUT"},400);
      const rows=await hostQuery<{id:string;user_id:string;code_hash:Buffer}>(`select id,user_id,code_hash from auth.verification_codes where lower(email)=lower($1) and purpose='recovery' and consumed_at is not null and expires_at>now() order by id desc limit 1`,[email]);const item=rows[0];
      if(!item||!safeEqual(item.code_hash,emailCodeHash(email,"recovery",code)))return response({error:"INVALID_CODE"},400);
      await hostQuery(`update auth.users set password_hash=$1,updated_at=now() where id=$2`,[await passwordHash(password),item.user_id]);await hostQuery(`update auth.sessions set revoked_at=now() where user_id=$1`,[item.user_id]);await hostQuery(`delete from auth.verification_codes where id=$1`,[item.id]);return response({session:await createSession(item.user_id,true)});
    }
    return response({error:"UNKNOWN_ACTION"},400);
  }catch(error){
    if((error as Error).message==="RATE_LIMIT")return response({error:"RATE_LIMIT"},429);
    console.error("auth/host failed:",(error as Error).message,(error as {code?:string}).code||"");
    return response({error:"SERVICE_UNAVAILABLE"},503);
  }
}
