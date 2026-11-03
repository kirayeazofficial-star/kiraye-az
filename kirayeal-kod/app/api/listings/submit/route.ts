import {isLeader} from "../../../../lib/host/staff";
import {NextRequest,NextResponse} from "next/server";
import {sameOrigin} from "../../../../lib/server-request";
import {hostTransaction} from "../../../../lib/host/db";
import {currentUser} from "../../../../lib/host/session";
import {freeLimit} from "../../../../lib/host/limits";

export const dynamic="force-dynamic";
const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});

// Sends a listing that waits for payment to review once a free place in its category is available again.
export async function POST(request:NextRequest){
  if(!sameOrigin(request))return reply({error:"FORBIDDEN"},403);
  try{
    const user=await currentUser();if(!user)return reply({error:"SIGN_IN_REQUIRED"},401);
    const id=String((await request.json() as {id?:unknown}).id||"");if(!uuid.test(id))return reply({error:"INVALID_LISTING"},400);
    const leader=await isLeader(user);
    const result=await hostTransaction(async db=>{
      const rows=await db.query<{owner_id:string;category:string;status:string;contact:string;paid_reason:string|null;payment_required:boolean}>(`select owner_id,category,status,contact,paid_reason,payment_required from public.listings where id=$1 and (owner_id=$2 or $3::boolean) and status in ('draft','rejected','pending','published') and deleted_at is null for update`,[id,user.id,leader]);
      const item=rows.rows[0];if(!item)return"NOT_WAITING";
      if(!item.payment_required)return ["pending","published"].includes(item.status)?{status:item.status,already_submitted:true}:"NOT_WAITING";
      // Older restores left published listings on payment hold. Repair that state without sending a live listing back to review.
      if(item.status==="published"){
        if(!leader)return "NOT_WAITING";
        await db.query(`update public.listings set payment_required=false,paid_reason=null,updated_at=now() where id=$1`,[id]);
        await db.query(`insert into public.moderation_events(listing_id,owner_id,actor_id,actor_kind,action,old_status,new_status) values($1,$2,$3,'admin','payment_waived','published','published')`,[id,item.owner_id,user.id]);
        return {status:"published",already_submitted:true};
      }
      // For regular accounts, a repeat listing (same photos within 90 days) is always paid; otherwise it goes once a free place is back.
      if(!leader&&(item.paid_reason==="repeat"||(await freeLimit(item.owner_id,item.category,item.contact)).remaining<=0))return"LIMIT_REACHED";
      await db.query(`update public.listings set status='pending',payment_required=false,paid_reason=null,review_kind=case when status='rejected' then 'edited' else review_kind end,updated_at=now() where id=$1`,[id]);
      await db.query(`insert into public.moderation_events(listing_id,owner_id,actor_id,actor_kind,action,old_status,new_status) values($1,$2,$3,$4,'submitted',$5,'pending')`,[id,item.owner_id,user.id,leader?"admin":"owner",item.status]);
      return {status:"pending",already_submitted:false};
    });
    return typeof result==="object"?reply({ok:true,...result}):reply({error:result},result==="LIMIT_REACHED"?429:409);
  }catch{return reply({error:"SUBMIT_FAILED"},503);}
}
