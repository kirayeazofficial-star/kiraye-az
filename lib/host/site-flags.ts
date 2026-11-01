import "server-only";
import {hostQuery} from "./db";

// Paid services on/off (Rəhbər paneli → «Ödəniş və limitlər»). On when the setting is missing.
export async function paymentsEnabled(){
  const rows=await hostQuery<{enabled:boolean|null}>(`select (value->>'enabled')::boolean as enabled from public.site_settings where key='payments'`).catch(()=>[]);
  return rows[0]?.enabled!==false;
}
export async function setPaymentsEnabled(enabled:boolean){
  await hostQuery(`insert into public.site_settings(key,value,updated_at) values('payments',$1::jsonb,now()) on conflict(key) do update set value=excluded.value,updated_at=now()`,[JSON.stringify({enabled})]);
}

// Announcement bar at the top of every page (Rəhbər paneli → «Sayt ayarları»).
export type Announcement={enabled:boolean;text:string;tone:"info"|"warn";link:string};
export type Maintenance={enabled:boolean;text:string};
const setting=async<T>(key:string,clean:(value:Record<string,unknown>)=>T)=>{
  const rows=await hostQuery<{value:Record<string,unknown>}>(`select value from public.site_settings where key=$1`,[key]).catch(()=>[]);
  return clean(rows[0]?.value||{});
};
const text=(value:unknown,max:number)=>String(value??"").replace(/\s+/g," ").trim().slice(0,max);
export const cleanAnnouncement=(v:Record<string,unknown>):Announcement=>{
  const link=text(v.link,300);
  return{enabled:v.enabled===true,text:text(v.text,200),tone:v.tone==="warn"?"warn":"info",link:/^(\/(?!\/)|https:\/\/)/.test(link)?link:""};
};
export const cleanMaintenance=(v:Record<string,unknown>):Maintenance=>({enabled:v.enabled===true,text:text(v.text,300)});
export const announcement=()=>setting("announcement",cleanAnnouncement);
export const maintenance=()=>setting("maintenance",cleanMaintenance);
export async function saveSetting(key:"announcement"|"maintenance",value:Announcement|Maintenance){
  await hostQuery(`insert into public.site_settings(key,value,updated_at) values($1,$2::jsonb,now()) on conflict(key) do update set value=excluded.value,updated_at=now()`,[key,JSON.stringify(value)]);
}
