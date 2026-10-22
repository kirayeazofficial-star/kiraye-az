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
  async function check(name, work) {
    await work();
    console.log("PASS", name);
    checks++;
  }
  await as(owner);
  let id;
  await check(
    "first authenticated submission succeeds and ignores forged timestamps",
    async () => {
      const row = (
        await insert(owner, undefined, undefined, "2000-01-01T00:00:00Z")
      ).rows[0];
      id = row.id;
      assert(new Date(row.created_at).getUTCFullYear() >= 2026);
    },
  );
  await check(
    "second new listing this month is rejected by the database",
    async () => {
      await assert.rejects(
        insert(
          owner,
          "Sumqayıtda fərqli yeni mənzil",
          "Bu fərqli mənzilin ətraflı təsviri və fərqli xüsusiyyətləri var.",
          null,
          "second.jpg",
        ),
        (error) => error.code === "PML01",
      );
    },
  );
  await check(
    "an edit preserves the original listing without consuming a second slot",
    async () => {
      await db.query("update public.listings set price=60 where id=$1", [id]);
    },
  );
  await check(
    "duplicates are rejected by normalized content even with new photo URLs",
    async () => {
      await assert.rejects(
        insert(
          owner,
          "  Bakı   şəhərində rahat kirayə mənzil  ",
          undefined,
          null,
          "new.jpg",
        ),
        (error) => error.code === "PDU01",
      );
    },
  );
  await check(
    "reused listing images identify duplicates with changed text",
    async () => {
      await assert.rejects(
        insert(
          owner,
          "Tam fərqli başlıqlı yeni mənzil",
          "Tam fərqli təsvir yazılmışdır, amma eyni şəklin təkrar istifadəsidir.",
        ),
        (error) => error.code === "PDU01",
      );
    },
  );
  await check("archiving does not refund the monthly slot", async () => {
    await db.query("update public.listings set status='archived' where id=$1", [
      id,
    ]);
    await assert.rejects(insert(owner), (error) => error.code === "PML01");
  });
  await check("users cannot tamper with the usage ledger", async () => {
    await assert.rejects(db.exec("delete from public.listing_monthly_usage"));
  });
  await check("another user has an independent allowance", async () => {
    await as(other);
    await insert(other);
  });
  await check(
    "deleting a listing does not erase its consumed allowance",
    async () => {
      await as(null);
      await db.query("delete from public.listings where id=$1", [id]);
      await as(owner);
      await assert.rejects(insert(owner), (error) => error.code === "PML01");
    },
  );
  await check(
    "a prior month's listing does not consume the current month",
    async () => {
      await as(null);
      await db.exec("delete from public.listing_monthly_usage");
      await db.exec("delete from public.listings");
      await insert(owner, undefined, undefined, "2020-02-01T00:00:00Z");
      await db.exec(rules);
      await as(owner);
      await insert(
        owner,
        "Bu ay üçün başqa kirayə mənzil",
        "Başqa mənzilin fərqli və ətraflı təsviri burada yerləşdirilmişdir.",
        null,
        "different.jpg",
      );
    },
  );
  await check("invalid submissions roll back usage reservations", async () => {
    await as(null);
    await db.exec(
      "delete from public.listings; delete from public.listing_monthly_usage;",
    );
    await as(owner);
    await assert.rejects(insert(owner, "Qısa", "Qısa"));
    await insert(owner);
  });
  await db.close();
  console.log(`${checks} submission policy checks passed`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
