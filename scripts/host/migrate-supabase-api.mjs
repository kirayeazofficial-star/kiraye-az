import {createClient} from '@supabase/supabase-js';
import pg from 'pg';

const {Client}=pg;
const apply=process.argv.includes('--apply');
const sourceUrl=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const required=['KIRAYE_DB_HOST','KIRAYE_DB_NAME','KIRAYE_DB_USER','KIRAYE_DB_PASSWORD'];
const missing=required.filter(name=>!process.env[name]?.trim());
if(!sourceUrl||!serviceKey||missing.length){
  console.error(`Missing server settings: ${[
    ...(!sourceUrl?['NEXT_PUBLIC_SUPABASE_URL']:[]),...(!serviceKey?['SUPABASE_SERVICE_ROLE_KEY']:[]),...missing,
  ].join(', ')}`);process.exit(1);
}

const supabase=createClient(sourceUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
const target=new Client({host:process.env.KIRAYE_DB_HOST,port:Number(process.env.KIRAYE_DB_PORT||5432),database:process.env.KIRAYE_DB_NAME,user:process.env.KIRAYE_DB_USER,password:process.env.KIRAYE_DB_PASSWORD});
const tables=[
  'profiles','profile_contact_changes','profile_change_attempts','listings','listing_reports',
  'staff_members','staff_events','moderation_events','listing_category_limits',
  'listing_cycle_usage','listing_approval_usage','chat_threads','chat_messages','chat_reads',
  'chat_blocks','chat_reports','listing_views','wallet_entries',
];
function ident(value){return `"${String(value).replaceAll('"','""')}"`;}
async function targetColumns(table){
  const {rows}=await target.query(`select column_name,is_generated,identity_generation from information_schema.columns where table_schema='public' and table_name=$1 order by ordinal_position`,[table]);
  return rows;
}
async function targetCount(schema,table){const {rows}=await target.query(`select count(*)::bigint count from ${ident(schema)}.${ident(table)}`);return BigInt(rows[0].count);}
async function ensureEmpty(){
  const occupied=[];
  if(await targetCount('auth','users')>0n)occupied.push('auth.users');
  for(const table of tables)if(await targetCount('public',table)>0n)occupied.push(`public.${table}`);
  if(occupied.length)throw new Error(`Target is not empty: ${occupied.join(', ')}`);
}
async function allUsers(){
  const users=[];
  for(let page=1;;page++){
    const {data,error}=await supabase.auth.admin.listUsers({page,perPage:1000});
    if(error)throw error;users.push(...data.users);if(data.users.length<1000)break;
  }
  return users;
}
async function allRows(table){
  const rows=[];
  for(let from=0;;from+=1000){
    const {data,error}=await supabase.from(table).select('*').range(from,from+999);
    if(error){if(['42P01','PGRST205'].includes(error.code)||/does not exist|schema cache/i.test(error.message))return {rows:[],missing:true};throw new Error(`${table}: ${error.message}`);}
    rows.push(...data);if(data.length<1000)break;
  }
  return {rows,missing:false};
}
async function insertUsers(users){
  for(const user of users)await target.query(`insert into auth.users
    (id,email,password_hash,email_confirmed_at,disabled_at,created_at,updated_at)
    values($1,$2,null,$3,$4,$5,$6) on conflict(id) do nothing`,[
      user.id,user.email,user.email_confirmed_at,user.banned_until||null,user.created_at,user.updated_at,
    ]);
  for(const user of users)for(const identity of user.identities||[]){
    const providerId=identity.identity_id||identity.id||identity.identity_data?.sub;
    if(!providerId||!identity.provider)continue;
    await target.query(`insert into auth.oauth_identities(provider,provider_user_id,user_id,created_at)
      values($1,$2,$3,$4) on conflict(provider,provider_user_id) do nothing`,[
        identity.provider,String(providerId),user.id,identity.created_at||user.created_at,
      ]);
  }
}
async function insertRows(table,rows){
  if(!rows.length)return 0;
  const available=new Set(Object.keys(rows[0]));
  const columns=(await targetColumns(table)).filter(column=>column.is_generated==='NEVER'&&available.has(column.column_name));
  const names=columns.map(column=>column.column_name);
  if(!names.length)throw new Error(`No compatible columns for public.${table}`);
  const override=columns.some(column=>column.identity_generation)?' overriding system value':'';
  const params=names.map((_,index)=>`$${index+1}`).join(',');
  const sql=`insert into public.${ident(table)} (${names.map(ident).join(',')})${override} values(${params}) on conflict do nothing`;
  for(const row of rows)await target.query(sql,names.map(name=>row[name]));
  return rows.length;
}
async function resetIdentities(){
  const {rows}=await target.query(`select n.nspname schema_name,c.relname table_name,a.attname column_name,pg_get_serial_sequence(format('%I.%I',n.nspname,c.relname),a.attname) sequence_name from pg_class c join pg_namespace n on n.oid=c.relnamespace join pg_attribute a on a.attrelid=c.oid and a.attidentity<>'' where n.nspname in ('auth','public') and c.relkind='r'`);
  for(const row of rows){const {rows:[maximum]}=await target.query(`select max(${ident(row.column_name)}) value from ${ident(row.schema_name)}.${ident(row.table_name)}`);if(maximum.value!==null)await target.query('select setval($1,$2,true)',[row.sequence_name,maximum.value]);}
}

await target.connect();
try{
  await ensureEmpty();
  const users=await allUsers();const sourceData=new Map();
  for(const table of tables)sourceData.set(table,await allRows(table));
  const summary={users:users.length};for(const [table,result] of sourceData)summary[table]=result.missing?'missing':result.rows.length;
  console.log(JSON.stringify({mode:apply?'apply':'dry-run',source:summary},null,2));
  if(!apply)console.log('HTTPS dry run complete. No target rows were written.');
  else{
    await target.query('begin');
    try{
      await insertUsers(users);const copied={users:users.length};
      for(const [table,result] of sourceData)copied[table]=result.missing?'missing':await insertRows(table,result.rows);
      await resetIdentities();await target.query('commit');
      console.log(JSON.stringify({status:'committed',copied,passwords:'recovery-required'},null,2));
    }catch(error){await target.query('rollback');throw error;}
  }
}finally{await target.end();}
