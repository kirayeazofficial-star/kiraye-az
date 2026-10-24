import { createHmac } from 'node:crypto';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const reply=(status:number)=>new Response(null,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(request:Request){
 const origin=request.headers.get('origin');
 const current=new URL(request.url), host=request.headers.get('host')||current.host;
 const protocol=request.headers.get('x-forwarded-proto')?.split(',')[0].trim()||current.protocol.replace(':','');
 if(origin && origin!==`${protocol}://${host}`)return reply(403);
 const length=Number(request.headers.get('content-length')||0);if(length>200)return reply(413);
 let id:string;
 try{const reader=request.body?.getReader();if(!reader)return reply(400);let text='',bytes=0;while(true){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.length;if(bytes>200){await reader.cancel();return reply(413);}text+=new TextDecoder().decode(chunk.value);}id=JSON.parse(text).id;if(typeof id!=='string'||!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id))return reply(400);}catch{return reply(400);}
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),key=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
 if(!url||!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url)||!key)return reply(503);
 const ip=request.headers.get('x-forwarded-for')?.split(',')[0].trim();
 // Fail closed if the deployment has no trusted proxy address; do not invent counts.
 if(!ip)return reply(503);
 const fingerprint=createHmac('sha256',key).update(`${new Date().toISOString().slice(0,10)}|${ip}|${(request.headers.get('user-agent')||'').slice(0,300)}`).digest('hex');
 try{const result=await fetch(`${url.replace(/\/$/,'')}/rest/v1/rpc/record_listing_view`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({p_listing_id:id,p_visitor_hash:fingerprint}),cache:'no-store',signal:AbortSignal.timeout(4000)});return reply(result.ok?204:503);}catch{return reply(503);}
}
