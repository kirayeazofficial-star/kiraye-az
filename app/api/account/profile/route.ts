import {createClient} from '@supabase/supabase-js';
import {sameOrigin} from '../../../../lib/server-request';
import {normalizePhone} from '../../../../lib/rental-details';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const reply=(body:object,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
function config(){if(process.env.NEXT_PUBLIC_SUPABASE_ENABLED!=='true')return null;const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();return url&&/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url)&&key?{url,key}:null;}
const timedFetch:typeof fetch=(input,init)=>fetch(input,{...init,signal:init?.signal?AbortSignal.any([init.signal,AbortSignal.timeout(8000)]):AbortSignal.timeout(8000)});
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:timedFetch}};
async function actor(request:Request){const cfg=config(),authorization=request.headers.get('authorization')||'';if(!cfg)return null;if(!/^Bearer \S+$/i.test(authorization)||authorization.length>8192)return null;const token=authorization.slice(7);const client=createClient(cfg.url,cfg.key,{...options,global:{...options.global,headers:{Authorization:`Bearer ${token}`}}});const {data,error}=await client.auth.getUser(token);return !error&&data.user?{...cfg,user:data.user,client}:null;}
export async function GET(request:Request){try{const current=await actor(request);if(!current)return reply({code:'sign_in_required'},401);const result=await current.client.rpc('own_profile_contact_status');return result.error?reply({code:'profile_unavailable'},503):reply({profile:result.data});}catch{return reply({code:'profile_unavailable'},503);}}
export async function POST(request:Request){
 if(!sameOrigin(request))return reply({code:'forbidden'},403);
 let fresh:ReturnType<typeof createClient>|null=null;
 try{
  const reader=request.body?.getReader();if(!reader)return reply({code:'invalid_request'},400);const chunks:Uint8Array[]=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>4096){await reader.cancel();return reply({code:'request_too_large'},413);}chunks.push(value);}
  let input;try{input=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return reply({code:'invalid_request'},400);}
  if(!input||!['profile','email'].includes(input.action))return reply({code:'invalid_request'},400);
  const password=typeof input.password==='string'?input.password:'';if(password.length>512)return reply({code:'invalid_request'},400);
  const current=await actor(request);if(!current)return reply({code:'sign_in_required'},401);
  const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();if(!serviceKey)return reply({code:'profile_unavailable'},503);
  const gate=await fetch(`${current.url.replace(/\/$/,'')}/rest/v1/rpc/allow_profile_change_attempt`,{method:'POST',headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,'Content-Type':'application/json'},body:JSON.stringify({p_user_id:current.user.id}),cache:'no-store',signal:AbortSignal.timeout(5000)});
  if(!gate.ok)return reply({code:'profile_unavailable'},503);if(await gate.json()!==true)return reply({code:'rate_limited'},429);
  const status=await current.client.rpc('own_profile_contact_status');if(status.error||!status.data)return reply({code:'profile_unavailable'},503);
  let client=current.client;
  if(password){if(!current.user.email)return reply({code:'provider_reauth_required'},403);fresh=createClient(current.url,current.key,options);const login=await fresh.auth.signInWithPassword({email:current.user.email,password});if(login.error||login.data.user?.id!==current.user.id)return reply({code:'reauth_failed'},401);client=fresh;}
  if(input.action==='email'){
   const email=typeof input.email==='string'?input.email.trim().toLowerCase():'';
   if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return reply({code:'invalid_email'},400);
   if(email===String(status.data.email||'').toLowerCase())return reply({profile:status.data,unchanged:true});
   if(!password)return reply({code:'recent_login_required'},403);
   if(Number(status.data.email_remaining)<=0)return reply({code:'email_limit_reached'},409);
   const change=await client.auth.updateUser({email},{emailRedirectTo:'https://kirayeal.az/auth/callback'});
   if(change.error)return reply({code:change.error.status&&change.error.status>=500?'mail_delivery_failed':'email_change_failed'},change.error.status&&change.error.status>=500?502:400);
   const updated=await client.rpc('own_profile_contact_status');if(updated.error||String(updated.data?.pending_email||'').toLowerCase()!==email)return reply({code:'email_change_not_started'},400);
   return reply({profile:updated.data,confirmation_pending:true});
  }
  const name=typeof input.name==='string'?input.name.trim().replace(/\s+/g,' '):'',phone=typeof input.phone==='string'?input.phone:'';
  if(name.length>100||!/^\S+\s+\S/.test(name)||phone.length>32)return reply({code:'invalid_profile'},400);
  if(normalizePhone(phone)!==normalizePhone(String(status.data.phone||''))&&!password)return reply({code:'recent_login_required'},403);
  const saved=await client.rpc('update_own_profile',{p_name:name,p_phone:phone});
  if(saved.error){const code=saved.error.code;return reply({code:code==='PCL03'?'phone_limit_reached':code==='PRA01'?'recent_login_required':code==='22023'?'invalid_profile':'profile_save_failed'},code==='PCL03'?409:code==='PRA01'?403:code==='22023'?400:503);}
  return reply({profile:saved.data});
 }catch{return reply({code:'profile_unavailable'},503);}finally{if(fresh)await fresh.auth.signOut({scope:'local'}).catch(()=>{});}
}
