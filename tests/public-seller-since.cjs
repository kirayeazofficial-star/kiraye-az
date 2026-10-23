const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require(process.env.PGLITE_MODULE_PATH || '@electric-sql/pglite');
(async () => {
  const db = new PGlite();
  const seller = '11111111-1111-4111-8111-111111111111';
  const listing = '22222222-2222-4222-8222-222222222222';
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid, email text, created_at timestamptz);
    create table public.listings(id uuid, owner_id uuid, status text);
    insert into auth.users values('${seller}','private@example.invalid','2024-02-16T10:00:00Z');
    insert into public.listings values('${listing}','${seller}','published');`);
  const sql = fs.readFileSync('supabase/public-seller-since.sql', 'utf8');
  await db.exec(sql); await db.exec(sql);
  for (const role of ['anon', 'authenticated']) {
    await db.exec('set role ' + role);
    const result = await db.query('select public.public_seller_since($1) as since', [listing]);
    assert.equal(new Date(result.rows[0].since).toISOString(), '2024-01-31T20:00:00.000Z');
    await assert.rejects(db.exec('select email from auth.users'));
    await assert.rejects(db.exec('select * from public.listings'));
    assert.equal((await db.query('select public.public_seller_since($1) as since', [seller])).rows[0].since, null);
    await db.exec('reset role');
  }
  for (const status of ['pending','rejected','archived','draft']) {
    await db.query('update public.listings set status=$1', [status]);
    await db.exec('set role anon');
    assert.equal((await db.query('select public.public_seller_since($1) as since', [listing])).rows[0].since, null);
    await db.exec('reset role');
  }
  await db.close();
  console.log('PASS public account age exposes only the signup month for published listings and keeps private tables inaccessible');
})().catch(error => { console.error(error); process.exit(1); });
