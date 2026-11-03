import {NextRequest,NextResponse} from "next/server";
import {sameOrigin} from "../../../../lib/server-request";
import {hostTransaction} from "../../../../lib/host/db";
import {currentUser} from "../../../../lib/host/session";
import {isLeader} from "../../../../lib/host/staff";

export const dynamic="force-dynamic";
const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});

// Restoring an expired or deleted listing is a paid service (as on the big classified sites). Until
// payments are connected ordinary users get PAYMENT_REQUIRED; only the leader can restore any listing for free.
export async function POST(request:NextRequest){
  if(!sameOrigin(request))return reply({error:"FORBIDDEN"},403);
  try{
    const user=await currentUser();if(!user)return reply({error:"SIGN_IN_REQUIRED"},401);
    const id=String((await request.json() as {id?:unknown}).id||"");if(!uuid.test(id))return reply({error:"INVALID_LISTING"},400);
    const leader=await isLeader(user);
    const result=await hostTransaction(async db=>{
      const rows=await db.query<{id:string;owner_id:string;status:string}>(`select id,owner_id,status from public.listings where id=$1 and (owner_id=$2 or $3::boolean) and (status in('expired','archived') or (status='published' and expires_at<=now()) or deleted_at is not null) for update`,[id,user.id,leader]);
      const item=rows.rows[0];if(!item)return "NOT_RESTORABLE";
      if(!leader)return "PAYMENT_REQUIRED";
      // Restoring and removing the payment hold must be one operation, including for previously deleted listings.
      await db.query(`update public.listings set status='published',deleted_at=null,payment_required=false,paid_reason=null,first_published_at=coalesce(first_published_at,now()),expires_at=now()+interval '30 days',updated_at=now() where id=$1`,[id]);
      await db.query(`insert into public.moderation_events(listing_id,owner_id,actor_id,actor_kind,action,old_status,new_status) values($1,$2,$3,'admin','restored',$4,'published')`,[id,item.owner_id,user.id,item.status]);
      return "OK";
    });
    return result==="OK"?reply({ok:true,status:"published"}):reply({error:result},result==="PAYMENT_REQUIRED"?402:409);
  }catch{return reply({error:"RESTORE_FAILED"},503);}
}
