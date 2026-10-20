// Isolated Postgres-compatible policy tests, never connects to a live project.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { PGlite } = require(
  process.env.PGLITE_MODULE_PATH || "@electric-sql/pglite",
);
(async () => {
  const db = new PGlite();
  let checks = 0;
  const owner = "11111111-1111-4111-8111-111111111111",
    other = "22222222-2222-4222-8222-222222222222",
    admin = "33333333-3333-4333-8333-333333333333";
  await db.exec(`create role anon; create role authenticated; create schema auth; create schema storage;
 create table auth.users(id uuid primary key,email text);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to anon,authenticated;
 grant execute on function auth.uid() to anon,authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;
 create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
 grant usage on schema storage to anon,authenticated;
 grant select,insert,delete on storage.objects to anon,authenticated;
 insert into auth.users values('${owner}','owner@example.com'),('${other}','other@example.com'),('${admin}','admin@example.com');`);
  const sql = fs.readFileSync("supabase/schema.sql", "utf8");
  await db.exec(sql);
  await db.exec(sql);
  checks++;
  console.log("PASS schema applies twice without data loss");
  await db.exec(
    `insert into public.profiles(id,role) values('${owner}','user'),('${other}','user'),('${admin}','admin') on conflict(id) do update set role=excluded.role`,
  );
  await db.exec(sql);
  assert.equal(
    (await db.query(`select role from public.profiles where id='${admin}'`))
      .rows[0].role,
    "admin",
  );
  checks++;
  console.log("PASS schema upgrades preserve administrator role");
  const newUser = "44444444-4444-4444-8444-444444444444";
  await db.exec(
    `insert into auth.users(id,email) values('${newUser}','new@example.com')`,
  );
  assert.equal(
    (await db.query(`select role from public.profiles where id='${newUser}'`))
      .rows[0].role,
    "user",
  );
  checks++;
  console.log("PASS new accounts receive a profile automatically");
  async function as(id) {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      id || "",
    ]);
    await db.exec(`set role ${id ? "authenticated" : "anon"}`);
  }
  async function denied(name, sql) {
    await assert.rejects(db.exec(sql));
    checks++;
    console.log("PASS", name);
  }
  await as(owner);
  await denied(
    "profile self-promotion rejected",
    "update public.profiles set role='admin'",
  );
  const listing = {
    owner_id: owner,
    category: "property",
    title: "Test apartment for rental",
    city: "Bakı",
    price: 45,
    rental_period: "daily",
    description:
      "A detailed rental description with more than thirty characters.",
    contact: "050 123 45 67",
    images: [
      `https://test.supabase.co/storage/v1/object/public/listing-images/${owner}/photo.jpg`,
    ],
  };
  const cols = Object.keys(listing);
  const values = Object.values(listing);
  const insert = await db.query(
    `insert into public.listings(${cols.join(",")}) values(${values.map((_, i) => "$" + (i + 1)).join(",")}) returning id`,
    values,
  );
  const id = insert.rows[0].id;
  checks++;
  console.log("PASS owner submits pending listing");
  await denied(
    "owner cannot self-publish",
    `update public.listings set status='published' where id='${id}'`,
  );
  await denied(
    "owner cannot transfer listing",
    `update public.listings set owner_id='${other}' where id='${id}'`,
  );
  await as(other);
  assert.equal(
    (await db.query("select * from public.listings")).rows.length,
    0,
  );
  checks++;
  console.log("PASS other user cannot see pending listing");
  assert.equal(
    (
      await db.query(
        `update public.listings set status='archived' where id='${id}' returning id`,
      )
    ).rows.length,
    0,
  );
  checks++;
  console.log("PASS other user cannot modify listing");
  await as(null);
  assert.equal(
    (await db.query("select * from public.listings")).rows.length,
    0,
  );
  checks++;
  console.log("PASS anonymous cannot see pending listing");
  await as(admin);
  assert.equal(
    (await db.query("select * from public.listings")).rows.length,
    1,
  );
  await db.exec(
    `update public.listings set status='published' where id='${id}'`,
  );
  checks++;
  console.log("PASS admin sees and approves pending listing");
  await as(null);
  assert.equal(
    (await db.query("select * from public.listings")).rows.length,
    1,
  );
  checks++;
  console.log("PASS anonymous sees published listing");
  await as(owner);
  await db.exec(
    `update public.listings set title='Updated title for review',status='pending',deposit=100,min_days=2 where id='${id}'`,
  );
  checks++;
  console.log("PASS owner edits return listing to moderation");
  await as(null);
  assert.equal(
    (await db.query("select * from public.listings")).rows.length,
    0,
  );
  checks++;
  console.log("PASS edited listing hidden until reapproved");
  await as(admin);
  await denied(
    "admin must give rejection reason",
    `update public.listings set status='rejected' where id='${id}'`,
  );
  await db.exec(
    `update public.listings set status='rejected',rejection_reason='Please provide clearer photographs' where id='${id}'`,
  );
  await as(owner);
  assert.equal(
    (
      await db.query(
        `select rejection_reason from public.listings where id='${id}'`,
      )
    ).rows[0].rejection_reason,
    "Please provide clearer photographs",
  );
  checks++;
  console.log("PASS owner can see moderation rejection reason");
  await denied(
    "negative deposit rejected",
    `update public.listings set status='pending',deposit=-1 where id='${id}'`,
  );
  await denied(
    "zero rental period rejected",
    `update public.listings set status='pending',min_days=0 where id='${id}'`,
  );
  await denied(
    "invalid availability range rejected",
    `update public.listings set status='pending',available_from='2026-12-10',available_until='2026-12-01' where id='${id}'`,
  );
  await denied(
    "owner cannot change listing identity",
    `update public.listings set status='pending',created_at='2020-01-01' where id='${id}'`,
  );
  await as(admin);
  await db.exec(
    `update public.listings set status='published' where id='${id}'`,
  );
  assert.equal(
    (
      await db.query(
        `select rejection_reason from public.listings where id='${id}'`,
      )
    ).rows[0].rejection_reason,
    null,
  );
  checks++;
  console.log("PASS approval clears previous rejection reason");
  await as(owner);
  await denied(
    "owner cannot report own listing",
    `insert into public.listing_reports(listing_id,reporter_id,reason,message) values('${id}','${owner}','Başqa səbəb','This is a detailed report')`,
  );
  await as(other);
  await denied(
    "reporter identity cannot be forged",
    `insert into public.listing_reports(listing_id,reporter_id,reason,message) values('${id}','${owner}','Başqa səbəb','This is a detailed report')`,
  );
  const report = await db.query(
    `insert into public.listing_reports(listing_id,reporter_id,reason,message) values('${id}','${other}','Başqa səbəb','This is a detailed report') returning id`,
  );
  const reportId = report.rows[0].id;
  checks++;
  console.log("PASS authenticated visitor reports a published listing");
  await denied(
    "duplicate report rejected",
    `insert into public.listing_reports(listing_id,reporter_id,reason,message) values('${id}','${other}','Başqa səbəb','This is a detailed report')`,
  );
  assert.equal(
    (
      await db.query(
        `update public.listing_reports set status='resolved' where id='${reportId}' returning id`,
      )
    ).rows.length,
    0,
  );
  checks++;
  console.log("PASS reporter cannot resolve own report");
  await as(admin);
  await db.exec(
    `insert into public.listing_reports(listing_id,reporter_id,reason,message) values('${id}','${admin}','Başqa səbəb','An independent detailed report')`,
  );
  assert.equal(
    (await db.query("select * from public.listing_reports")).rows.length,
    2,
  );
  await db.exec(
    `update public.listing_reports set status='resolved' where id='${reportId}'`,
  );
  checks++;
  console.log("PASS admin sees and resolves reports");
  await as(other);
  assert.equal(
    (await db.query("select * from public.listing_reports")).rows.length,
    1,
  );
  checks++;
  console.log("PASS reporters cannot read each other reports");
  await as(null);
  await denied(
    "anonymous reports rejected",
    `insert into public.listing_reports(listing_id,reporter_id,reason,message) values('${id}','${other}','Başqa səbəb','This is a detailed report')`,
  );
  await as(owner);
  await denied(
    "published content cannot be edited without re-review",
    `update public.listings set title='Changed rental title' where id='${id}'`,
  );
  await db.exec(
    `update public.listings set status='archived' where id='${id}'`,
  );
  checks++;
  console.log("PASS owner can archive listing");
  await denied(
    "cannot upload into another user folder",
    `insert into storage.objects(bucket_id,name) values('listing-images','${other}/photo.jpg')`,
  );
  await db.exec(
    `insert into storage.objects(bucket_id,name) values('listing-images','${owner}/photo.jpg')`,
  );
  checks++;
  console.log("PASS owner can upload into own folder");
  await denied(
    "short description rejected",
    `insert into public.listings(owner_id,category,title,city,price,rental_period,description,contact,images) values('${owner}','property','A valid long title','Bakı',45,'daily','short','0501234567',array['https://test.supabase.co/storage/v1/object/public/listing-images/${owner}/photo.jpg'])`,
  );
  await denied(
    "null description rejected",
    `insert into public.listings(owner_id,category,title,city,price,rental_period,description,contact,images) values('${owner}','property','A valid long title','Bakı',45,'daily',null,'0501234567',array['https://test.supabase.co/storage/v1/object/public/listing-images/${owner}/photo.jpg'])`,
  );
  await as(null);
  assert.equal(
    (await db.query("select * from public.listings")).rows.length,
    0,
  );
  checks++;
  console.log("PASS archived listings hidden publicly");
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub','',false)");
  await db.exec(
    "alter table auth.users add column email_confirmed_at timestamptz",
  );
  const grantSQL = fs.readFileSync("supabase/assign-owner-admin.sql", "utf8");
  await assert.rejects(db.exec(grantSQL), /hesab tapılmadı/);
  await db.exec("rollback");
  checks++;
  console.log("PASS owner admin setup refuses a missing account");
  const actualOwner = "55555555-5555-4555-8555-555555555555";
  await db.exec(
    `insert into auth.users(id,email) values('${actualOwner}','kiraye.azofficial@gmail.com')`,
  );
  await db.exec(grantSQL);
  await db.exec(grantSQL);
  assert.equal(
    (
      await db.query(
        `select role from public.profiles where id='${actualOwner}'`,
      )
    ).rows[0].role,
    "admin",
  );
  assert.equal(
    (await db.query(`select role from public.profiles where id='${other}'`))
      .rows[0].role,
    "user",
  );
  assert.equal(
    (
      await db.query(
        `select email_confirmed_at from auth.users where id='${actualOwner}'`,
      )
    ).rows[0].email_confirmed_at,
    null,
  );
  checks++;
  console.log(
    "PASS owner admin assignment is repeatable, targeted, and preserves email verification",
  );
  await db.close();
  console.log(`${checks} database checks passed`);
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
