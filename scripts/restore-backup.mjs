// Puts a backup from Google Drive back into the site (e.g. after moving to a new hosting).
//   node restore-backup.mjs <kirayeal-baza.json.gz> [folder with the downloaded "Şəkillər və videolar"]
// Run it in the app folder (next to app.js) after the site has been deployed once, so the empty
// tables already exist. Rows that are already there are skipped, so running it twice is safe.
import { copyFile, mkdir, readdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const appDir = dirname(fileURLToPath(import.meta.url));
const [dumpFile, photosDir] = process.argv.slice(2);
if (!dumpFile) { console.error("Usage: node restore-backup.mjs <kirayeal-baza.json.gz> [photos folder]"); process.exit(1); }

for (const name of [".env.production.local", ".env.local", ".env.production", ".env"]) {
  const text = await readFile(join(appDir, name), "utf8").catch(() => "");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || line.trim().startsWith("#")) continue;
    let value = match[2];
    if (/^(["']).*\1$/.test(value)) value = value.slice(1, -1);
    if (process.env[match[1]] === undefined) process.env[match[1]] = value;
  }
}

const { Client } = createRequire(join(appDir, ".next", "standalone", "package.json"))("pg");
const db = new Client({
  host: process.env.KIRAYE_DB_HOST, port: Number(process.env.KIRAYE_DB_PORT || 5432), database: process.env.KIRAYE_DB_NAME,
  user: process.env.KIRAYE_DB_USER, password: process.env.KIRAYE_DB_PASSWORD, connectionTimeoutMillis: 15000,
});
await db.connect();
const quote = (name) => name.split(".").map((part) => `"${part.replace(/"/g, '""')}"`).join(".");

const lines = gunzipSync(await readFile(resolve(dumpFile))).toString("utf8").split("\n").filter(Boolean);
const header = JSON.parse(lines[0]);
if (header.format !== "kirayeal-backup") throw new Error("This is not a kirayeal.az backup file.");
console.log(`Backup from ${header.created_at}, ${header.tables.length} tables.`);

let table = "", columns = "", added = 0, skipped = 0;
const totals = {};
// Columns that can be written (computed columns are left out; identity values are kept as they were).
async function writable(name) {
  const [schema, relation] = name.split(".");
  const rows = (await db.query(`select column_name from information_schema.columns where table_schema=$1 and table_name=$2 and is_generated='NEVER' order by ordinal_position`, [schema, relation])).rows;
  return rows.map((row) => `"${row.column_name.replace(/"/g, '""')}"`).join(",");
}
await db.query("begin");
try {
  for (const line of lines.slice(1)) {
    const item = JSON.parse(line);
    if (item.table && Object.keys(item).length === 1) {
      table = item.table; totals[table] = 0;
      columns = (await db.query(`select to_regclass($1) as id`, [table])).rows[0].id ? await writable(table) : "";
      continue;
    }
    if (!columns) { skipped++; continue; }
    const done = await db.query(`insert into ${quote(table)} (${columns}) overriding system value select ${columns} from json_populate_record(null::${quote(table)}, $1::json) on conflict do nothing`, [line]);
    added += done.rowCount; totals[table] += done.rowCount;
  }
  // Counters of serial columns continue after the restored rows.
  const serials = (await db.query(`select table_schema||'.'||table_name as t,column_name as c,pg_get_serial_sequence(quote_ident(table_schema)||'.'||quote_ident(table_name),column_name) as s
    from information_schema.columns where table_schema in ('public','auth') and (column_default like 'nextval%' or is_identity='YES')`)).rows;
  for (const { t, c, s } of serials) if (s) await db.query(`select setval($1, greatest(coalesce((select max(${quote(c)}) from ${quote(t)}),0),1))`, [s]);
  await db.query("commit");
} catch (error) { await db.query("rollback"); throw error; }
finally { await db.end(); }
for (const [name, count] of Object.entries(totals)) if (count) console.log(`  ${name}: ${count}`);
console.log(`Database restored: ${added} rows added${skipped ? `, ${skipped} rows of unknown tables skipped` : ""}.`);

// Pictures: Drive names are paths with "/" written as "__".
if (photosDir) {
  const storage = process.env.KIRAYE_STORAGE_ROOT;
  if (!storage) throw new Error("KIRAYE_STORAGE_ROOT is not set.");
  let copied = 0;
  for (const name of await readdir(resolve(photosDir))) {
    const target = join(storage, ...name.split("__"));
    await mkdir(dirname(target), { recursive: true });
    await copyFile(join(resolve(photosDir), name), target);
    copied++;
  }
  console.log(`Files restored: ${copied}.`);
}
