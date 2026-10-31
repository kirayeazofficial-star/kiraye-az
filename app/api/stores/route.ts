import {mkdir,unlink,writeFile} from "node:fs/promises";
import path from "node:path";
import {NextRequest,NextResponse} from "next/server";
import {sameOrigin} from "../../../lib/server-request";
import {hostQuery} from "../../../lib/host/db";
import {currentUser} from "../../../lib/host/session";
import {newId} from "../../../lib/host/security";
import {activeStore,storePlans,storeSlug,type Store} from "../../../lib/host/stores";

export const runtime="nodejs";export const dynamic="force-dynamic";
const root=process.env.KIRAYE_STORAGE_ROOT||"";
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});
const text=(value:FormDataEntryValue|null,max:number)=>typeof value==="string"?value.trim().slice(0,max):"";

// Public: active stores (Premium first) for the home page. With ?mine=1: the signed-in user's store and the packages.
export async function GET(request:NextRequest){
  try{
    if(request.nextUrl.searchParams.get("mine")){
      const user=await currentUser();if(!user)return reply({error:"SIGN_IN_REQUIRED"},401);
      const [store,plans,active]=await Promise.all([hostQuery<Store>(`select * from public.stores where owner_id=$1`,[user.id]),storePlans(),activeStore(user.id)]);
      // Terms of the current paid period: they stay as activated even if the leader changes the package later.
      const terms=active?{listing_limit:active.listing_limit,free_bumps:active.free_bumps,bumps_left:active.bumps_left,price:(active as {terms_price?:string|null}).terms_price??null}:null;
      return reply({store:store[0]||null,plans,terms});
    }
    const items=await hostQuery(`select s.slug,s.name,s.logo_url,s.address,p.featured,(select count(*)::int from public.listings l where l.owner_id=s.owner_id and l.status='published' and l.deleted_at is null and (l.expires_at is null or l.expires_at>now())) as listings
      from public.stores s join public.store_plans p on p.id=s.plan join auth.users u on u.id=s.owner_id
      where s.status='active' and s.active_until>now() and u.disabled_at is null order by p.featured desc,p.sort desc,s.created_at limit 20`);
    return reply({items});
  }catch{return reply({items:[]});}
}

// Open or edit the user's store. A new store waits for the leader's approval; an active one stays active.
export async function POST(request:NextRequest){
  if(!sameOrigin(request))return reply({error:"FORBIDDEN"},403);
  try{
    const user=await currentUser();if(!user)return reply({error:"SIGN_IN_REQUIRED"},401);
    const form=await request.formData();
    const name=text(form.get("name"),60),description=text(form.get("description"),600),phone=text(form.get("phone"),32),address=text(form.get("address"),120),hours=text(form.get("hours"),60);
    const plan=text(form.get("plan"),20),slug=storeSlug(text(form.get("slug"),40)||name);
    const time=(value:string)=>/^([01]\d|2[0-3]):[0-5]\d$/.test(value)?value:null,openFrom=time(text(form.get("open_from"),5)),openTo=time(text(form.get("open_to"),5));
    if(name.length<3||slug.length<3)return reply({error:"INVALID_NAME"},400);
    if(!(await storePlans()).some(item=>item.id===plan))return reply({error:"INVALID_PLAN"},400);
    const taken=await hostQuery(`select 1 from public.stores where slug=$1 and owner_id<>$2`,[slug,user.id]);if(taken[0])return reply({error:"SLUG_TAKEN"},409);
    // Optional logo (square) and cover (wide) pictures: JPEGs made in the browser.
    const saveImage=async(field:string,maxBytes:number)=>{
      const file=form.get(field);if(!(file instanceof File)||file.size<1)return null;
      if(!root)throw new Error("STORAGE_NOT_CONFIGURED");
      const bytes=Buffer.from(await file.arrayBuffer());
      if(file.size>maxBytes||bytes[0]!==0xff||bytes[1]!==0xd8)throw new Error("INVALID_IMAGE");
      const fileName=`${crypto.randomUUID()}.jpg`;await mkdir(path.join(root,user.id),{recursive:true,mode:0o700});
      await writeFile(path.join(root,user.id,fileName),bytes,{mode:0o600,flag:"wx"});return `/api/media/${user.id}/${fileName}`;
    };
    const logo=await saveImage("logo",2*1024*1024),cover=await saveImage("cover",4*1024*1024);
    const removeOld=async(url:string|null)=>{const match=/\/([0-9a-f-]{36}\.jpg)$/i.exec(url||"");if(match)await unlink(path.join(root,user.id,match[1])).catch(()=>{});};
    const old=await hostQuery<Store>(`select * from public.stores where owner_id=$1`,[user.id]);
    if(old[0]){
      // A different package, or a rejected/expired store, goes back to the leader.
      const again=old[0].plan!==plan||["rejected","expired"].includes(old[0].status);
      await hostQuery(`update public.stores set name=$2,slug=$3,description=$4,phone=$5,address=$6,hours=$7,plan=$8,logo_url=coalesce($9,logo_url),cover_url=coalesce($11,cover_url),open_from=$12,open_to=$13,status=case when $10 then 'pending' else status end,reject_reason=case when $10 then null else reject_reason end,updated_at=now() where owner_id=$1`,[user.id,name,slug,description,phone,address,hours,plan,logo,again,cover,openFrom,openTo]);
      if(logo)await removeOld(old[0].logo_url);if(cover)await removeOld(old[0].cover_url);
      return reply({ok:true,status:again?"pending":old[0].status});
    }
    await hostQuery(`insert into public.stores(id,owner_id,slug,name,description,logo_url,phone,address,hours,plan,cover_url,open_from,open_to) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,[newId(),user.id,slug,name,description,logo,phone,address,hours,plan,cover,openFrom,openTo]);
    return reply({ok:true,status:"pending"},201);
  }catch(error){const code=(error as Error).message;if(code==="INVALID_IMAGE")return reply({error:code},400);console.error("store save",code);return reply({error:"SAVE_FAILED"},503);}
}
