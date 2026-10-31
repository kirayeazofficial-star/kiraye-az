import {NextRequest,NextResponse} from "next/server";
import {hostQuery,hostTransaction} from "../../../lib/host/db";
import {currentUser} from "../../../lib/host/session";
import {newId} from "../../../lib/host/security";
import {notifyNewMessage} from "../../../lib/host/notify";

export const dynamic="force-dynamic";
const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
function reply(data:unknown,status=200){return NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});}
async function member(thread:string,user:string){const rows=await hostQuery<{id:string}>(`select id from public.chat_threads where id=$1 and (buyer_id=$2 or seller_id=$2)`,[thread,user]);return !!rows[0];}

async function tooFast(user:string){const rows=await hostQuery<{count:string}>(`select count(*)::text count from public.chat_messages where author_id=$1 and created_at>now()-interval '1 minute'`,[user]);return Number(rows[0]?.count||0)>=15;}

export async function GET(request:NextRequest){
 try{
  const user=await currentUser();if(!user)return reply({error:"SIGN_IN_REQUIRED"},401);
  const action=request.nextUrl.searchParams.get("action")||"inbox",thread=request.nextUrl.searchParams.get("thread")||"";
  if(action==="unread"){
   const rows=await hostQuery<{count:string}>(`select count(*)::text count from public.chat_messages m join public.chat_threads t on t.id=m.thread_id left join public.chat_reads r on r.thread_id=t.id and r.user_id=$1 where (t.buyer_id=$1 or t.seller_id=$1) and m.author_id<>$1 and m.id>coalesce(r.last_message_id,0)`,[user.id]);return reply({count:Number(rows[0]?.count||0)});
  }
  if(action==="messages"){
   if(!uuid.test(thread)||!await member(thread,user.id))return reply({error:"THREAD_NOT_FOUND"},404);
   const rows=await hostQuery(`select id,author_id,body,created_at from public.chat_messages where thread_id=$1 order by id desc limit 50`,[thread]);return reply({items:rows.reverse()});
  }
  if(action==="thread"){
   if(!uuid.test(thread))return reply({error:"THREAD_NOT_FOUND"},404);
   const rows=await hostQuery(`select t.id,t.listing_id,t.listing_title,t.listing_image,(l.status='published' and (l.expires_at is null or l.expires_at>now())) listing_active,coalesce(p.display_name,'İstifadəçi') peer_name,p.profile_no peer_no,to_jsonb(p)->>'avatar_url' peer_avatar,exists(select 1 from public.chat_blocks b where (b.blocker_id=t.buyer_id and b.blocked_id=t.seller_id) or (b.blocker_id=t.seller_id and b.blocked_id=t.buyer_id)) blocked,exists(select 1 from public.chat_blocks b where b.blocker_id=$2 and b.blocked_id=case when t.buyer_id=$2 then t.seller_id else t.buyer_id end) blocked_by_me,t.last_message_at from public.chat_threads t join public.listings l on l.id=t.listing_id left join public.profiles p on p.id=case when t.buyer_id=$2 then t.seller_id else t.buyer_id end where t.id=$1 and (t.buyer_id=$2 or t.seller_id=$2)`,[thread,user.id]);return rows[0]?reply({item:rows[0]}):reply({error:"THREAD_NOT_FOUND"},404);
  }
  const rows=await hostQuery(`select t.id,t.listing_id,t.listing_title,t.listing_image,(l.status='published' and (l.expires_at is null or l.expires_at>now())) listing_active,coalesce(p.display_name,'İstifadəçi') peer_name,p.profile_no peer_no,to_jsonb(p)->>'avatar_url' peer_avatar,t.last_message_at,(t.buyer_id=$1) is_buyer,m.body preview,(select count(*)::int from public.chat_messages x where x.thread_id=t.id and x.author_id<>$1 and x.id>coalesce(r.last_message_id,0)) unread,exists(select 1 from public.chat_blocks b where (b.blocker_id=t.buyer_id and b.blocked_id=t.seller_id) or (b.blocker_id=t.seller_id and b.blocked_id=t.buyer_id)) blocked,exists(select 1 from public.chat_blocks b where b.blocker_id=$1 and b.blocked_id=case when t.buyer_id=$1 then t.seller_id else t.buyer_id end) blocked_by_me from public.chat_threads t join public.listings l on l.id=t.listing_id left join public.profiles p on p.id=case when t.buyer_id=$1 then t.seller_id else t.buyer_id end left join lateral(select body from public.chat_messages where thread_id=t.id order by id desc limit 1)m on true left join public.chat_reads r on r.thread_id=t.id and r.user_id=$1 where t.buyer_id=$1 or t.seller_id=$1 order by t.last_message_at desc limit 30`,[user.id]);return reply({items:rows});
 }catch{return reply({error:"MESSAGES_UNAVAILABLE"},503);}
}

export async function POST(request:NextRequest){
 try{
  const user=await currentUser();if(!user)return reply({error:"SIGN_IN_REQUIRED"},401);
  const body=await request.json() as Record<string,unknown>,action=String(body.action||""),text=String(body.body||"").trim().slice(0,3000),thread=String(body.thread||"");
  if((action==="start"||action==="send")&&await tooFast(user.id))return reply({error:"RATE_LIMIT"},429);
  if(action==="start"){
   const listing=String(body.listing||"");if(!uuid.test(listing)||!text)return reply({error:"INVALID_MESSAGE"},400);
   const found=await hostQuery<{id:string;owner_id:string;title:string;image:string|null}>(`select id,owner_id,title,images[1] image from public.listings where id=$1 and status='published' and (expires_at is null or expires_at>now())`,[listing]);const item=found[0];
   if(!item)return reply({error:"LISTING_NOT_FOUND"},404);if(item.owner_id===user.id)return reply({error:"OWN_LISTING"},400);
   const blockedStart=await hostQuery(`select 1 from public.chat_blocks where (blocker_id=$1 and blocked_id=$2) or (blocker_id=$2 and blocked_id=$1)`,[user.id,item.owner_id]);if(blockedStart[0])return reply({error:"BLOCKED"},403);
   const id=newId();return reply(await hostTransaction(async db=>{const inserted=await db.query<{id:string}>(`insert into public.chat_threads(id,listing_id,buyer_id,seller_id,listing_title,listing_image) values($1,$2,$3,$4,$5,$6) on conflict(listing_id,buyer_id,seller_id) do update set last_message_at=now() returning id`,[id,item.id,user.id,item.owner_id,item.title,item.image]);const threadId=inserted.rows[0].id;await db.query(`insert into public.chat_messages(thread_id,author_id,body) values($1,$2,$3)`,[threadId,user.id,text]);return{thread:threadId};}).then(result=>{void notifyNewMessage(result.thread,user.id);return result;}),201);
  }
  if(!uuid.test(thread)||!await member(thread,user.id))return reply({error:"THREAD_NOT_FOUND"},404);
  if(action==="send"){
   if(!text)return reply({error:"INVALID_MESSAGE"},400);const blocked=await hostQuery(`select 1 from public.chat_threads t join public.chat_blocks b on (b.blocker_id=t.buyer_id and b.blocked_id=t.seller_id) or (b.blocker_id=t.seller_id and b.blocked_id=t.buyer_id) where t.id=$1`,[thread]);if(blocked[0])return reply({error:"BLOCKED"},403);
   const rows=await hostQuery(`with sent as(insert into public.chat_messages(thread_id,author_id,body) values($1,$2,$3) returning id,author_id,body,created_at) update public.chat_threads set last_message_at=now() where id=$1 returning (select row_to_json(sent) from sent) message`,[thread,user.id,text]);void notifyNewMessage(thread,user.id);return reply((rows[0] as {message:unknown}).message,201);
  }
  if(action==="read"){const message=Number(body.message)||0;await hostQuery(`insert into public.chat_reads(thread_id,user_id,last_message_id) values($1,$2,$3) on conflict(thread_id,user_id) do update set last_message_id=greatest(chat_reads.last_message_id,excluded.last_message_id),updated_at=now()`,[thread,user.id,message]);return reply({ok:true});}
  if(action==="block"){const peer=await hostQuery<{peer:string}>(`select case when buyer_id=$2 then seller_id else buyer_id end peer from public.chat_threads where id=$1`,[thread,user.id]);if(!peer[0])return reply({error:"THREAD_NOT_FOUND"},404);if(body.block)await hostQuery(`insert into public.chat_blocks(blocker_id,blocked_id) values($1,$2) on conflict do nothing`,[user.id,peer[0].peer]);else await hostQuery(`delete from public.chat_blocks where blocker_id=$1 and blocked_id=$2`,[user.id,peer[0].peer]);return reply({ok:true});}
  return reply({error:"INVALID_ACTION"},400);
 }catch{return reply({error:"MESSAGE_FAILED"},503);}
}
