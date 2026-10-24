const assert=require('node:assert/strict'),fs=require('node:fs');
const {PGlite}=require(process.env.PGLITE_MODULE_PATH||'@electric-sql/pglite');
(async()=>{const db=new PGlite();const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',admin='33333333-3333-4333-8333-333333333333';
await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create schema storage;
create table auth.users(id uuid primary key,email text);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;
insert into auth.users values('${owner}','owner@example.invalid'),('${other}','other@example.invalid'),('${admin}','admin@example.invalid');`);
await db.exec(fs.readFileSync('supabase/schema.sql','utf8'));await db.exec(fs.readFileSync('supabase/listing-submission-rules.sql','utf8'));

const migration=fs.readFileSync('supabase/property-details.sql','utf8');await db.exec(migration);await db.exec(migration);
const id='44444444-4444-4444-8444-444444444444';await db.query(`insert into public.listings(id,owner_id,category,title,description,city,price,rental_period,contact,images,status,attributes) values($1,$2,'property','Bağ evinin aylıq kirayəsi','Münasib şərtlərlə geniş və təmiz bağ evi kirayəyə verilir.','Bakı',500,'monthly','+994501234567',$3,'pending','{"kind":"Bağ evi","bathrooms":"2"}')`,[id,owner,[`https://fixture.supabase.co/storage/v1/object/public/listing-images/${owner}/one.jpg`]]);
for(const value of ['0','21','1.5','not a number'])await assert.rejects(db.query("update public.listings set attributes=jsonb_set(attributes,'{bathrooms}',$2::jsonb) where id=$1",[id,JSON.stringify(value)]),e=>e.code==='23514');
const ad=(await db.query('select * from public.listings where id=$1',[id])).rows[0];assert.equal(ad.attributes.bathrooms,'2');assert.equal(ad.attributes.kind,'Bağ evi');assert.equal(ad.images.length,1);await db.close();console.log('PASS optional bathroom count migration, integer validation and existing listing preservation');
})().catch(e=>{console.error(e);process.exit(1)});
