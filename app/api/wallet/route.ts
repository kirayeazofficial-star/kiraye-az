import {NextRequest,NextResponse} from "next/server";
import {hostQuery,hostTransaction} from "../../../lib/host/db";
import {currentUser} from "../../../lib/host/session";
import {newId} from "../../../lib/host/security";
import {PROMOTION_PLANS} from "../../../lib/promotions";

export const dynamic="force-dynamic";
const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});

export async function GET(){
  try{
    const user=await currentUser();if(!user)return reply({error:"SIGN_IN_REQUIRED"},401);
    const [sum,entries]=await Promise.all([
      hostQuery<{balance:string}>(`select coalesce(sum(amount),0)::text balance from public.wallet_entries where owner_id=$1`,[user.id]),
      hostQuery(`select id,amount,kind,memo,created_at from public.wallet_entries where owner_id=$1 order by created_at desc,id desc limit 50`,[user.id]),
    ]);
    return reply({balance:Number(sum[0]?.balance||0),entries});
  }catch{return reply({error:"WALLET_UNAVAILABLE"},503);}
}

// Buy a promotion for an own published listing, paid from the balance.
export async function POST(request:NextRequest){
  try{
    const user=await currentUser();if(!user)return reply({error:"SIGN_IN_REQUIRED"},401);
    const body=await request.json() as {listingId?:unknown;planId?:unknown};
    const listingId=String(body.listingId||""),plan=PROMOTION_PLANS.find(item=>item.id===body.planId);
    if(!uuid.test(listingId)||!plan)return reply({error:"INVALID_REQUEST"},400);
    const result=await hostTransaction(async db=>{
      // Serialize wallet changes of one user so the balance cannot go negative.
      await db.query(`select id from public.profiles where id=$1 for update`,[user.id]);
      const listing=await db.query(`select id,promotion_kind,promotion_until from public.listings where id=$1 and owner_id=$2 and status='published' and (expires_at is null or expires_at>now()) for update`,[listingId,user.id]);
      if(!listing.rows[0])return{error:"LISTING_NOT_ELIGIBLE",status:404};
      const balance=Number((await db.query(`select coalesce(sum(amount),0)::text balance from public.wallet_entries where owner_id=$1`,[user.id])).rows[0].balance);
      if(balance<plan.price)return{error:"INSUFFICIENT_BALANCE",status:402};
      await db.query(`insert into public.wallet_entries(owner_id,amount,kind,provider_reference,memo) values($1,$2,'promotion',$3,$4)`,[user.id,-plan.price,`promo-${newId()}`,`${plan.kind.toUpperCase()} · ${plan.label}`]);
      if(plan.kind==="bump")await db.query(`update public.listings set bump_started=now(),bump_count=$2 where id=$1`,[listingId,plan.bumps]);
      else{
        const current=listing.rows[0] as {promotion_kind:string|null;promotion_until:string|null};
        const active=current.promotion_until&&Date.parse(current.promotion_until)>Date.now();
        // Same kind extends the running period; a different kind starts now.
        const base=active&&current.promotion_kind===plan.kind?`greatest(promotion_until,now())`:`now()`;
        await db.query(`update public.listings set promotion_kind=$2,promotion_until=${base}+make_interval(days=>$3) where id=$1`,[listingId,plan.kind,plan.days]);
      }
      return{balance:balance-plan.price};
    });
    if("error" in result)return reply({error:result.error},result.status);
    return reply({ok:true,balance:result.balance});
  }catch{return reply({error:"PURCHASE_FAILED"},503);}
}
