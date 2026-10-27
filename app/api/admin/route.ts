import {NextRequest,NextResponse} from "next/server";
import {hostQuery,hostTransaction} from "../../../lib/host/db";
import {currentUser} from "../../../lib/host/session";

export const dynamic="force-dynamic";
const ownerEmail="kirayeal.az@gmail.com";
const statuses=new Set(["pending","published","rejected","archived","expired","draft"]);
const roles=new Set(["moderator","leader"]);
const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});

async function access(){
  const user=await currentUser();
  if(!user)return null;
  if(user.email.toLowerCase()===ownerEmail){
    await hostTransaction(async db=>{
      await db.query(`update public.profiles set role='admin',updated_at=now() where id=$1`,[user.id]);
      await db.query(`insert into public.staff_members(user_id,staff_role,assigned_by) values($1,'leader',$1) on conflict(user_id) do update set staff_role='leader'`,[user.id]);
    });
    return{user,role:"leader"};
  }
  const rows=await hostQuery<{role:string;staff_role:string|null}>(`select p.role,s.staff_role from public.profiles p left join public.staff_members s on s.user_id=p.id where p.id=$1`,[user.id]);
  if(rows[0]?.role!=="admin"||!rows[0]?.staff_role)return null;
  return{user,role:rows[0].staff_role};
}

export async function GET(request:NextRequest){
  try{
    const auth=await access();
    if(!auth)return reply({error:"FORBIDDEN"},403);
    const action=request.nextUrl.searchParams.get("action")||"overview";
    if(action==="access")return reply({allowed:true,role:auth.role,email:auth.user.email});
    if(action==="overview"){
      const [users,listings,messages,reports,statusRows]=await Promise.all([
        hostQuery<{count:string}>(`select count(*)::text count from auth.users where disabled_at is null`),
        hostQuery<{count:string}>(`select count(*)::text count from public.listings`),
        hostQuery<{count:string}>(`select count(*)::text count from public.chat_messages`),
        hostQuery<{count:string}>(`select count(*)::text count from public.listing_reports where status='open'`),
        hostQuery<{status:string;count:string}>(`select status,count(*)::text count from public.listings group by status`),
      ]);
      return reply({role:auth.role,counts:{users:Number(users[0]?.count||0),listings:Number(listings[0]?.count||0),messages:Number(messages[0]?.count||0),reports:Number(reports[0]?.count||0),statuses:Object.fromEntries(statusRows.map(row=>[row.status,Number(row.count)]))}});
    }
    if(action==="staff"){
      if(auth.role!=="leader")return reply({error:"FORBIDDEN"},403);
      const items=await hostQuery(`select u.id,u.email,p.display_name,p.profile_no,s.staff_role,s.assigned_at from public.staff_members s join auth.users u on u.id=s.user_id join public.profiles p on p.id=s.user_id order by case when s.staff_role='leader' then 0 else 1 end,s.assigned_at`);
      return reply({items,role:auth.role});
    }
    if(action==="users"){
      const query=(request.nextUrl.searchParams.get("query")||"").trim().replace(/[%_]/g,"").slice(0,100);
      const items=await hostQuery(`select u.id,u.email,u.email_confirmed_at,u.created_at,p.display_name,p.phone,p.profile_no,p.role,s.staff_role,(select count(*)::int from public.listings l where l.owner_id=u.id) listing_count from auth.users u join public.profiles p on p.id=u.id left join public.staff_members s on s.user_id=u.id where ($1='' or u.email ilike '%'||$1||'%' or p.display_name ilike '%'||$1||'%' or p.profile_no::text ilike '%'||$1||'%') order by u.created_at desc limit 100`,[query]);
      return reply({items,role:auth.role});
    }
    if(action==="reports"){
      const items=await hostQuery(`select r.id,r.report_no,r.reason,r.message,r.created_at,l.id listing_id,l.title,l.status listing_status,u.email reporter_email,p.display_name reporter_name from public.listing_reports r join public.listings l on l.id=r.listing_id join auth.users u on u.id=r.reporter_id left join public.profiles p on p.id=r.reporter_id where r.status='open' order by r.created_at desc limit 100`);
      return reply({items,role:auth.role});
    }
    const status=request.nextUrl.searchParams.get("status")||"pending";
    if(!statuses.has(status))return reply({error:"INVALID_STATUS"},400);
    const query=(request.nextUrl.searchParams.get("query")||"").trim().replace(/[%_]/g,"").slice(0,100);
    const items=await hostQuery(`select l.*,u.email owner_email,p.display_name owner_name,p.profile_no,(select count(*)::int from public.listing_views v where v.listing_id=l.id) views from public.listings l join auth.users u on u.id=l.owner_id left join public.profiles p on p.id=l.owner_id where l.status=$1 and ($2='' or l.title ilike '%'||$2||'%' or l.city ilike '%'||$2||'%' or l.listing_no::text ilike '%'||$2||'%' or u.email ilike '%'||$2||'%') order by l.created_at desc limit 100`,[status,query]);
    return reply({items,role:auth.role});
  }catch(error){console.error("admin get",error);return reply({error:"ADMIN_UNAVAILABLE"},503);}
}

export async function POST(request:NextRequest){
  try{
    const auth=await access();
    if(!auth)return reply({error:"FORBIDDEN"},403);
    const body=await request.json() as Record<string,unknown>,action=String(body.action||"");
    if(action==="moderate"){
      const id=String(body.id||""),status=String(body.status||""),reason=String(body.reason||"").trim().slice(0,500);
      if(!uuid.test(id)||!["published","rejected"].includes(status)||(status==="rejected"&&reason.length<5))return reply({error:"INVALID_ACTION"},400);
      const rows=await hostQuery<{id:string}>(`update public.listings set status=$2,rejection_reason=$3,first_published_at=case when $2='published' then coalesce(first_published_at,now()) else first_published_at end,expires_at=case when $2='published' then now()+interval '30 days' else expires_at end,updated_at=now() where id=$1 and status='pending' returning id`,[id,status,reason||null]);
      if(!rows[0])return reply({error:"NOT_FOUND"},404);
      await hostQuery(`insert into public.moderation_events(listing_id,owner_id,actor_id,actor_kind,action,old_status,new_status,reason) select id,owner_id,$2,'admin',$3,'pending',$3,$4 from public.listings where id=$1`,[id,auth.user.id,status,reason||null]);
      return reply({ok:true});
    }
    if(action==="staff"){
      if(auth.role!=="leader")return reply({error:"FORBIDDEN"},403);
      const email=String(body.email||"").trim().toLowerCase(),role=String(body.role||"");
      if(!roles.has(role)||!email.includes("@"))return reply({error:"INVALID_STAFF"},400);
      const target=await hostQuery<{id:string}>(`select id from auth.users where lower(email)=$1`,[email]);
      if(!target[0])return reply({error:"USER_NOT_FOUND"},404);
      await hostTransaction(async db=>{
        await db.query(`update public.profiles set role='admin',updated_at=now() where id=$1`,[target[0].id]);
        await db.query(`insert into public.staff_members(user_id,staff_role,assigned_by) values($1,$2,$3) on conflict(user_id) do update set staff_role=excluded.staff_role,assigned_by=excluded.assigned_by,assigned_at=now()`,[target[0].id,role,auth.user.id]);
      });
      return reply({ok:true});
    }
    if(action==="remove_staff"){
      if(auth.role!=="leader")return reply({error:"FORBIDDEN"},403);
      const id=String(body.id||"");if(!uuid.test(id)||id===auth.user.id)return reply({error:"INVALID_STAFF"},400);
      await hostTransaction(async db=>{await db.query(`delete from public.staff_members where user_id=$1`,[id]);await db.query(`update public.profiles set role='user',updated_at=now() where id=$1`,[id]);});
      return reply({ok:true});
    }
    if(action==="resolve_report"){
      const id=String(body.id||"");if(!uuid.test(id))return reply({error:"INVALID_REPORT"},400);
      await hostQuery(`update public.listing_reports set status='resolved',resolved_at=now(),resolved_by=$2 where id=$1 and status='open'`,[id,auth.user.id]);
      return reply({ok:true});
    }
    return reply({error:"INVALID_ACTION"},400);
  }catch(error){console.error("admin post",error);return reply({error:"ADMIN_ACTION_FAILED"},503);}
}
