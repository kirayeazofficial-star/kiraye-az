import {NextRequest,NextResponse} from "next/server";
import {sameOrigin} from "../../../../lib/server-request";
import {hostQuery} from "../../../../lib/host/db";
import {currentUser} from "../../../../lib/host/session";
import {isLeader} from "../../../../lib/host/staff";

export const dynamic="force-dynamic";
const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});

// Restoring an expired or deleted listing is a paid service (as on the big classified sites). Until
// payments are connected ordinary users get PAYMENT_REQUIRED; the leader restores their own listings for free.
export async function POST(request:NextRequest){
  if(!sameOrigin(request))return reply({error:"FORBIDDEN"},403);
  try{
    const user=await currentUser();if(!user)return reply({error:"SIGN_IN_REQUIRED"},401);
    const id=String((await request.json() as {id?:unknown}).id||"");if(!uuid.test(id))return reply({error:"INVALID_LISTING"},400);
    const rows=await hostQuery<{id:string;status:string}>(`select id,status from public.listings where id=$1 and owner_id=$2 and (status in('expired','archived') or (status='published' and expires_at<=now()) or deleted_at is not null)`,[id,user.id]);
    if(!rows[0])return reply({error:"NOT_RESTORABLE"},409);
    if(!await isLeader(user))return reply({error:"PAYMENT_REQUIRED"},402);
    await hostQuery(`update public.listings set status='published',deleted_at=null,expires_at=now()+interval '30 days',updated_at=now() where id=$1`,[id]);
    await hostQuery(`insert into public.moderation_events(listing_id,owner_id,actor_id,actor_kind,action,old_status,new_status) values($1,$2,$2,'owner','restored',$3,'published')`,[id,user.id,rows[0].status]);
    return reply({ok:true});
  }catch{return reply({error:"RESTORE_FAILED"},503);}
}
