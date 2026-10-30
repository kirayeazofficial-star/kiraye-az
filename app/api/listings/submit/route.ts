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
      const rows=await db.query<{category:string}>(`select category from public.listings where id=$1 and owner_id=$2 and payment_required and status='draft' and deleted_at is null for update`,[id,user.id]);
      const item=rows.rows[0];if(!item)return"NOT_WAITING";
      if(!leader&&(await freeLimit(user.id,item.category)).remaining<=0)return"LIMIT_REACHED";
      await db.query(`update public.listings set status='pending',payment_required=false,updated_at=now() where id=$1`,[id]);
      await db.query(`insert into public.moderation_events(listing_id,owner_id,actor_id,actor_kind,action,old_status,new_status) values($1,$2,$2,'owner','submitted','draft','pending')`,[id,user.id]);
      return"OK";
    });
    return result==="OK"?reply({ok:true}):reply({error:result},result==="LIMIT_REACHED"?429:409);
  }catch{return reply({error:"SUBMIT_FAILED"},503);}
}
