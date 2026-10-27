import {NextResponse} from "next/server";
import {hostMode} from "../../../../lib/host/config";
import {hostQuery} from "../../../../lib/host/db";

interface HealthRow {ok:number}

export const dynamic="force-dynamic";
export async function GET(){
  const mode=hostMode();
  if(mode==="supabase")return NextResponse.json({status:"disabled",mode},{status:503,headers:{"Cache-Control":"no-store"}});
  try{
    const rows=await hostQuery<HealthRow>("SELECT 1 AS ok");
    if(rows[0]?.ok!==1)throw new Error("Unexpected database response.");
    return NextResponse.json({status:"ok",mode},{headers:{"Cache-Control":"no-store"}});
  }catch{return NextResponse.json({status:"error",mode},{status:503,headers:{"Cache-Control":"no-store"}});}
}
