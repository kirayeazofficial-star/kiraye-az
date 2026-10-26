import { createHmac } from "node:crypto";
import { sameOrigin, trustedClientIp } from "../../../lib/server-request";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reply = (status: number) => new Response(null, {status, headers: {"Cache-Control":"no-store"}});
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export async function POST(request: Request) {
  if (!sameOrigin(request)) return reply(403);
  if (Number(request.headers.get("content-length") || 0) > 200) return reply(413);
  let id: string;
  try {
    const reader=request.body?.getReader(); if(!reader)return reply(400);
    let text="",bytes=0;
    while(true){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.length;if(bytes>200){await reader.cancel();return reply(413);}text+=new TextDecoder().decode(chunk.value);}
    id=JSON.parse(text).id;if(typeof id!=="string"||!uuid.test(id))return reply(400);
  } catch {return reply(400);}
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const ip=trustedClientIp(request);
  if(!url||!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url)||!key||!ip)return reply(503);
  try {
    let viewer:string|null=null;
    const authorization=request.headers.get("authorization");
    if(authorization){
      if(!/^Bearer \S+$/i.test(authorization)||authorization.length>8192)return reply(401);
      const user=await fetch(`${url.replace(/\/$/,"")}/auth/v1/user`,{headers:{apikey:key,Authorization:authorization},cache:"no-store",signal:AbortSignal.timeout(4000)});
      if(!user.ok)return reply(user.status<500?401:503);
      const data=await user.json();if(typeof data?.id!=="string"||!uuid.test(data.id))return reply(401);viewer=data.id;
    }
    const fingerprint=createHmac("sha256",key).update(`${new Date().toISOString().slice(0,10)}|${ip}|${(request.headers.get("user-agent")||"").slice(0,300)}`).digest("hex");
    const result=await fetch(`${url.replace(/\/$/,"")}/rest/v1/rpc/record_listing_view_checked`,{method:"POST",headers:{apikey:key,Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({p_listing_id:id,p_visitor_hash:fingerprint,p_viewer_id:viewer}),cache:"no-store",signal:AbortSignal.timeout(4000)});
    return reply(result.ok?204:503);
  }catch{return reply(503);}
}