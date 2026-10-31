import {NextRequest,NextResponse} from "next/server";
import {hostQuery,hostTransaction} from "../../../lib/host/db";
import {currentUser} from "../../../lib/host/session";
import {notifyRejected} from "../../../lib/host/notify";
import {limitRules,saveLimitRules} from "../../../lib/host/limit-rules";
import {cleanLimitRules} from "../../../lib/limit-rules";

export const dynamic="force-dynamic";
const ownerEmail="kirayeal.az@gmail.com";
const PAGE=24,REPORT_PAGE=50;
const listingStatuses=new Set(["pending","published","rejected","archived","expired","draft"]);
const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const day=/^\d{4}-\d{2}-\d{2}$/;
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});
const param=(request:NextRequest,name:string)=>(request.nextUrl.searchParams.get(name)||"").trim();

async function access(){
  const user=await currentUser();
  if(!user)return null;
  if(user.email.toLowerCase()===ownerEmail){
    await hostTransaction(async db=>{
      await db.query(`insert into public.profiles(id,display_name,phone) values($1,$2,$3) on conflict(id) do nothing`,[user.id,user.display_name||user.email.split('@')[0],user.phone||'']);
      await db.query(`update public.profiles set role='admin',updated_at=now() where id=$1`,[user.id]);
      await db.query(`insert into public.staff_members(user_id,staff_role,assigned_by) values($1,'leader',$1) on conflict(user_id) do update set staff_role='leader'`,[user.id]);
    });
    return{user,role:"leader"};
  }
  const rows=await hostQuery<{role:string;staff_role:string|null}>(`select p.role,s.staff_role from public.profiles p left join public.staff_members s on s.user_id=p.id where p.id=$1`,[user.id]);
  if(rows[0]?.role!=="admin"||!rows[0]?.staff_role)return null;
  return{user,role:rows[0].staff_role};
}

// Only signed-in staff ever reach the database; they may see a short error code.
const failure=(error:unknown,staff:boolean)=>{console.error("admin",error);const e=error as {code?:string;message?:string};return reply({error:"ADMIN_UNAVAILABLE",...(staff?{detail:`${e.code||""} ${e.message||""}`.trim().slice(0,300)}:{})},503);};

export async function GET(request:NextRequest){
  let staff=false;
  try{
    const auth=await access();
    if(!auth)return reply({error:"FORBIDDEN"},403);
    staff=true;
    const action=param(request,"action")||"overview";
    if(action==="access")return reply({allowed:true,role:auth.role,email:auth.user.email});

    if(action==="overview"){
      const [users,listings,messages,reports,statusRows,storeRequests]=await Promise.all([
        hostQuery<{count:string}>(`select count(*)::text count from auth.users where disabled_at is null`),
        hostQuery<{count:string}>(`select count(*)::text count from public.listings`),
        hostQuery<{count:string}>(`select count(*)::text count from public.chat_messages`),
        hostQuery<{count:string}>(`select count(*)::text count from public.listing_reports where status='open'`),
        hostQuery<{status:string;count:string}>(`select status,count(*)::text count from public.listings group by status`),
        hostQuery<{count:string}>(`select count(*)::text as count from public.stores where status='pending'`).catch(()=>[]),
      ]);
      // New accounts and listings for today (Baku time), the last 7 and 30 days.
      const periods=`(created_at>=date_trunc('day',now() at time zone 'Asia/Baku') at time zone 'Asia/Baku')::int d1,(created_at>=now()-interval '7 days')::int d7,(created_at>=now()-interval '30 days')::int d30`;
      const [userPeriods,listingPeriods,activity]=await Promise.all([
        hostQuery<{today:string;week:string;month:string}>(`select coalesce(sum(d1),0)::text as today,coalesce(sum(d7),0)::text as week,coalesce(sum(d30),0)::text as month from (select ${periods} from auth.users where created_at>=now()-interval '30 days') x`),
        hostQuery<{today:string;week:string;month:string}>(`select coalesce(sum(d1),0)::text as today,coalesce(sum(d7),0)::text as week,coalesce(sum(d30),0)::text as month from (select ${periods} from public.listings where created_at>=now()-interval '30 days') x`),
        hostQuery(`select e.id,e.listing_id,e.action,e.actor_kind,e.new_status,e.reason,e.created_at,p.display_name actor_name,l.title from public.moderation_events e left join public.profiles p on p.id=e.actor_id left join public.listings l on l.id=e.listing_id where e.actor_kind='admin' order by e.id desc limit 8`),
      ]);
      const period=(rows:{today:string;week:string;month:string}[])=>({today:Number(rows[0]?.today||0),week:Number(rows[0]?.week||0),month:Number(rows[0]?.month||0)});
      return reply({role:auth.role,periods:{users:period(userPeriods),listings:period(listingPeriods)},activity,counts:{users:Number(users[0]?.count||0),listings:Number(listings[0]?.count||0),messages:Number(messages[0]?.count||0),reports:Number(reports[0]?.count||0),stores:Number(storeRequests[0]?.count||0),statuses:Object.fromEntries(statusRows.map(row=>[row.status,Number(row.count)]))}});
    }

    if(action==="listings"){
      const status=param(request,"status"),search=param(request,"query").replace(/[(),.%_"\\]/g," ").trim().slice(0,100),kind=param(request,"kind"),from=param(request,"from");
      const page=Math.max(1,Math.min(10000,Number(param(request,"page"))||1));
      const where:string[]=[],values:unknown[]=[];
      const add=(sql:string,value:unknown)=>{values.push(value);where.push(sql.replace("?",`$${values.length}`));};
      if(status==="archived")where.push(`l.status in ('archived','expired')`);
      else if(listingStatuses.has(status))add("l.status=?",status);
      if(search){
        if(uuid.test(search))add("l.id=?",search);
        else if(/^\d{8,18}$/.test(search)){values.push(search);where.push(`(l.listing_no=$${values.length}::bigint or l.contact ilike '%'||$${values.length}||'%')`);}
        else{values.push(`%${search}%`);where.push(`(l.title ilike $${values.length} or l.contact ilike $${values.length})`);}
      }
      if(kind==="new"||kind==="edited")add("l.review_kind=?",kind);
      const owner=param(request,"owner");if(uuid.test(owner))add("l.owner_id=?",owner);
      if(day.test(from)&&Number.isFinite(Date.parse(from))){values.push(`${from}T00:00:00+04:00`);where.push(`l.created_at>=$${values.length}::timestamptz`);values.push(`${from}T23:59:59.999999+04:00`);where.push(`l.created_at<=$${values.length}::timestamptz`);}
      const condition=where.length?`where ${where.join(" and ")}`:"";
      const [items,total]=await Promise.all([
        hostQuery(`select l.*,u.email owner_email,p.display_name owner_name,p.profile_no,(select count(*)::int from public.listing_views v where v.listing_id=l.id) as views,(select count(*)::int from public.listings x where x.id<>l.id and x.owner_id<>l.owner_id and x.created_at>now()-interval '180 days' and (x.contact=l.contact or x.images && l.images)) as signal_count from public.listings l join auth.users u on u.id=l.owner_id left join public.profiles p on p.id=l.owner_id ${condition} order by l.created_at desc,l.id desc limit ${PAGE} offset ${(page-1)*PAGE}`,values as never[]),
        hostQuery<{count:string}>(`select count(*)::text count from public.listings l ${condition}`,values as never[]),
      ]);
      return reply({items,total:Number(total[0]?.count||0),pageSize:PAGE,role:auth.role});
    }

    // Owner history, report counts, last events and similar listings for one listing.
    if(action==="context"){
      const id=param(request,"id");if(!uuid.test(id))return reply({error:"INVALID_LISTING"},400);
      const base=await hostQuery<{owner_id:string;contact:string;images:string[];title:string;description:string}>(`select owner_id,contact,images,title,description from public.listings where id=$1`,[id]);
      if(!base[0])return reply({error:"NOT_FOUND"},404);
      const l=base[0];
      const [owner,ownerListings,reports,events,signals]=await Promise.all([
        hostQuery(`select u.id,p.display_name as name,u.created_at joined_at from auth.users u left join public.profiles p on p.id=u.id where u.id=$1`,[l.owner_id]),
        hostQuery(`select id,title,status,rejection_reason,created_at from public.listings where owner_id=$1 order by created_at desc limit 20`,[l.owner_id]),
        hostQuery<{status:string;count:string}>(`select r.status,count(*)::text count from public.listing_reports r join public.listings x on x.id=r.listing_id where x.owner_id=$1 group by r.status`,[l.owner_id]),
        hostQuery(`select e.*,p.display_name actor_name from public.moderation_events e left join public.profiles p on p.id=e.actor_id where e.listing_id=$1 order by e.id desc limit 10`,[id]),
        hostQuery(`select * from (select x.id,x.title,x.owner_id,x.status,(x.contact=$2) same_phone,(x.images && $3::text[]) same_image,(lower(regexp_replace(x.title,'\\s+',' ','g'))=lower(regexp_replace($4,'\\s+',' ','g')) or lower(regexp_replace(x.description,'\\s+',' ','g'))=lower(regexp_replace($5,'\\s+',' ','g'))) similar_text from (select * from public.listings where id<>$1 and created_at>now()-interval '180 days' order by created_at desc limit 500) x) s where same_phone or same_image or similar_text limit 8`,[id,l.contact,l.images||[],l.title,l.description]),
      ]);
      const count=(status:string)=>Number(reports.find(row=>row.status===status)?.count||0);
      return reply({owner:owner[0],owner_listings:ownerListings,reports:{open:count("open"),resolved:count("resolved")},events,signals});
    }

    if(action==="history"){
      const before=Number(param(request,"before"))||null;
      const rows=await hostQuery<{id:string}>(`select e.*,p.display_name actor_name from public.moderation_events e left join public.profiles p on p.id=e.actor_id where ($1::bigint is null or e.id<$1) order by e.id desc limit 51`,[before]);
      return reply({events:rows.slice(0,50),next:rows.length>50?rows[49].id:null});
    }

    if(action==="reports"){
      const tab=param(request,"tab")==="resolved"?"resolved":"open",search=param(request,"query"),from=param(request,"from"),page=Math.max(0,Number(param(request,"page"))||0);
      const where=["r.status=$1"],values:unknown[]=[tab];
      if(/^\d{8,18}$/.test(search)){values.push(search);where.push(`r.report_no=$${values.length}::bigint`);}
      if(day.test(from)&&Number.isFinite(Date.parse(from))){values.push(`${from}T00:00:00+04:00`);where.push(`r.created_at>=$${values.length}::timestamptz`);values.push(`${from}T23:59:59.999999+04:00`);where.push(`r.created_at<=$${values.length}::timestamptz`);}
      const items=await hostQuery(`select r.id,r.report_no,r.reason,r.message,r.status,r.created_at,r.resolved_at,r.resolved_by,r.listing_id,l.title,l.listing_no,u.email reporter_email from public.listing_reports r join public.listings l on l.id=r.listing_id join auth.users u on u.id=r.reporter_id where ${where.join(" and ")} order by r.created_at desc,r.id desc limit ${REPORT_PAGE} offset ${page*REPORT_PAGE}`,values as never[]);
      return reply({items,pageSize:REPORT_PAGE,role:auth.role});
    }

    // Free listing rules (leader only): groups, always-paid categories and the on/off switch.
    if(action==="limit_rules"){
      if(auth.role!=="leader")return reply({error:"FORBIDDEN"},403);
      return reply({rules:await limitRules()});
    }

    // Stores: applications and active stores, plus the packages (prices are edited by the leader).
    if(action==="stores"){
      const items=await hostQuery(`select s.*,u.email owner_email,p.display_name owner_name,pl.name as plan_name,(case when s.terms_set then s.terms_price else pl.price end)::text as plan_price,(select count(*)::int from public.listings l where l.owner_id=s.owner_id and l.status='published' and l.deleted_at is null) as listings from public.stores s join auth.users u on u.id=s.owner_id left join public.profiles p on p.id=s.owner_id join public.store_plans pl on pl.id=s.plan order by case s.status when 'pending' then 0 when 'active' then 1 else 2 end,s.updated_at desc limit 200`);
      const plans=await hostQuery(`select id,name,price::text price,listing_limit,free_bumps,featured from public.store_plans order by sort`);
      return reply({items,plans,role:auth.role});
    }

    if(action==="users"){
      const query=param(request,"query").replace(/[%_]/g,"").slice(0,100);
      const items=await hostQuery(`select u.id,u.email,u.email_confirmed_at,u.created_at,p.display_name,p.phone,p.profile_no,p.role,s.staff_role,u.disabled_at is not null as blocked,u.blocked_reason,(select count(*)::int from public.listings l where l.owner_id=u.id) listing_count from auth.users u join public.profiles p on p.id=u.id left join public.staff_members s on s.user_id=u.id where ($1='' or u.email ilike '%'||$1||'%' or p.display_name ilike '%'||$1||'%' or p.profile_no::text ilike '%'||$1||'%' or regexp_replace(p.phone,'\D','','g') ilike '%'||regexp_replace($1,'\D','','g')||'%' and regexp_replace($1,'\D','','g')<>'') order by u.created_at desc limit 100`,[query]);
      return reply({items,role:auth.role});
    }

    if(action==="staff"){
      if(auth.role!=="leader")return reply({error:"FORBIDDEN"},403);
      const before=Number(param(request,"before"))||null;
      // The team list and the history load separately: one failing must not hide the other.
      const [members,events]=await Promise.allSettled([
        before?Promise.resolve([]):hostQuery(`select u.id,u.email,(u.email_confirmed_at is not null) confirmed,p.display_name as name,p.phone,p.profile_no,s.staff_role as role,s.assigned_at from public.staff_members s join auth.users u on u.id=s.user_id left join public.profiles p on p.id=s.user_id order by case when s.staff_role='leader' then 0 else 1 end,s.assigned_at`),
        hostQuery<{id:string}>(`select e.id,e.action,e.created_at,e.actor_id,e.target_id,a.email actor_email,t.email target_email from public.staff_events e left join auth.users a on a.id=e.actor_id left join auth.users t on t.id=e.target_id where ($1::bigint is null or e.id<$1) order by e.id desc limit 51`,[before]),
      ]);
      if(members.status==="rejected")throw members.reason;
      if(events.status==="rejected")console.error("admin staff events",events.reason);
      const history=events.status==="fulfilled"?events.value:[];
      return reply({members:members.value,events:history.slice(0,50),next:history.length>50?history[49].id:null,role:auth.role});
    }

    if(action==="find"){
      if(auth.role!=="leader")return reply({error:"FORBIDDEN"},403);
      const query=param(request,"query").slice(0,254);if(query.length<3)return reply({error:"INVALID_REQUEST"},400);
      const digits=query.replace(/\D/g,"");
      // Exact e-mail, account number or phone first; otherwise part of the e-mail or name.
      const rows=await hostQuery(`select u.id,u.email,(u.email_confirmed_at is not null) confirmed,p.display_name as name,p.phone,p.profile_no,coalesce(s.staff_role,'user') as role from auth.users u left join public.profiles p on p.id=u.id left join public.staff_members s on s.user_id=u.id
        where lower(trim(u.email))=lower($1::text) or u.id::text=$1::text
          or ($2::text<>'' and length($2::text)>=6 and (right(regexp_replace(coalesce(p.phone,''),'\\D','','g'),9)=right($2::text,9) or p.profile_no::text=$2::text))
          or position(lower($1::text) in lower(u.email))>0
          or ($2::text='' and position(lower($1::text) in lower(coalesce(p.display_name,'')))>0)
        order by (lower(trim(u.email))=lower($1::text)) desc,u.created_at desc limit 10`,[query,digits]);
      if(!rows.length)return reply({error:"NOT_FOUND"},404);
      return reply({account:rows.length===1?rows[0]:null,accounts:rows});
    }
    return reply({error:"UNKNOWN_ACTION"},400);
  }catch(error){return failure(error,staff);}
}

export async function POST(request:NextRequest){
  let staff=false;
  try{
    const auth=await access();
    if(!auth)return reply({error:"FORBIDDEN"},403);
    staff=true;
    const body=await request.json() as Record<string,unknown>,action=String(body.action||"");

    if(action==="moderate"){
      const id=String(body.id||""),status=String(body.status||""),from=String(body.from||"pending"),reason=String(body.reason||"").trim().slice(0,500);
      if(!uuid.test(id)||!["published","rejected"].includes(status)||!["pending","published","rejected"].includes(from)||from===status||(status==="rejected"&&reason.length<10))return reply({error:"INVALID_ACTION"},400);
      const done=await hostTransaction(async db=>{
        const before=await db.query(`select first_published_at,category,owner_id from public.listings where id=$1 for update`,[id]);
        const rows=await db.query(`update public.listings set status=$2,rejection_reason=$4,first_published_at=case when $2='published' then coalesce(first_published_at,now()) else first_published_at end,expires_at=case when $2='published' and (expires_at is null or expires_at<=now()) then now()+interval '30 days' else expires_at end,updated_at=now() where id=$1 and status=$3 returning id,owner_id`,[id,status,from,status==="rejected"?reason:null]);
        if(!rows.rows[0])return false;
        await db.query(`insert into public.moderation_events(listing_id,owner_id,actor_id,actor_kind,action,old_status,new_status,reason) values($1,$2,$3,'admin',$4,$5,$6,$7)`,[id,rows.rows[0].owner_id,auth.user.id,status==="published"?"approved":"rejected",from,status,status==="rejected"?reason:null]);
        // The first approval uses one free placement; later approvals after edits do not.
        if(status==="published"&&before.rows[0]&&!before.rows[0].first_published_at)await db.query(`insert into public.listing_placements(owner_id,listing_id,category) values($1,$2,$3)`,[before.rows[0].owner_id,id,before.rows[0].category]);
        return true;
      });
      if(done&&status==="rejected")void notifyRejected(id,reason);
      return done?reply({ok:true}):reply({error:"STATUS_CHANGED"},409);
    }

    if(action==="reorder_images"){
      const id=String(body.id||""),images=Array.isArray(body.images)?body.images.map(String):[];
      if(!uuid.test(id)||!images.length||images.length>20)return reply({error:"INVALID_ACTION"},400);
      const done=await hostTransaction(async db=>{
        const rows=await db.query<{images:string[];owner_id:string;status:string}>(`select images,owner_id,status from public.listings where id=$1 for update`,[id]);
        const current=rows.rows[0];
        // Only the order may change: the same photos, each exactly once.
        if(!current||current.images.length!==images.length||new Set(images).size!==images.length||!images.every((src:string)=>current.images.includes(src)))return false;
        await db.query(`update public.listings set images=$2,updated_at=now() where id=$1`,[id,images]);
        await db.query(`insert into public.moderation_events(listing_id,owner_id,actor_id,actor_kind,action,old_status,new_status,reason) values($1,$2,$3,'admin','images_reordered',$4,$4,null)`,[id,current.owner_id,auth.user.id,current.status]);
        return true;
      });
      return done?reply({ok:true}):reply({error:"STATUS_CHANGED"},409);
    }

    if(action==="resolve_report"){
      const id=String(body.id||"");if(!uuid.test(id))return reply({error:"INVALID_REPORT"},400);
      const done=await hostTransaction(async db=>{
        const rows=await db.query(`update public.listing_reports set status='resolved',resolved_at=now(),resolved_by=$2 where id=$1 and status='open' returning reporter_id`,[id,auth.user.id]);
        if(!rows.rows[0])return false;
        await db.query(`insert into public.staff_events(actor_id,target_id,action) values($1,$2,'report_resolved')`,[auth.user.id,rows.rows[0].reporter_id]);
        return true;
      });
      return done?reply({ok:true}):reply({error:"ALREADY_RESOLVED"},409);
    }

    if(action==="store_decide"){
      const id=String(body.id||""),decision=String(body.decision||""),days=Math.max(1,Math.min(366,Number(body.days)||30)),reason=String(body.reason||"").trim().slice(0,300);
      if(!uuid.test(id)||!["activate","reject","stop"].includes(decision)||(decision==="reject"&&reason.length<5))return reply({error:"INVALID_ACTION"},400);
      const rows=await hostQuery(decision==="activate"
        ?`update public.stores s set status='active',reject_reason=null,active_until=greatest(coalesce(s.active_until,now()),now())+make_interval(days=>$2::int),terms_set=true,terms_price=p.price,terms_listing_limit=p.listing_limit,terms_free_bumps=p.free_bumps,bumps_used=0,bumps_month_start=now(),updated_at=now() from public.store_plans p where p.id=s.plan and s.id=$1 returning s.id`
        :decision==="reject"?`update public.stores set status='rejected',reject_reason=$2,updated_at=now() where id=$1 returning id`
        :`update public.stores set status='expired',active_until=now(),updated_at=now() where id=$1 returning id`,decision==="stop"?[id]:[id,decision==="activate"?days:reason]);
      return rows[0]?reply({ok:true}):reply({error:"NOT_FOUND"},404);
    }
    if(action==="save_limit_rules"){
      if(auth.role!=="leader")return reply({error:"FORBIDDEN"},403);
      await saveLimitRules(cleanLimitRules(body.rules));
      return reply({ok:true});
    }
    if(action==="store_plan"){
      if(auth.role!=="leader")return reply({error:"FORBIDDEN"},403);
      const id=String(body.id||""),price=Number(body.price),limit=body.listing_limit===null||body.listing_limit===""?null:Number(body.listing_limit),bumps=Number(body.free_bumps)||0;
      if(!["start","business","premium"].includes(id)||!(price>=0&&price<=100000)||(limit!==null&&!(Number.isInteger(limit)&&limit>0&&limit<=100000))||!(bumps>=0&&bumps<=1000))return reply({error:"INVALID_ACTION"},400);
      await hostQuery(`update public.store_plans set price=$2,listing_limit=$3,free_bumps=$4 where id=$1`,[id,price,limit,bumps]);
      return reply({ok:true});
    }

    // Block / unblock an account (admins and the leader). Staff accounts and the owner cannot be blocked.
    if(action==="block_user"){
      const id=String(body.id||""),blocked=body.blocked===true,reason=String(body.reason||"").trim().slice(0,300);
      if(!uuid.test(id)||id===auth.user.id||(blocked&&reason.length<5))return reply({error:"INVALID_ACTION"},400);
      const target=await hostQuery<{email:string;staff_role:string|null}>(`select u.email,s.staff_role from auth.users u left join public.staff_members s on s.user_id=u.id where u.id=$1`,[id]);
      if(!target[0])return reply({error:"USER_NOT_FOUND"},404);
      if(target[0].staff_role||target[0].email.toLowerCase()===ownerEmail)return reply({error:"STAFF_PROTECTED"},409);
      await hostTransaction(async db=>{
        await db.query(`update auth.users set disabled_at=case when $2 then now() else null end,blocked_reason=case when $2 then $3 else null end,blocked_by=case when $2 then $4::uuid else null end where id=$1`,[id,blocked,reason,auth.user.id]);
        if(blocked)await db.query(`update auth.sessions set revoked_at=now() where user_id=$1 and revoked_at is null`,[id]);
        await db.query(`insert into public.staff_events(actor_id,target_id,action) values($1,$2,$3)`,[auth.user.id,id,blocked?"user_blocked":"user_unblocked"]);
      });
      return reply({ok:true});
    }

    if(action==="set_staff"){
      if(auth.role!=="leader")return reply({error:"FORBIDDEN"},403);
      const id=String(body.id||""),enabled=body.enabled===true;
      if(!uuid.test(id)||id===auth.user.id)return reply({error:"INVALID_STAFF"},400);
      const result=await hostTransaction(async db=>{
        const target=await db.query(`select u.id,(u.email_confirmed_at is not null) confirmed,s.staff_role from auth.users u left join public.staff_members s on s.user_id=u.id where u.id=$1 for update of u`,[id]);
        const row=target.rows[0];
        if(!row)return"USER_NOT_FOUND";
        if(row.staff_role==="leader")return"LEADER_PROTECTED";
        if(enabled){
          if(!row.confirmed)return"EMAIL_NOT_CONFIRMED";
          await db.query(`insert into public.profiles(id,display_name,phone,role) select u.id,split_part(u.email,'@',1),'','admin' from auth.users u where u.id=$1 on conflict(id) do update set role='admin',updated_at=now()`,[id]);
          await db.query(`insert into public.staff_members(user_id,staff_role,assigned_by) values($1,'moderator',$2) on conflict(user_id) do nothing`,[id,auth.user.id]);
          await db.query(`insert into public.staff_events(actor_id,target_id,action) values($1,$2,'moderator_granted')`,[auth.user.id,id]);
        }else{
          await db.query(`delete from public.staff_members where user_id=$1`,[id]);
          await db.query(`update public.profiles set role='user',updated_at=now() where id=$1`,[id]);
          await db.query(`insert into public.staff_events(actor_id,target_id,action) values($1,$2,'moderator_revoked')`,[auth.user.id,id]);
        }
        return"OK";
      });
      return result==="OK"?reply({ok:true}):reply({error:result},result==="USER_NOT_FOUND"?404:409);
    }
    return reply({error:"UNKNOWN_ACTION"},400);
  }catch(error){return failure(error,staff);}
}
