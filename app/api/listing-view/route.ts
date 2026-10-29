import {createHmac,randomUUID} from "node:crypto";import {sameOrigin} from "../../../lib/server-request";import {hostQuery} from "../../../lib/host/db";import {currentUser} from "../../../lib/host/session";
export const runtime="nodejs";export const dynamic="force-dynamic";const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;const reply=(status:number,cookie?:string)=>new Response(null,{status,headers:{"Cache-Control":"no-store",...(cookie?{"Set-Cookie":cookie}:{})}});
const VISITOR="kiraye_vid";
// One view per visitor per day. A visitor is the signed-in account or an anonymous random cookie;
// only a keyed hash is stored, never the cookie itself.
export async function POST(request:Request){if(!sameOrigin(request))return reply(403);try{const {id}=await request.json();if(typeof id!=="string"||!uuid.test(id))return reply(400);
const secret=process.env.KIRAYE_SESSION_SECRET||"";if(!secret)return reply(503);
const cookie=(request.headers.get("cookie")||"").split(/;\s*/).find(part=>part.startsWith(VISITOR+"="))?.slice(VISITOR.length+1)||"";
const visitor=uuid.test(cookie)?cookie:randomUUID();const setCookie=visitor===cookie?undefined:`${VISITOR}=${visitor}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${process.env.NODE_ENV==="production"?"; Secure":""}`;
const user=await currentUser();
const listing=await hostQuery<{owner_id:string}>(`select owner_id from public.listings where id=$1 and status='published'`,[id]);if(!listing[0]||listing[0].owner_id===user?.id)return reply(204,setCookie);
const who=user?.id?`u:${user.id}`:`v:${visitor}`;
const fingerprint=createHmac('sha256',secret).update(`${new Date().toISOString().slice(0,10)}|${who}`).digest('hex');
await hostQuery(`insert into public.listing_views(listing_id,visitor_hash) values($1,$2) on conflict do nothing`,[id,fingerprint]);return reply(204,setCookie);}catch{return reply(503);}}
