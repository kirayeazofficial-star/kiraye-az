import {NextResponse} from "next/server";
import {hostMode} from "../../../../lib/host/config";
import {hostQuery} from "../../../../lib/host/db";
import nodemailer from "nodemailer";

// Mail check without secrets: names of missing settings or a short error code.
async function mailState(){
  const names=["KIRAYE_SMTP_HOST","KIRAYE_SMTP_USER","KIRAYE_SMTP_PASSWORD"];
  const missing=names.filter(name=>!process.env[name]?.trim());
  if(missing.length)return `missing:${missing.join(",")}`;
  const port=Number(process.env.KIRAYE_SMTP_PORT||465);
  try{
    await nodemailer.createTransport({host:process.env.KIRAYE_SMTP_HOST,port,secure:port===465,auth:{user:process.env.KIRAYE_SMTP_USER,pass:process.env.KIRAYE_SMTP_PASSWORD},connectionTimeout:8000,greetingTimeout:8000}).verify();
    return "ok";
  }catch(error){return `failed:${(error as {code?:string}).code||"unknown"}`;}
}

interface HealthRow {ok:number}
interface SchemaRow {users_table:string|null;profiles_table:string|null;listings_table:string|null;sessions_table:string|null;profile_no:boolean;display_name:boolean;phone:boolean}

export const dynamic="force-dynamic";
export async function GET(){
  const mode=hostMode();
  try{
    const rows=await hostQuery<HealthRow>("SELECT 1 AS ok");
    if(rows[0]?.ok!==1)throw new Error("Unexpected database response.");
    const schema=await hostQuery<SchemaRow>(`select to_regclass('auth.users')::text users_table,to_regclass('auth.sessions')::text sessions_table,to_regclass('public.profiles')::text profiles_table,to_regclass('public.listings')::text listings_table,exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='profile_no') profile_no,exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='display_name') display_name,exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='phone') phone`);
    const tablesReady=Object.values(schema[0]||{}).every(Boolean);
    const mail=await mailState();
    const counts=await hostQuery<{status:string;count:string}>(`select status,count(*)::text count from public.listings group by status`);
    return NextResponse.json({status:tablesReady?"ok":"schema_missing",mode,tablesReady,mail,listings:Object.fromEntries(counts.map(row=>[row.status,Number(row.count)]))},{status:tablesReady?200:503,headers:{"Cache-Control":"no-store"}});
  }catch{return NextResponse.json({status:"error",mode},{status:503,headers:{"Cache-Control":"no-store"}});}
}
