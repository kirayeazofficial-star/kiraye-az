import {NextResponse} from "next/server";
import {currentUser} from "../../../../lib/host/session";
import {freeLimits} from "../../../../lib/host/limits";

export const dynamic="force-dynamic";
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});

export async function GET(){
  try{
    const user=await currentUser();if(!user)return reply({error:"SIGN_IN_REQUIRED"},401);
    return reply({items:await freeLimits(user.id)});
  }catch{return reply({error:"LIMITS_UNAVAILABLE"},503);}
}
