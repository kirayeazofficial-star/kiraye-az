import {mkdir,unlink,writeFile} from "node:fs/promises";
import path from "node:path";
import {sameOrigin} from "../../../../lib/server-request";
import {hostQuery} from "../../../../lib/host/db";
import {currentUser} from "../../../../lib/host/session";

export const runtime="nodejs";export const dynamic="force-dynamic";
const root=process.env.KIRAYE_STORAGE_ROOT||"";
const reply=(body:object,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
const ownFile=(userId:string,value:string|null|undefined)=>{const match=/^\/api\/media\/([0-9a-f-]{36})\/([0-9a-f-]{36}\.jpg)$/i.exec(value||"");return match&&match[1]===userId?match[2]:null;};
async function removeFile(userId:string,value:string|null|undefined){const name=ownFile(userId,value);if(name)await unlink(path.join(root,userId,name)).catch(()=>{});}
async function currentAvatar(userId:string){const rows=await hostQuery<{avatar_url:string|null}>(`select avatar_url from public.profiles where id=$1`,[userId]);return rows[0]?.avatar_url||null;}

export async function POST(request:Request){
  if(!sameOrigin(request))return reply({error:"FORBIDDEN"},403);
  try{
    const user=await currentUser();if(!user)return reply({error:"SIGN_IN_REQUIRED"},401);
    if(!root)return reply({error:"STORAGE_NOT_CONFIGURED"},503);
    const file=(await request.formData()).get("file");
    if(!(file instanceof File)||file.size<1||file.size>2*1024*1024)return reply({error:"INVALID_IMAGE"},400);
    const bytes=Buffer.from(await file.arrayBuffer());
    if(bytes[0]!==0xff||bytes[1]!==0xd8||bytes.at(-2)!==0xff||bytes.at(-1)!==0xd9)return reply({error:"INVALID_IMAGE"},400);
    const name=`${crypto.randomUUID()}.jpg`,directory=path.join(root,user.id);
    await mkdir(directory,{recursive:true,mode:0o700});await writeFile(path.join(directory,name),bytes,{mode:0o600,flag:"wx"});
    const previous=await currentAvatar(user.id),avatar=`/api/media/${user.id}/${name}`;
    await hostQuery(`update public.profiles set avatar_url=$1,updated_at=now() where id=$2`,[avatar,user.id]);
    await removeFile(user.id,previous);
    return reply({avatar_url:avatar},201);
  }catch{return reply({error:"UPLOAD_FAILED"},503);}
}

export async function DELETE(request:Request){
  if(!sameOrigin(request))return reply({error:"FORBIDDEN"},403);
  try{
    const user=await currentUser();if(!user)return reply({error:"SIGN_IN_REQUIRED"},401);
    const previous=await currentAvatar(user.id);
    await hostQuery(`update public.profiles set avatar_url=null,updated_at=now() where id=$1`,[user.id]);
    await removeFile(user.id,previous);
    return reply({avatar_url:null});
  }catch{return reply({error:"DELETE_FAILED"},503);}
}
