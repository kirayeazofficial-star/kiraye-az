import {isLeader,isStaff} from "../../../../lib/host/staff";
import {NextRequest,NextResponse} from "next/server";
import {hostQuery,hostTransaction} from "../../../../lib/host/db";
import {emailCodeHash,newEmailCode,newId,passwordHash,passwordMatches,safeEqual} from "../../../../lib/host/security";
import {noticeLetter,sendLetter,sendVerificationCode} from "../../../../lib/host/mailer";
import {createHash,randomBytes} from "node:crypto";
import {cookies} from "next/headers";
import {createSession,currentUser,revokeSession} from "../../../../lib/host/session";

export const dynamic="force-dynamic";
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ownerEmail="kirayeal.az@gmail.com";
function response(data:unknown,status=200){return NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});}
function cleanEmail(value:unknown){const email=String(value||"").trim().toLowerCase();return emailPattern.test(email)&&email.length<=254?email:"";}
async function issueCode(userId:string|null,email:string,purpose:"signup"|"recovery"|"staff_login"){
  const recent=await hostQuery<{count:string}>(`select count(*)::text count from auth.verification_codes where lower(email)=lower($1) and purpose=$2 and created_at>now()-interval '1 hour'`,[email,purpose]);
  if(Number(recent[0]?.count||0)>=6)throw new Error("RATE_LIMIT");
  const code=newEmailCode();
  await hostQuery(`insert into auth.verification_codes(user_id,email,purpose,code_hash,expires_at) values($1,$2,$3,$4,now()+interval '10 minutes')`,[userId,email,purpose,emailCodeHash(email,purpose,code)]);
  await sendVerificationCode(email,code,purpose);
}
async function ensureOwnerRole(userId:string,email:string){if(email!==ownerEmail)return;await hostTransaction(async client=>{await client.query(`update public.profiles set role='admin',updated_at=now() where id=$1`,[userId]);await client.query(`insert into public.staff_members(user_id,staff_role,assigned_by) values($1,'leader',$1) on conflict(user_id) do update set staff_role='leader'`,[userId]);});}

// Sign-in protection: 5 wrong passwords for one e-mail (or 30 from one address) in 15 minutes lock it for 15 minutes.
const LOCK_MINUTES=15,MAX_FAILS=5,MAX_IP_FAILS=30;
const clientIp=(request:NextRequest)=>(request.headers.get("x-forwarded-for")||"").split(",")[0].trim()||request.headers.get("x-real-ip")||"";
async function lockedUntil(email:string,ip:string){
  const rows=await hostQuery<{fails:string;ipfails:string;last:string|null}>(`select
    (select count(*) from auth.login_attempts where lower(email)=lower($1) and not ok and created_at>now()-make_interval(mins=>$3::int))::text fails,
    (select count(*) from auth.login_attempts where ip=$2 and $2<>'' and not ok and created_at>now()-make_interval(mins=>$3::int))::text ipfails,
    (select max(created_at)::text from auth.login_attempts where (lower(email)=lower($1) or (ip=$2 and $2<>'')) and not ok) last`,[email,ip,LOCK_MINUTES]).catch(()=>[]);
  const row=rows[0];if(!row||(Number(row.fails)<MAX_FAILS&&Number(row.ipfails)<MAX_IP_FAILS)||!row.last)return null;
  return new Date(Date.parse(row.last)+LOCK_MINUTES*60000).toISOString();
}
const logAttempt=(email:string,ip:string,ok:boolean)=>hostQuery(`insert into auth.login_attempts(email,ip,ok) values($1,$2,$3)`,[email,ip||null,ok]).catch(()=>{});
// Leader and admins: a new device is confirmed with an e-mailed code and then trusted for 3 days.
const TRUST_COOKIE="kiraye_device",TRUST_DAYS=3;
const deviceHash=(token:string)=>createHash("sha256").update(token).digest();
async function trustedDevice(userId:string){
  const token=(await cookies()).get(TRUST_COOKIE)?.value;if(!token)return false;
  const rows=await hostQuery<{id:string}>(`select id::text from auth.trusted_devices where user_id=$1 and token_hash=$2 and expires_at>now() limit 1`,[userId,deviceHash(token)]).catch(()=>[]);
  return !!rows[0];
}
async function trustDevice(userId:string,userAgent:string){
  const token=randomBytes(32).toString("base64url");
  await hostQuery(`insert into auth.trusted_devices(user_id,token_hash,user_agent,expires_at) values($1,$2,$3,now()+make_interval(days=>$4::int))`,[userId,deviceHash(token),userAgent.slice(0,300),TRUST_DAYS]);
  (await cookies()).set(TRUST_COOKIE,token,{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:TRUST_DAYS*86400});
}

export async function GET(){const user=await currentUser();return response({user,staff:user?await isStaff(user).catch(()=>false):false,leader:user?await isLeader(user).catch(()=>false):false});}

export async function DELETE(){await revokeSession();return response({ok:true});}

export async function POST(request:NextRequest){
  try{
    const body=await request.json(),action=String(body.action||"");
    if(action==="login"){
      const email=cleanEmail(body.email),password=String(body.password||""),ip=clientIp(request);
      const until=await lockedUntil(email,ip);if(until)return response({error:"TOO_MANY_ATTEMPTS",retry_at:until},429);
      const rows=await hostQuery<{id:string;password_hash:string|null;email_confirmed_at:string|null;blocked:boolean}>(`select id,password_hash,email_confirmed_at,disabled_at is not null as blocked from auth.users where lower(email)=lower($1) order by disabled_at nulls first limit 1`,[email]);
      const user=rows[0];if(!user||!user.password_hash||!await passwordMatches(password,user.password_hash)){await logAttempt(email,ip,false);return response({error:"INVALID_CREDENTIALS"},401);}
      await logAttempt(email,ip,true);
      // A blocked account learns why it cannot sign in only after the right password.
      if(user.blocked)return response({error:"ACCOUNT_BLOCKED"},403);
      if(!user.email_confirmed_at)return response({error:"EMAIL_NOT_CONFIRMED"},403);
      await ensureOwnerRole(user.id,email);
      // Leader and admins on a device not confirmed in the last 3 days: an e-mailed code first.
      if(await isStaff({id:user.id,email}).catch(()=>false)&&!await trustedDevice(user.id)){await issueCode(user.id,email,"staff_login");return response({verification:"staff_login"});}
      return response({session:await createSession(user.id,body.remember!==false)});
    }
    if(action==="verify_staff"){
      const email=cleanEmail(body.email),code=String(body.code||"");
      if(!email||!/^\d{6}$/.test(code))return response({error:"INVALID_CODE"},400);
      const rows=await hostQuery<{id:string;user_id:string;code_hash:Buffer;attempts:number}>(`select id,user_id,code_hash,attempts from auth.verification_codes where lower(email)=lower($1) and purpose='staff_login' and consumed_at is null and expires_at>now() order by id desc limit 1`,[email]);
      const item=rows[0];if(!item||item.attempts>=6||!safeEqual(item.code_hash,emailCodeHash(email,"staff_login",code))){if(item)await hostQuery(`update auth.verification_codes set attempts=attempts+1 where id=$1`,[item.id]);return response({error:"INVALID_CODE"},400);}
      await hostQuery(`update auth.verification_codes set consumed_at=now() where id=$1`,[item.id]);
      const agent=request.headers.get("user-agent")||"";
      await trustDevice(item.user_id,agent);
      const when=new Intl.DateTimeFormat("az-AZ",{timeZone:"Asia/Baku",dateStyle:"short",timeStyle:"short"}).format(new Date());
      void sendLetter(email,"Hesabınıza yeni cihazdan daxil olundu — kirayeal.az",noticeLetter({heading:"Yeni cihazdan giriş",intro:"İdarəetmə hüququ olan hesabınıza yeni cihazdan daxil olundu. Bu siz idinizsə, heç nə etməyin. Siz deyildinizsə, dərhal şifrənizi dəyişin.",rows:[{label:"Vaxt (Bakı)",value:when},{label:"IP ünvanı",value:clientIp(request)||"—"},{label:"Cihaz",value:agent.replace(/\s+/g," ").slice(0,60)||"—"}],button:{text:"Şifrəni dəyiş",href:"/login?mode=recovery"}}));
      return response({session:await createSession(item.user_id,body.remember!==false)});
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
    if(action==="resend_staff"){
      const email=cleanEmail(body.email);if(!email)return response({error:"INVALID_INPUT"},400);
      const users=await hostQuery<{id:string}>(`select id from auth.users where lower(email)=lower($1) and disabled_at is null limit 1`,[email]);
      // Only after a correct password in the last 15 minutes (a pending staff code exists).
      const pending=users[0]?await hostQuery(`select 1 from auth.verification_codes where user_id=$1 and purpose='staff_login' and created_at>now()-interval '15 minutes' limit 1`,[users[0].id]):[];
      if(users[0]&&pending.length)await issueCode(users[0].id,email,"staff_login");
      return response({verification:"staff_login"});
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
      await hostQuery(`update auth.users set password_hash=$1,updated_at=now() where id=$2`,[await passwordHash(password),item.user_id]);await hostQuery(`update auth.sessions set revoked_at=now() where user_id=$1`,[item.user_id]);await hostQuery(`delete from auth.trusted_devices where user_id=$1`,[item.user_id]).catch(()=>{});await hostQuery(`delete from auth.verification_codes where id=$1`,[item.id]);return response({session:await createSession(item.user_id,true)});
    }
    return response({error:"UNKNOWN_ACTION"},400);
  }catch(error){
    if((error as Error).message==="RATE_LIMIT")return response({error:"RATE_LIMIT"},429);
    console.error("auth/host failed:",(error as Error).message,(error as {code?:string}).code||"");
    return response({error:"SERVICE_UNAVAILABLE"},503);
  }
}
