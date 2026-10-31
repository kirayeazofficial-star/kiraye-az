import {NextRequest,NextResponse} from "next/server";
import {sameOrigin} from "../../../lib/server-request";
import {hostQuery} from "../../../lib/host/db";
import {currentUser} from "../../../lib/host/session";

export const dynamic="force-dynamic";
const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});
const keys=["query","category","city","period","min","max"] as const;

// A saved search of a signed-in user also lives on the server, so the cron job can e-mail
// new matching listings. Saving it again (same id) only refreshes its label and filters.
export async function POST(request:NextRequest){
  if(!sameOrigin(request))return reply({error:"FORBIDDEN"},403);
  try{
    const user=await currentUser();if(!user)return reply({error:"SIGN_IN_REQUIRED"},401);
    const body=await request.json() as {id?:string;label?:string;values?:Record<string,unknown>};
    const id=String(body.id||"");if(!uuid.test(id))return reply({error:"INVALID"},400);
    const params=Object.fromEntries(keys.map(key=>[key,String(body.values?.[key]??"").trim().slice(0,80)]).filter(([,value])=>value));
    const count=await hostQuery<{n:string}>(`select count(*)::text as n from public.saved_search_alerts where user_id=$1 and id<>$2`,[user.id,id]);
    if(Number(count[0]?.n||0)>=8)await hostQuery(`delete from public.saved_search_alerts where id=(select id from public.saved_search_alerts where user_id=$1 order by created_at limit 1)`,[user.id]);
    await hostQuery(`insert into public.saved_search_alerts(id,user_id,label,params) values($1,$2,$3,$4) on conflict(id) do update set label=excluded.label,params=excluded.params where saved_search_alerts.user_id=$2`,[id,user.id,String(body.label||"Axtarış").slice(0,180),JSON.stringify(params)]);
    return reply({ok:true});
  }catch{return reply({error:"SAVE_FAILED"},503);}
}

export async function DELETE(request:NextRequest){
  if(!sameOrigin(request))return reply({error:"FORBIDDEN"},403);
  try{
    const user=await currentUser();if(!user)return reply({error:"SIGN_IN_REQUIRED"},401);
    const id=String((await request.json() as {id?:string}).id||"");if(!uuid.test(id))return reply({error:"INVALID"},400);
    await hostQuery(`delete from public.saved_search_alerts where id=$1 and user_id=$2`,[id,user.id]);
    return reply({ok:true});
  }catch{return reply({error:"DELETE_FAILED"},503);}
}
