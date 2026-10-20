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
    `insert into public.profiles(id,role) values('${owner}','user'),('${other}','user'),('${admin}','admin')`,
  );
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
  await db.close();
  console.log(`${checks} database checks passed`);
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
