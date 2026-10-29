import {NextRequest,NextResponse} from "next/server";
import {sameOrigin} from "../../../../lib/server-request";
import {hostTransaction} from "../../../../lib/host/db";
import {currentUser} from "../../../../lib/host/session";
import {freeLimit} from "../../../../lib/host/limits";

export const dynamic="force-dynamic";
const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});

// Publishes an expired or deleted listing again for 30 days. The same listing is reused (no duplicate)
// and one free placement of its category is used. Rejected listings cannot be restored this way.
export async function POST(request:NextRequest){
  if(!sameOrigin(request))return reply({error:"FORBIDDEN"},403);
  try{
    const user=await currentUser();if(!user)return reply({error:"SIGN_IN_REQUIRED"},401);
    const id=String((await request.json() as {id?:unknown}).id||"");if(!uuid.test(id))return reply({error:"INVALID_LISTING"},400);
    const result=await hostTransaction(async db=>{
      const rows=await db.query<{category:string;status:string}>(`select category,status from public.listings where id=$1 and owner_id=$2 and (status in('expired','archived') or (status='published' and expires_at<=now())) for update`,[id,user.id]);
      const item=rows.rows[0];if(!item)return{error:"NOT_RESTORABLE"};
      const limit=await freeLimit(user.id,item.category);
      if(limit.remaining<=0)return{error:"LIMIT_REACHED",next_free_at:limit.next_free_at};
      await db.query(`update public.listings set status='published',deleted_at=null,expires_at=now()+interval '30 days',updated_at=now() where id=$1`,[id]);
      await db.query(`insert into public.listing_placements(owner_id,listing_id,category,reason) values($1,$2,$3,'restore')`,[user.id,id,item.category]);
      await db.query(`insert into public.moderation_events(listing_id,owner_id,actor_id,actor_kind,action,old_status,new_status) values($1,$2,$2,'owner','restored',$3,'published')`,[id,user.id,item.status]);
      return{ok:true};
    });
    if("error" in result)return reply(result,result.error==="LIMIT_REACHED"?429:409);
    return reply({ok:true});
  }catch{return reply({error:"RESTORE_FAILED"},503);}
}
