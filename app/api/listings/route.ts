import {NextRequest,NextResponse} from "next/server";
import {freeLimit} from "../../../lib/host/limits";
import {hostQuery} from "../../../lib/host/db";
import {currentUser} from "../../../lib/host/session";
import {newId} from "../../../lib/host/security";

export const dynamic="force-dynamic";
const categories=new Set(['property','car','motorcycle','villa','commercial','equipment','clothing','electric','photo','camping','bicycle','event']);
const periods=new Set(['daily','weekly','monthly']);
const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
function reply(data:unknown,status=200){return NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});}

export async function GET(request:NextRequest){
  try{
    const input=request.nextUrl.searchParams,scope=input.get('scope')||'public';
    const requestedId=input.get('id')||'';
    if(requestedId){
      if(!uuid.test(requestedId))return reply({error:'INVALID_LISTING'},400);
      const user=await currentUser();
      if(!user)return reply({error:'SIGN_IN_REQUIRED'},401);
      const rows=await hostQuery(`select * from public.listings where id=$1 and owner_id=$2 limit 1`,[requestedId,user.id]);
      return rows[0]?reply({item:rows[0]}):reply({error:'LISTING_NOT_FOUND'},404);
    }
    const where:string[]=[],values:unknown[]=[];const add=(sql:string,value:unknown)=>{values.push(value);where.push(sql.replace('?',`$${values.length}`));};
    if(scope==='mine'){const user=await currentUser();if(!user)return reply({error:'SIGN_IN_REQUIRED'},401);add('owner_id=?',user.id);}
    else where.push(`status='published' and (expires_at is null or expires_at>now())`);
    const category=input.get('category')||'';if(categories.has(category))add('category=?',category);
    const owner=input.get('owner')||'';if(uuid.test(owner))add('owner_id=?',owner);
    const city=(input.get('city')||'').slice(0,80);if(city)add('city=?',city);
    const period=input.get('period')||'';if(periods.has(period))add('rental_period=?',period);
    for(const [key,op] of [['min','>='],['max','<=']] as const){const raw=(input.get(key)||'').trim();const number=Number(raw);if(raw&&Number.isFinite(number)&&number>=0)add(`price${op}?`,number);}
    const rooms=input.get('rooms')||'';if(rooms==='4+')add('rooms>=?',4);else if(/^\d+$/.test(rooms))add('rooms=?',Number(rooms));
    const area=Number(input.get('area'));if(Number.isFinite(area)&&area>0)add('area_m2>=?',area);
    const brand=(input.get('brand')||'').replace(/[%_]/g,'').slice(0,40);if(brand)add(`attributes->>'brand' ilike ?`,`%${brand}%`);
    const gearbox=(input.get('gearbox')||'').slice(0,40);if(gearbox)add(`attributes->>'gearbox'=?`,gearbox);
    if(input.get('noDeposit')==='1')where.push('deposit=0');
    const favorites=(input.get('favorites')||'').split(',').filter(id=>uuid.test(id)).slice(0,200);if(input.has('favorites')){if(!favorites.length)return reply({items:[],total:0});values.push(favorites);where.push(`id=any($${values.length}::uuid[])`);}
    const query=(input.get('query')||'').trim().slice(0,120);for(const token of query.split(/\s+/).filter(Boolean).slice(0,8)){values.push(`%${token.replace(/[%_]/g,'')}%`);where.push(`(title ilike $${values.length} or city ilike $${values.length} or coalesce(district,'') ilike $${values.length} or coalesce(attributes->>'brand','') ilike $${values.length} or coalesce(attributes->>'model','') ilike $${values.length})`);}
    const page=Math.max(1,Math.min(1000,Number(input.get('page'))||1)),limit=Math.max(1,Math.min(200,Number(input.get('limit'))||18)),offset=(page-1)*limit;
    const promoted=`(promotion_until>now() and promotion_kind is not null)`;
    const bumped=`greatest(created_at,case when bump_count>0 and bump_started<=now() then bump_started+interval '8 hours'*least(bump_count-1,floor(extract(epoch from now()-bump_started)/28800)) end)`;
    const promotion=input.get('promotion')||'';if(promotion==='vip'||promotion==='premium')where.push(`${promoted} and promotion_kind='${promotion}'`);
    const promotedFirst=scope==='public'?`case when ${promoted} and promotion_kind='premium' then 0 when ${promoted} then 1 else 2 end,`:'';
    const order=input.get('sort')==='low'?`${promotedFirst}price asc`:input.get('sort')==='high'?`${promotedFirst}price desc`:`${promotedFirst}${bumped} desc,id desc`;
    const condition=where.length?`where ${where.join(' and ')}`:'';
    const fields=scope==='mine'?`*,(select count(*)::int from public.listing_views v where v.listing_id=public.listings.id) as views`:'*';
    const [rows,total]=await Promise.all([hostQuery(`select ${fields} from public.listings ${condition} order by ${order} limit ${limit} offset ${offset}`,values as never[]),hostQuery<{count:string}>(`select count(*)::text count from public.listings ${condition}`,values as never[])]);
    return reply({items:rows,total:Number(total[0]?.count||0)});
  }catch{return reply({error:'LISTINGS_UNAVAILABLE'},503);}
}

function cleanText(value:unknown,max:number){return typeof value==='string'?value.trim().slice(0,max):'';}
function numberOrNull(value:unknown){if(value===null||value===''||value===undefined)return null;const number=Number(value);return Number.isFinite(number)?number:null;}
function validImages(value:unknown,userId:string){
  if(!Array.isArray(value)||value.length<1||value.length>6)return null;
  const prefix=`/api/media/${userId}/`;
  const images=value.filter((item):item is string=>typeof item==='string'&&((item.startsWith(prefix)&&/^\/api\/media\/[0-9a-f-]{36}\/(?:branded-v3-)?[0-9a-f-]{36}\.jpg$/i.test(item))||/^\/placeholders\/[a-z]+\.svg$/.test(item)));
  return images.length===value.length?images:null;
}
function listingPayload(body:Record<string,unknown>,userId:string){
  const category=cleanText(body.category,64),title=cleanText(body.title,140),description=cleanText(body.description,8000),city=cleanText(body.city,80),contact=cleanText(body.contact,32),rentalPeriod=cleanText(body.rental_period,16);
  const price=numberOrNull(body.price),deposit=numberOrNull(body.deposit)??0,minDays=numberOrNull(body.min_days)??1,images=validImages(body.images,userId);
  if(!categories.has(category)||title.length<10||description.length<30||!city||!periods.has(rentalPeriod)||price===null||price<=0||price>1_000_000||deposit<0||minDays<1||!contact||!images)return null;
  const attributes=body.attributes&&typeof body.attributes==='object'&&!Array.isArray(body.attributes)?body.attributes:{};
  return{category,title,description,city,contact,rentalPeriod,price,deposit,minDays,images,attributes,district:cleanText(body.district,100),rooms:numberOrNull(body.rooms),area:numberOrNull(body.area_m2),availableFrom:cleanText(body.available_from,10)||null,availableUntil:cleanText(body.available_until,10)||null};
}

export async function POST(request:NextRequest){
  try{
    const user=await currentUser();if(!user)return reply({error:'SIGN_IN_REQUIRED'},401);
    const body=await request.json() as Record<string,unknown>,item=listingPayload(body,user.id);if(!item)return reply({error:'INVALID_LISTING'},400);
    const limit=await freeLimit(user.id,item.category);
    if(limit.remaining<=0)return reply({error:'LIMIT_REACHED',next_free_at:limit.next_free_at},429);
    const id=newId();
    await hostQuery(`insert into public.listings(id,owner_id,category,title,description,contact,city,district,price,rental_period,images,status,deposit,min_days,rooms,area_m2,attributes,available_from,available_until) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending',$12,$13,$14,$15,$16,$17,$18)`,[id,user.id,item.category,item.title,item.description,item.contact,item.city,item.district||null,item.price,item.rentalPeriod,item.images,item.deposit,item.minDays,item.rooms,item.area,item.attributes as never,item.availableFrom,item.availableUntil]);
    await hostQuery(`insert into public.moderation_events(listing_id,owner_id,actor_id,actor_kind,action,old_status,new_status) values($1,$2,$2,'owner','submitted',null,'pending')`,[id,user.id]);
    return reply({id},201);
  }catch{return reply({error:'LISTING_SAVE_FAILED'},503);}
}

export async function PATCH(request:NextRequest){
  try{
    const user=await currentUser();if(!user)return reply({error:'SIGN_IN_REQUIRED'},401);
    const body=await request.json() as Record<string,unknown>,id=cleanText(body.id,36);if(!uuid.test(id))return reply({error:'INVALID_LISTING'},400);
    const item=listingPayload(body,user.id);if(!item)return reply({error:'INVALID_LISTING'},400);
    const recent=await hostQuery<{id:string}>(`select id from public.listings where id=$1 and owner_id=$2 and last_edited_at>now()-interval '1 day'`,[id,user.id]);
    if(recent[0])return reply({error:'EDIT_LIMIT'},429);
    const rows=await hostQuery<{id:string}>(`update public.listings set last_edited_at=now(),category=$3,title=$4,description=$5,contact=$6,city=$7,district=$8,price=$9,rental_period=$10,images=$11,status='pending',deposit=$12,min_days=$13,rooms=$14,area_m2=$15,attributes=$16,available_from=$17,available_until=$18,review_kind='edited',updated_at=now() where id=$1 and owner_id=$2 and status not in('archived','expired') returning id`,[id,user.id,item.category,item.title,item.description,item.contact,item.city,item.district||null,item.price,item.rentalPeriod,item.images,item.deposit,item.minDays,item.rooms,item.area,item.attributes as never,item.availableFrom,item.availableUntil]);
    if(rows[0])await hostQuery(`insert into public.moderation_events(listing_id,owner_id,actor_id,actor_kind,action,old_status,new_status) values($1,$2,$2,'owner','resubmitted',null,'pending')`,[id,user.id]);
    return rows[0]?reply({id:rows[0].id}):reply({error:'LISTING_NOT_FOUND'},404);
  }catch{return reply({error:'LISTING_SAVE_FAILED'},503);}
}

export async function DELETE(request:NextRequest){
  try{
    const user=await currentUser();if(!user)return reply({error:'SIGN_IN_REQUIRED'},401);
    const id=cleanText((await request.json() as {id?:unknown}).id,36);if(!uuid.test(id))return reply({error:'INVALID_LISTING'},400);
    const rows=await hostQuery<{id:string}>(`delete from public.listings where id=$1 and owner_id=$2 returning id`,[id,user.id]);
    return rows[0]?reply({id}):reply({error:'LISTING_NOT_FOUND'},404);
  }catch{return reply({error:'LISTING_ARCHIVE_FAILED'},503);}
}
