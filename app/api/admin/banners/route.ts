import {mkdir,unlink,writeFile} from "node:fs/promises";
import path from "node:path";
import {NextRequest,NextResponse} from "next/server";
import {sameOrigin} from "../../../../lib/server-request";
import {hostQuery} from "../../../../lib/host/db";
import {newId} from "../../../../lib/host/security";
import {staffUser} from "../../../../lib/host/staff";

export const runtime="nodejs";export const dynamic="force-dynamic";
// Banner pictures and videos live in their own folder, served by /api/media/<folder>/<file>.
const folder="00000000-0000-4000-8000-0000000000b1";
const root=process.env.KIRAYE_STORAGE_ROOT||"";
const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,day=/^\d{4}-\d{2}-\d{2}$/;
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});
const text=(value:FormDataEntryValue|null,max:number)=>typeof value==="string"?value.trim().slice(0,max):"";
function link(value:string){if(!value)return null;if(value.startsWith("/"))return value;try{const url=new URL(value);return["http:","https:"].includes(url.protocol)?url.toString():null;}catch{return null;}}
// A banner is a JPEG picture (made in the browser) or a short MP4/WebM video.
async function saveMedia(file:FormDataEntryValue|null){
  if(!(file instanceof File)||file.size<1)return null;
  const bytes=Buffer.from(await file.arrayBuffer());
  const jpeg=bytes[0]===0xff&&bytes[1]===0xd8,mp4=bytes.subarray(4,8).toString("latin1")==="ftyp",webm=bytes[0]===0x1a&&bytes[1]===0x45&&bytes[2]===0xdf&&bytes[3]===0xa3;
  if(!jpeg&&!mp4&&!webm)throw new Error("INVALID_IMAGE");
  if(bytes.length>(jpeg?3:20)*1024*1024)throw new Error("TOO_LARGE");
  const extension=jpeg?"jpg":mp4?"mp4":"webm",name=`${crypto.randomUUID()}.${extension}`,directory=path.join(root,folder);
  await mkdir(directory,{recursive:true,mode:0o700});await writeFile(path.join(directory,name),bytes,{mode:0o600,flag:"wx"});
  return {url:`/api/media/${folder}/${name}`,type:jpeg?"image":"video"};
}
async function removeImage(url:string|null|undefined){const name=url?.split("/").pop();if(name&&/^[0-9a-f-]{36}\.(?:jpg|mp4|webm)$/i.test(name))await unlink(path.join(root,folder,name)).catch(()=>{});}

export async function GET(){
  try{if(!await staffUser())return reply({error:"FORBIDDEN"},403);
    return reply({items:await hostQuery(`select * from public.banners order by placement,sort_order,created_at desc`)});
  }catch{return reply({error:"BANNERS_UNAVAILABLE"},503);}
}

// Create (no id) or update (with id). The image is optional when updating.
export async function POST(request:NextRequest){
  if(!sameOrigin(request))return reply({error:"FORBIDDEN"},403);
  try{
    const user=await staffUser();if(!user)return reply({error:"FORBIDDEN"},403);
    if(!root)return reply({error:"STORAGE_NOT_CONFIGURED"},503);
    const form=await request.formData(),id=text(form.get("id"),36);
    const placement=text(form.get("placement"),16)==="listing"?"listing":"home";
    const title=text(form.get("title"),120),linkUrl=link(text(form.get("link_url"),500));
    const startsAt=day.test(text(form.get("starts_at"),10))?text(form.get("starts_at"),10):null,endsAt=day.test(text(form.get("ends_at"),10))?text(form.get("ends_at"),10):null;
    const sort=Math.max(0,Math.min(999,Number(text(form.get("sort_order"),4))||0)),active=text(form.get("active"),5)!=="false";
    const media=await saveMedia(form.get("file")),image=media?.url??null,mediaType=media?.type??null;
    if(id){
      if(!uuid.test(id))return reply({error:"INVALID_BANNER"},400);
      const old=await hostQuery<{image_url:string}>(`select image_url from public.banners where id=$1`,[id]);if(!old[0])return reply({error:"NOT_FOUND"},404);
      await hostQuery(`update public.banners set title=$2,link_url=$3,placement=$4,starts_at=$5,ends_at=$6,sort_order=$7,active=$8,image_url=coalesce($9,image_url),media_type=coalesce($10,media_type),updated_at=now() where id=$1`,[id,title,linkUrl,placement,startsAt,endsAt,sort,active,image,mediaType]);
      if(image)await removeImage(old[0].image_url);
      return reply({id});
    }
    if(!image)return reply({error:"IMAGE_REQUIRED"},400);
    const newIdValue=newId();
    await hostQuery(`insert into public.banners(id,title,image_url,link_url,placement,starts_at,ends_at,sort_order,active,created_by,media_type) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,[newIdValue,title,image,linkUrl,placement,startsAt,endsAt,sort,active,user.id,mediaType]);
    return reply({id:newIdValue},201);
  }catch(error){const code=(error as Error).message;return reply({error:["TOO_LARGE","INVALID_IMAGE"].includes(code)?code:"BANNER_SAVE_FAILED"},code==="TOO_LARGE"||code==="INVALID_IMAGE"?400:503);}
}

export async function PATCH(request:NextRequest){
  if(!sameOrigin(request))return reply({error:"FORBIDDEN"},403);
  try{if(!await staffUser())return reply({error:"FORBIDDEN"},403);
    const body=await request.json() as {id?:string;active?:boolean};if(!uuid.test(body.id||""))return reply({error:"INVALID_BANNER"},400);
    await hostQuery(`update public.banners set active=$2,updated_at=now() where id=$1`,[body.id as string,!!body.active]);return reply({ok:true});
  }catch{return reply({error:"BANNER_SAVE_FAILED"},503);}
}

export async function DELETE(request:NextRequest){
  if(!sameOrigin(request))return reply({error:"FORBIDDEN"},403);
  try{if(!await staffUser())return reply({error:"FORBIDDEN"},403);
    const body=await request.json() as {id?:string};if(!uuid.test(body.id||""))return reply({error:"INVALID_BANNER"},400);
    const rows=await hostQuery<{image_url:string}>(`delete from public.banners where id=$1 returning image_url`,[body.id as string]);await removeImage(rows[0]?.image_url);
    return reply({ok:true});
  }catch{return reply({error:"BANNER_DELETE_FAILED"},503);}
}
