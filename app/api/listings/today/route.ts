import {NextResponse} from "next/server";
import {hostQuery} from "../../../../lib/host/db";
export const dynamic="force-dynamic";
// "Bu gün — N yeni elan": listings published today (Baku time) that are visible on the site.
export async function GET(){
  try{
    const rows=await hostQuery<{count:string}>(`select count(*)::text count from public.listings where status='published' and (expires_at is null or expires_at>now()) and created_at>=((now() at time zone 'Asia/Baku')::date::timestamp at time zone 'Asia/Baku')`);
    return NextResponse.json({count:Number(rows[0]?.count||0)},{headers:{"Cache-Control":"public, max-age=120"}});
  }catch{return NextResponse.json({count:0});}
}
