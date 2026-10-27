import {NextResponse} from "next/server";
import {hostMode} from "../../../../lib/host/config";
import {hostQuery} from "../../../../lib/host/db";

interface HealthRow {ok:number}
interface SchemaRow {users_table:string|null;profiles_table:string|null;listings_table:string|null;sessions_table:string|null;profile_no:boolean;display_name:boolean;phone:boolean}

export const dynamic="force-dynamic";
export async function GET(){
  const mode=hostMode();
  if(mode==="supabase")return NextResponse.json({status:"disabled",mode},{status:503,headers:{"Cache-Control":"no-store"}});
  try{
    const rows=await hostQuery<HealthRow>("SELECT 1 AS ok");
    if(rows[0]?.ok!==1)throw new Error("Unexpected database response.");
    const schema=await hostQuery<SchemaRow>(`select to_regclass('auth.users')::text users_table,to_regclass('auth.sessions')::text sessions_table,to_regclass('public.profiles')::text profiles_table,to_regclass('public.listings')::text listings_table,exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='profile_no') profile_no,exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='display_name') display_name,exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='phone') phone`);
    const tablesReady=Object.values(schema[0]||{}).every(Boolean);
    return NextResponse.json({status:tablesReady?"ok":"schema_missing",mode,tablesReady},{status:tablesReady?200:503,headers:{"Cache-Control":"no-store"}});
  }catch{return NextResponse.json({status:"error",mode},{status:503,headers:{"Cache-Control":"no-store"}});}
}
