import {NextResponse} from "next/server";
import {currentUser} from "../../../../lib/host/session";
import {isLeader} from "../../../../lib/host/staff";
import {freeLimits} from "../../../../lib/host/limits";
import {limitRules} from "../../../../lib/host/limit-rules";
import {activeStore} from "../../../../lib/host/stores";

export const dynamic="force-dynamic";
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});

export async function GET(){
  try{
    const user=await currentUser();if(!user)return reply({error:"SIGN_IN_REQUIRED"},401);
    // Staff place listings without limits: the cabinet shows that instead of the table.
    if(await isLeader(user))return reply({items:[],unlimited:true});
    const [items,rules,store]=await Promise.all([freeLimits(user.id),limitRules(),activeStore(user.id)]);
    return reply({items,rules:store?null:rules,store:!!store});
  }catch{return reply({error:"LIMITS_UNAVAILABLE"},503);}
}
