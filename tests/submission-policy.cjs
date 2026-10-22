// Local isolated SQL tests, never connects to the live database.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { PGlite } = require(
  process.env.PGLITE_MODULE_PATH || "@electric-sql/pglite",
);
(async () => {
  const db = new PGlite();
  const owner = "11111111-1111-4111-8111-111111111111";
  const other = "22222222-2222-4222-8222-222222222222";
  await db.exec(`create role anon; create role authenticated; create schema auth; create schema storage;
 create table auth.users(id uuid primary key,email text);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
 create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
 insert into auth.users values('${owner}','owner@example.invalid'),('${other}','other@example.invalid');`);
  await db.exec(fs.readFileSync("supabase/schema.sql", "utf8"));
  const rules = fs.readFileSync(
    "supabase/listing-submission-rules.sql",
    "utf8",
  );
  // An installation upgraded from the former global quota may retain its ledger.
  await db.exec(`create table public.listing_monthly_usage(owner_id uuid, month_start date, submission_count integer); insert into public.listing_monthly_usage values('${owner}',current_date,100);`);
  await db.exec(rules);
  await db.exec(rules);
  async function as(id) {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      id || "",
    ]);
    if (id) await db.exec("set role authenticated");
  }
  const insert = (
    who,
    title = "Bakı şəhərində rahat kirayə mənzil",
    description = "Mənzil tam təchiz olunub, təmiz və rahat şəraitdə kirayəyə verilir.",
    created = null,
    image = "photo.jpg",
  ) =>
    db.query(
      `insert into public.listings(owner_id,category,title,description,city,price,rental_period,contact,images,created_at) values($1,'property',$2,$3,'Bakı',50,'daily','+994501234567',$4,coalesce($5::timestamptz,now())) returning id,created_at`,
      [
        who,
        title,
        description,
        [
          `https://test.supabase.co/storage/v1/object/public/listing-images/${who}/${image}`,
        ],
        created,
      ],
    );
  let checks = 0;
  async function check(name, work) { await work(); console.log("PASS", name); checks++; }
  const admin = "33333333-3333-4333-8333-333333333333";
  await db.exec(`insert into auth.users values('${admin}','admin@example.invalid'); update public.profiles set role='admin' where id='${admin}';`);
  async function approve(id) {
    await as(admin);
    await db.query("update public.listings set status='published' where id=$1", [id]);
    await as(owner);
  }
  const different = (title, image) => insert(owner, title, "Bu fərqli əmlakın ətraflı təsviri və fərqli xüsusiyyətləri var.", null, image);
  let first, second;
  await as(owner);
  await check("pending submissions do not consume allowance, forged dates ignored", async()=>{
    first = (await insert(owner, undefined, undefined, '2000-01-01T00:00:00Z')).rows[0];
    assert(new Date(first.created_at).getUTCFullYear() >= 2026);
    second = (await different("Sumqayıtda fərqli yeni mənzil", "second.jpg")).rows[0];
    assert.equal((await db.query("select public.has_category_listing_allowance('property') as allowed")).rows[0].allowed,true);
  });
  await check("rejected ads can be corrected or replaced before any approval", async()=>{
    await as(admin);
    await db.query("update public.listings set status='rejected',rejection_reason='Şəkillər daha aydın olmalıdır.' where id=$1",[first.id]);
    await as(owner);
    await db.query("update public.listings set status='pending',price=60 where id=$1",[first.id]);
    await different("Üçüncü fərqli kirayə mənzil", "third.jpg");
  });
  await check("first approval consumes only the owner's category allowance", async()=>{
    await approve(first.id);
    assert.equal((await db.query("select public.has_category_listing_allowance('property') as allowed")).rows[0].allowed,false);
    assert.equal((await db.query("select public.has_category_listing_allowance('car') as allowed")).rows[0].allowed,true);
    await assert.rejects(different("Dördüncü fərqli kirayə mənzil", "fourth.jpg"), e=>e.code==='PML01');
    const car=(await db.query(`insert into public.listings(owner_id,category,title,description,city,price,rental_period,contact,images) values($1,'car','Tam təchizatlı kirayə avtomobil','Kirayə avtomobil haqqında kifayət qədər ətraflı məlumat.','Bakı',60,'daily','+994501234567',$2) returning id`,[owner,[`https://test.supabase.co/storage/v1/object/public/listing-images/${owner}/car.jpg`]])).rows[0];
    await approve(car.id);
  });
  await check("an admin approving another owner's second pending ad cannot bypass quota",async()=>{
    await as(admin);
    await assert.rejects(db.query("update public.listings set status='published' where id=$1",[second.id]),e=>e.code==='PML01');
    await as(owner);
  });
  await check("editing and reapproving the same listing does not consume another slot",async()=>{
    await db.query("update public.listings set price=65,status='pending' where id=$1",[first.id]);
    await approve(first.id);
    await db.query("update public.listings set status='pending',price=70 where id=$1",[second.id]);
  });
  await check("changing an approved ad's category cannot bypass another category's quota",async()=>{
    await db.query("update public.listings set status='pending',category='car' where id=$1",[first.id]);
    await as(admin);
    await assert.rejects(db.query("update public.listings set status='published' where id=$1",[first.id]),e=>e.code==='PML01');
    await db.query("update public.listings set category='property',status='published' where id=$1",[first.id]);
    await as(owner);
  });
  await check("archive/delete does not remove a previously approved slot",async()=>{
    await db.query("update public.listings set status='archived' where id=$1",[first.id]);
    await as(null); await db.query("delete from public.listings where id=$1",[first.id]); await as(owner);
    await assert.rejects(different("Başqa yeni kirayə mənzil elanı", "archive.jpg"),e=>e.code==='PML01');
  });
  await check("clients cannot forge or delete approval usage or promote themselves",async()=>{
    await assert.rejects(db.exec("delete from public.listing_approval_usage"));
    await assert.rejects(db.query("update public.profiles set role='admin' where id=$1",[owner]));
    await assert.rejects(db.query("insert into public.listing_approval_usage(listing_id,owner_id,category) values(gen_random_uuid(),$1,'property')",[owner]));
  });
  await check("another account has a separate category allowance",async()=>{
    await as(other); await insert(other);
    assert.equal((await db.query("select public.has_category_listing_allowance('property') as allowed")).rows[0].allowed,true);
  });
  await check("admin-panel accounts can submit and publish many ads in the same category",async()=>{
    await as(admin);
    for(let i=0;i<3;i++){
      const row=(await insert(admin,`Administratorun kirayə mənzili ${i}`,`Bu ${i} nömrəli mənzilin fərqli və ətraflı kirayə məlumatıdır.`,null,`admin-${i}.jpg`)).rows[0];
      await db.query("update public.listings set status='published' where id=$1",[row.id]);
    }
    assert.equal((await db.query("select public.has_category_listing_allowance('property') as allowed")).rows[0].allowed,true);
  });
  await check("duplicate protection still applies independently of the quota",async()=>{
    await as(other);
    await assert.rejects(insert(other, "  Bakı   şəhərində rahat kirayə mənzil  ", undefined,null,"duplicate.jpg"),e=>e.code==='PDU01');
  });
  await check("previous-month approval does not consume the current month",async()=>{
    await as(null);
    await db.query("update public.listing_approval_usage set first_approved_at='2020-01-01' where owner_id=$1",[owner]);
    await as(owner);
    assert.equal((await db.query("select public.has_category_listing_allowance('property') as allowed")).rows[0].allowed,true);
    await different("Növbəti ay üçün kirayə mənzil", "next.jpg");
  });
  await check("migration is repeatable without turning pending/rejected ads into usage",async()=>{
    await as(null); const before=(await db.query("select count(*)::int as n from public.listing_approval_usage")).rows[0].n;
    await db.exec(rules);
    assert.equal((await db.query("select count(*)::int as n from public.listing_approval_usage")).rows[0].n,before);
  });
  await db.close(); console.log(`${checks} submission policy checks passed`);
})().catch(error=>{ console.error(error); process.exitCode=1; });
