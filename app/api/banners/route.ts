import {NextRequest,NextResponse} from "next/server";
import {hostQuery} from "../../../lib/host/db";
export const dynamic="force-dynamic";
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});
// Active banners for one placement; POST counts a click.
export async function GET(request:NextRequest){
  const asked=request.nextUrl.searchParams.get("placement")||"",placement=["listing","left","right"].includes(asked)?asked:"home";
  try{
    const items=await hostQuery(`select id,title,image_url,link_url,media_type from public.banners where placement=$1 and active and (starts_at is null or starts_at<=(now() at time zone 'Asia/Baku')::date) and (ends_at is null or ends_at>=(now() at time zone 'Asia/Baku')::date) order by sort_order,created_at desc limit 10`,[placement]);
    return reply({items});
  }catch{return reply({items:[]});}
}
export async function POST(request:NextRequest){
  try{const id=String((await request.json() as {id?:unknown}).id||"");if(/^[0-9a-f-]{36}$/i.test(id))await hostQuery(`update public.banners set clicks=clicks+1 where id=$1`,[id]);}catch{}
  return NextResponse.json({ok:true});
}
