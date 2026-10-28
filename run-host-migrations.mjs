// Applies host/postgres/*.sql once each (tracked in public.kiraye_schema_migrations).
// usage: node run-host-migrations.mjs <folder-with-host/postgres> <folder-with-node_modules/pg>
import { readFile, readdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createRequire } from "node:module";

const root = resolve(process.argv[2] || ".");
const modules = resolve(process.argv[3] || root);
const required = ["KIRAYE_DB_HOST", "KIRAYE_DB_NAME", "KIRAYE_DB_USER", "KIRAYE_DB_PASSWORD"];
if (required.some((name) => !process.env[name]?.trim()))
  throw new Error("Database settings are missing (KIRAYE_DB_HOST/NAME/USER/PASSWORD).");
const { Client } = createRequire(join(modules, "package.json"))("pg");
const client = new Client({
  host: process.env.KIRAYE_DB_HOST,
  port: Number(process.env.KIRAYE_DB_PORT || 5432),
  database: process.env.KIRAYE_DB_NAME,
  user: process.env.KIRAYE_DB_USER,
  password: process.env.KIRAYE_DB_PASSWORD,
  connectionTimeoutMillis: 10000,
});
await client.connect();
try {
  await client.query(
    "create table if not exists public.kiraye_schema_migrations(name text primary key, applied_at timestamptz not null default now())",
  );
  const directory = join(root, "host", "postgres");
  const files = (await readdir(directory)).filter((name) => /^\d+.*\.sql$/.test(name)).sort();
  for (const name of files) {
    if ((await client.query("select 1 from public.kiraye_schema_migrations where name=$1", [name])).rowCount) continue;
    // A database that already has the core tables keeps its data: mark 001 as done.
    const existing = name.startsWith("001") && (await client.query("select to_regclass('auth.users') as t")).rows[0].t;
    if (!existing) await client.query(await readFile(join(directory, name), "utf8"));
    await client.query("insert into public.kiraye_schema_migrations(name) values($1)", [name]);
    console.log(existing ? `Already present, recorded: ${name}` : `Applied host migration: ${name}`);
  }
  console.log("Database is up to date.");
} finally {
  await client.end();
}
