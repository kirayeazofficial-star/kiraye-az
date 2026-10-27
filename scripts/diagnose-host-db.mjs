import {createRequire} from 'node:module';
import {resolve} from 'node:path';

const live=resolve(process.argv[2]||'/home/kiraytfg/kirayeal');
const require=createRequire(resolve(live,'package.json'));
require('@next/env').loadEnvConfig(live,false,{info(){},error(){}});
const {Client}=require('pg');
const names=['KIRAYE_DB_HOST','KIRAYE_DB_NAME','KIRAYE_DB_USER','KIRAYE_DB_PASSWORD'];
const missing=names.filter(name=>!process.env[name]?.trim());
console.log('backend:',process.env.KIRAYE_BACKEND||'(missing)');
if(missing.length){console.log('missing settings:',missing.join(', '));process.exit(1);}
const client=new Client({host:process.env.KIRAYE_DB_HOST,port:Number(process.env.KIRAYE_DB_PORT||5432),database:process.env.KIRAYE_DB_NAME,user:process.env.KIRAYE_DB_USER,password:process.env.KIRAYE_DB_PASSWORD,connectionTimeoutMillis:10000});
try{
 await client.connect();console.log('database connection: OK');
 const tables=await client.query(`select to_regclass('auth.users')::text users,to_regclass('auth.sessions')::text sessions,to_regclass('public.profiles')::text profiles,to_regclass('public.listings')::text listings,to_regclass('public.staff_members')::text staff_members`);
 console.log('tables:',tables.rows[0]);
 const columns=await client.query(`select column_name from information_schema.columns where table_schema='public' and table_name='profiles' order by ordinal_position`);
 console.log('profile columns:',columns.rows.map(row=>row.column_name).join(', '));
 const counts=await client.query(`select (select count(*)::int from auth.users) users,(select count(*)::int from public.profiles) profiles,(select count(*)::int from auth.sessions where revoked_at is null and expires_at>now()) active_sessions,(select count(*)::int from public.listings) listings`);
 console.log('counts:',counts.rows[0]);
 const owner=await client.query(`select u.id,p.id is not null profile_exists,p.profile_no,p.role,s.staff_role from auth.users u left join public.profiles p on p.id=u.id left join public.staff_members s on s.user_id=u.id where lower(u.email)='kirayeal.az@gmail.com'`);
 console.log('leader account:',owner.rows[0]||'NOT FOUND');
 if(owner.rows[0]){
  const probe=await client.query(`select p.profile_no,p.display_name,p.phone,u.email from auth.users u join public.profiles p on p.id=u.id where u.id=$1`,[owner.rows[0].id]);
  console.log('profile query:',probe.rowCount===1?'OK':'NO ROW');
 }
 const migrations=await client.query(`select to_regclass('public.kiraye_schema_migrations')::text table_name`);
 if(migrations.rows[0].table_name){const applied=await client.query(`select name from public.kiraye_schema_migrations order by name`);console.log('migrations:',applied.rows.map(row=>row.name).join(', ')||'(none)');}
}catch(error){console.log('FAILED:',error.code||'',error.message);process.exitCode=1;}finally{await client.end().catch(()=>{});}
