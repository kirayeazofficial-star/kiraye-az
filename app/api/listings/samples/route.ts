import {NextResponse} from "next/server";
import {hostQuery} from "../../../../lib/host/db";
import {SAMPLE_UNTIL} from "../../../../lib/sample-listings";
import {categories} from "../../../../lib/marketplace";

export const dynamic="force-dynamic";
// Categories that still show sample listings: fewer than SAMPLE_UNTIL live real listings.
export async function GET(){
  try{
    const rows=await hostQuery<{category:string;n:string}>(`select category,count(*)::text n from public.listings where status='published' and deleted_at is null and (expires_at is null or expires_at>now()) and not exists(select 1 from auth.users bu where bu.id=owner_id and bu.disabled_at is not null) group by category`);
    const live=new Map(rows.map(row=>[row.category,Number(row.n)]));
    return NextResponse.json({categories:categories.map(item=>item.id).filter(id=>(live.get(id)||0)<SAMPLE_UNTIL)},{headers:{"Cache-Control":"public, max-age=60"}});
  }catch{return NextResponse.json({categories:[]},{headers:{"Cache-Control":"no-store"}});}
}
