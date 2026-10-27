import {NextRequest,NextResponse} from "next/server";
import {hostQuery} from "../../../lib/host/db";
import {currentUser} from "../../../lib/host/session";

export const dynamic="force-dynamic";
const categories=new Set(['property','car','motorcycle','villa','commercial','equipment','clothing','electric','photo','camping','bicycle','event']);
const periods=new Set(['daily','weekly','monthly']);
const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
function reply(data:unknown,status=200){return NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});}

export async function GET(request:NextRequest){
  try{
    const input=request.nextUrl.searchParams,scope=input.get('scope')||'public';
    const where:string[]=[],values:unknown[]=[];const add=(sql:string,value:unknown)=>{values.push(value);where.push(sql.replace('?',`$${values.length}`));};
    if(scope==='mine'){const user=await currentUser();if(!user)return reply({error:'SIGN_IN_REQUIRED'},401);add('owner_id=?',user.id);}
    else where.push(`status='published' and (expires_at is null or expires_at>now())`);
    const category=input.get('category')||'';if(categories.has(category))add('category=?',category);
    const owner=input.get('owner')||'';if(uuid.test(owner))add('owner_id=?',owner);
    const city=(input.get('city')||'').slice(0,80);if(city)add('city=?',city);
    const period=input.get('period')||'';if(periods.has(period))add('rental_period=?',period);
    for(const [key,op] of [['min','>='],['max','<=']] as const){const number=Number(input.get(key));if(Number.isFinite(number)&&number>=0)add(`price${op}?`,number);}
    const rooms=input.get('rooms')||'';if(rooms==='4+')add('rooms>=?',4);else if(/^\d+$/.test(rooms))add('rooms=?',Number(rooms));
    const area=Number(input.get('area'));if(Number.isFinite(area)&&area>0)add('area_m2>=?',area);
    const brand=(input.get('brand')||'').replace(/[%_]/g,'').slice(0,40);if(brand)add(`attributes->>'brand' ilike ?`,`%${brand}%`);
    const gearbox=(input.get('gearbox')||'').slice(0,40);if(gearbox)add(`attributes->>'gearbox'=?`,gearbox);
    if(input.get('noDeposit')==='1')where.push('deposit=0');
    const favorites=(input.get('favorites')||'').split(',').filter(id=>uuid.test(id)).slice(0,200);if(input.has('favorites')){if(!favorites.length)return reply({items:[],total:0});values.push(favorites);where.push(`id=any($${values.length}::uuid[])`);}
    const query=(input.get('query')||'').trim().slice(0,120);for(const token of query.split(/\s+/).filter(Boolean).slice(0,8)){values.push(`%${token.replace(/[%_]/g,'')}%`);where.push(`(title ilike $${values.length} or city ilike $${values.length} or coalesce(district,'') ilike $${values.length} or coalesce(attributes->>'brand','') ilike $${values.length} or coalesce(attributes->>'model','') ilike $${values.length})`);}
    const page=Math.max(1,Math.min(1000,Number(input.get('page'))||1)),limit=Math.max(1,Math.min(200,Number(input.get('limit'))||18)),offset=(page-1)*limit;
    const order=input.get('sort')==='low'?'price asc':input.get('sort')==='high'?'price desc':'created_at desc,id desc';
    const condition=where.length?`where ${where.join(' and ')}`:'';
    const [rows,total]=await Promise.all([hostQuery(`select * from public.listings ${condition} order by ${order} limit ${limit} offset ${offset}`,values as never[]),hostQuery<{count:string}>(`select count(*)::text count from public.listings ${condition}`,values as never[])]);
    return reply({items:rows,total:Number(total[0]?.count||0)});
  }catch{return reply({error:'LISTINGS_UNAVAILABLE'},503);}
}
