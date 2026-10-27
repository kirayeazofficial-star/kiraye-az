import pg from 'pg';

const {Client}=pg;
const apply=process.argv.includes('--apply');
const sourceUrl=process.env.SUPABASE_DATABASE_URL?.trim();
const required=['KIRAYE_DB_HOST','KIRAYE_DB_NAME','KIRAYE_DB_USER','KIRAYE_DB_PASSWORD'];
const missing=required.filter(name=>!process.env[name]?.trim());
if(!sourceUrl||missing.length){
  console.error(`Missing server settings: ${[...(!sourceUrl?['SUPABASE_DATABASE_URL']:[]),...missing].join(', ')}`);
  process.exit(1);
}

const source=new Client({connectionString:sourceUrl,ssl:{rejectUnauthorized:false}});
const target=new Client({
  host:process.env.KIRAYE_DB_HOST,port:Number(process.env.KIRAYE_DB_PORT||5432),
  database:process.env.KIRAYE_DB_NAME,user:process.env.KIRAYE_DB_USER,
  password:process.env.KIRAYE_DB_PASSWORD,
});

const publicTables=[
  'profiles','profile_contact_changes','profile_change_attempts','listings',
  'listing_reports','staff_members','staff_events','moderation_events',
  'listing_category_limits','listing_cycle_usage','listing_approval_usage',
  'chat_threads','chat_messages','chat_reads','chat_blocks','chat_reports',
  'listing_views','wallet_entries',
];

function ident(value){return `"${String(value).replaceAll('"','""')}"`;}
async function columns(client,schema,table){
  const {rows}=await client.query(`select column_name,is_generated,identity_generation from information_schema.columns where table_schema=$1 and table_name=$2 order by ordinal_position`,[schema,table]);
  return rows;
}
async function exists(client,schema,table){
  const {rows}=await client.query('select to_regclass($1) is not null as ok',[`${schema}.${table}`]);
  return rows[0]?.ok===true;
}
async function count(client,schema,table){
  const {rows}=await client.query(`select count(*)::bigint as count from ${ident(schema)}.${ident(table)}`);
  return BigInt(rows[0].count);
}

async function copyUsers(){
  const {rows}=await source.query(`select id,email,encrypted_password as password_hash,email_confirmed_at,
    case when banned_until is not null and banned_until>now() then banned_until end as disabled_at,
    created_at,updated_at from auth.users order by created_at,id`);
  for(const row of rows)await target.query(`insert into auth.users
    (id,email,password_hash,email_confirmed_at,disabled_at,created_at,updated_at)
    values($1,$2,$3,$4,$5,$6,$7) on conflict(id) do nothing`,Object.values(row));
  return rows.length;
}

async function copyIdentities(){
  if(!await exists(source,'auth','identities'))return 0;
  const sourceColumns=new Set((await columns(source,'auth','identities')).map(x=>x.column_name));
  const providerId=sourceColumns.has('provider_id')?'provider_id':'id::text';
  const {rows}=await source.query(`select provider,${providerId} as provider_user_id,user_id,created_at
    from auth.identities where provider is not null order by created_at`);
  for(const row of rows)await target.query(`insert into auth.oauth_identities
    (provider,provider_user_id,user_id,created_at) values($1,$2,$3,$4)
    on conflict(provider,provider_user_id) do nothing`,Object.values(row));
  return rows.length;
}

async function copyIntersection(table){
  if(!await exists(source,'public',table))return {table,source:0,copied:0,skipped:true};
  const sourceColumns=new Set((await columns(source,'public',table)).map(x=>x.column_name));
  const targetColumns=(await columns(target,'public',table))
    .filter(x=>x.is_generated==='NEVER'&&sourceColumns.has(x.column_name));
  const names=targetColumns.map(x=>x.column_name);
  if(!names.length)throw new Error(`No compatible columns for public.${table}`);
  const {rows}=await source.query(`select ${names.map(ident).join(',')} from public.${ident(table)}`);
  if(rows.length){
    const params=names.map((_,index)=>`$${index+1}`).join(',');
    const override=targetColumns.some(x=>x.identity_generation)?' overriding system value':'';
    const sql=`insert into public.${ident(table)} (${names.map(ident).join(',')})${override} values(${params}) on conflict do nothing`;
    for(const row of rows)await target.query(sql,names.map(name=>row[name]));
  }
  return {table,source:rows.length,copied:rows.length,skipped:false};
}

async function ensureEmpty(){
  const occupied=[];
  for(const table of ['users'])if(await count(target,'auth',table)>0n)occupied.push(`auth.${table}`);
  for(const table of publicTables)if(await exists(target,'public',table)&&await count(target,'public',table)>0n)occupied.push(`public.${table}`);
  if(occupied.length)throw new Error(`Target is not empty: ${occupied.join(', ')}`);
}

async function resetIdentities(){
  const {rows}=await target.query(`select n.nspname schema_name,c.relname table_name,a.attname column_name,
    pg_get_serial_sequence(format('%I.%I',n.nspname,c.relname),a.attname) sequence_name
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    join pg_attribute a on a.attrelid=c.oid and a.attidentity<>''
    where n.nspname in ('auth','public') and c.relkind='r'`);
  for(const row of rows){
    const {rows:[maximum]}=await target.query(`select max(${ident(row.column_name)}) value from ${ident(row.schema_name)}.${ident(row.table_name)}`);
    if(maximum.value!==null)await target.query('select setval($1,$2,true)',[row.sequence_name,maximum.value]);
  }
}

await source.connect();await target.connect();
try{
  await ensureEmpty();
  const sourceSummary={users:Number(await count(source,'auth','users'))};
  for(const table of publicTables)sourceSummary[table]=await exists(source,'public',table)?Number(await count(source,'public',table)):0;
  console.log(JSON.stringify({mode:apply?'apply':'dry-run',source:sourceSummary},null,2));
  if(!apply){console.log('Dry run complete. No target rows were written.');process.exitCode=0;}
  else{
    await target.query('begin');
    try{
      const results=[{table:'auth.users',copied:await copyUsers()},{table:'auth.oauth_identities',copied:await copyIdentities()}];
      for(const table of publicTables)results.push(await copyIntersection(table));
      await resetIdentities();
      await target.query('commit');
      console.log(JSON.stringify({status:'committed',results},null,2));
    }catch(error){await target.query('rollback');throw error;}
  }
}finally{await Promise.allSettled([source.end(),target.end()]);}
