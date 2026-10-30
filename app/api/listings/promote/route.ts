import {NextRequest,NextResponse} from "next/server";
import {sameOrigin} from "../../../../lib/server-request";
import {hostQuery} from "../../../../lib/host/db";
import {currentUser} from "../../../../lib/host/session";
import {isLeader} from "../../../../lib/host/staff";

export const dynamic="force-dynamic";
const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});
// Same plans as the promotion dialog: bump = number of lifts (every 8 hours), VIP/Premium = days.
const bumps=[3,9,15,30],days=[1,5,15,30];

// Applies a promotion. Free for the site leader, on any published listing;
// everyone else (admins included) needs payment, which is not connected yet.
export async function POST(request:NextRequest){
  if(!sameOrigin(request))return reply({error:"FORBIDDEN"},403);
  try{
    const user=await currentUser();if(!user)return reply({error:"SIGN_IN_REQUIRED"},401);
    const body=await request.json() as {id?:unknown;kind?:unknown;plan?:unknown};
    const id=String(body.id||""),kind=String(body.kind||""),plan=Number(body.plan);
    if(!uuid.test(id)||!["bump","vip","premium"].includes(kind)||!Number.isInteger(plan)||plan<0||plan>3)return reply({error:"INVALID_REQUEST"},400);
    if(!await isLeader(user))return reply({error:"PAYMENT_REQUIRED"},402);
    const rows=kind==="bump"
      ?await hostQuery(`update public.listings set bump_started=now(),bump_count=$2,updated_at=now() where id=$1 and status='published' and deleted_at is null and (expires_at is null or expires_at>now()) returning id`,[id,bumps[plan]])
      :await hostQuery(`update public.listings set promotion_kind=$2,promotion_until=greatest(case when promotion_kind=$2 then promotion_until end,now())+make_interval(days=>$3::int),bump_started=now(),bump_count=greatest(bump_count,$3::int*3),updated_at=now() where id=$1 and status='published' and deleted_at is null and (expires_at is null or expires_at>now()) returning id`,[id,kind,days[plan]]);
    return rows[0]?reply({ok:true}):reply({error:"NOT_PROMOTABLE"},409);
  }catch{return reply({error:"PROMOTE_FAILED"},503);}
}
