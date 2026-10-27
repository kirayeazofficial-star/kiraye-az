import {readFile,readdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createRequire} from 'node:module';

const root=resolve(process.argv[2]||'.');
if((process.env.KIRAYE_BACKEND||'').trim()!=='host'){
  console.log('Host migrations skipped: KIRAYE_BACKEND is not host.');
  process.exit(0);
}
const required=['KIRAYE_DB_HOST','KIRAYE_DB_NAME','KIRAYE_DB_USER','KIRAYE_DB_PASSWORD'];
if(required.some(name=>!process.env[name]?.trim()))throw new Error('Host migration database configuration is incomplete.');
const require=createRequire(join(root,'package.json'));
const {Client}=require('pg');
const client=new Client({
  host:process.env.KIRAYE_DB_HOST,
  port:Number(process.env.KIRAYE_DB_PORT||5432),
  database:process.env.KIRAYE_DB_NAME,
  user:process.env.KIRAYE_DB_USER,
  password:process.env.KIRAYE_DB_PASSWORD,
  connectionTimeoutMillis:10000,
});
await client.connect();
try{
  await client.query(`create table if not exists public.kiraye_schema_migrations(name text primary key,applied_at timestamptz not null default now())`);
  const directory=join(root,'host','postgres');
  const files=(await readdir(directory)).filter(name=>/^\d+.*\.sql$/.test(name)&&name!=='001-core.sql').sort();
  for(const name of files){
    const found=await client.query('select 1 from public.kiraye_schema_migrations where name=$1',[name]);
    if(found.rowCount)continue;
    const sql=await readFile(join(directory,name),'utf8');
    await client.query(sql);
    await client.query('insert into public.kiraye_schema_migrations(name) values($1)',[name]);
    console.log(`Applied host migration: ${name}`);
  }
}finally{await client.end();}
