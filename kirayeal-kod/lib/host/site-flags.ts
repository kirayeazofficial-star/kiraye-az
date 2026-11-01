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
