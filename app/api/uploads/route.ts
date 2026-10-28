import {mkdir,unlink,writeFile} from "node:fs/promises";
import path from "node:path";
import {NextRequest,NextResponse} from "next/server";
import {currentUser} from "../../../lib/host/session";

export const dynamic="force-dynamic";
const root=process.env.KIRAYE_STORAGE_ROOT||"";
const fileName=/^[0-9a-f-]{36}\.jpg$/i;
function reply(data:unknown,status=200){return NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});}

export async function POST(request:NextRequest){
  try{
    const user=await currentUser();if(!user)return reply({error:"SIGN_IN_REQUIRED"},401);
    if(!root)return reply({error:"STORAGE_NOT_CONFIGURED"},503);
    const form=await request.formData(),file=form.get("file");
    if(!(file instanceof File)||file.size<1||file.size>5*1024*1024)return reply({error:"INVALID_IMAGE"},400);
    const bytes=Buffer.from(await file.arrayBuffer());
    if(bytes[0]!==0xff||bytes[1]!==0xd8||bytes.at(-2)!==0xff||bytes.at(-1)!==0xd9)return reply({error:"INVALID_IMAGE"},400);
    const name=`${crypto.randomUUID()}.jpg`,directory=path.join(root,user.id);
    await mkdir(directory,{recursive:true,mode:0o700});await writeFile(path.join(directory,name),bytes,{mode:0o600,flag:"wx"});
    return reply({path:`/api/media/${user.id}/${name}`},201);
  }catch{return reply({error:"UPLOAD_FAILED"},503);}
}

export async function DELETE(request:NextRequest){
  try{
    const user=await currentUser();if(!user)return reply({error:"SIGN_IN_REQUIRED"},401);
    const value=String((await request.json() as {path?:unknown}).path||""),parts=value.split("/");
    if(!root||parts.length!==5||parts[3]!==user.id||!fileName.test(parts[4]))return reply({error:"INVALID_PATH"},400);
    await unlink(path.join(root,user.id,parts[4])).catch(error=>{if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;});
    return reply({ok:true});
  }catch{return reply({error:"DELETE_FAILED"},503);}
}
