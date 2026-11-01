import "server-only";
import {hostQuery} from "./db";
import {cleanLimitRules,defaultLimitRules,type LimitRules} from "../limit-rules";

// The leader's limit rules from site_settings; the defaults (rule off) when the table is not there yet.
export async function limitRules():Promise<LimitRules>{
  const rows=await hostQuery<{value:unknown}>(`select value from public.site_settings where key='limit_rules'`).catch(()=>[]);
  return rows[0]?cleanLimitRules(rows[0].value):defaultLimitRules;
}
export async function saveLimitRules(rules:LimitRules){
  await hostQuery(`insert into public.site_settings(key,value,updated_at) values('limit_rules',$1::jsonb,now()) on conflict(key) do update set value=excluded.value,updated_at=now()`,[JSON.stringify(rules)]);
}
