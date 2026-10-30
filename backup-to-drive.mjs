// Nightly backup to the leader's Google Drive, run at 03:00 by a cPanel cron job:
//   node backup-to-drive.mjs
// 1. The whole database (public + auth schemas) is one file, kirayeal-baza.json.gz, replaced every
//    night (Drive itself keeps the earlier versions for 30 days under "Manage versions").
// 2. Uploaded pictures and videos (KIRAYE_STORAGE_ROOT) are sent once each; later runs send only new files.
// Restore with restore-backup.mjs. Secrets are never printed.
import { createDecipheriv, createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, readdir, readFile, rm, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createGzip } from "node:zlib";

const appDir = dirname(fileURLToPath(import.meta.url));
const DB_FILE = "kirayeal-baza.json.gz", MAX_FILE_BYTES_PER_RUN = 2 * 1024 ** 3, TIME_LIMIT_MS = 50 * 60 * 1000;
const started = Date.now();

// Server settings from the .env files next to app.js (same as app.js does).
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

// Same key scheme as lib/host/backup-secret.ts.
function openSecret(sealed) {
  const key = createHash("sha256").update(`${process.env.KIRAYE_SESSION_SECRET || ""}:kirayeal-backup`).digest();
  const [iv, tag, body] = sealed.split(".").map((part) => Buffer.from(part, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
}

class Drive {
  constructor(refreshToken) { this.refreshToken = refreshToken; this.token = ""; }
  async refresh() {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID || "", client_secret: process.env.GOOGLE_CLIENT_SECRET || "", refresh_token: this.refreshToken, grant_type: "refresh_token" }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error === "invalid_grant" ? "Google Drive icazəsi ləğv olunub. Paneldə Drive-ı yenidən qoşun." : `Google token xətası (${response.status})`);
    this.token = data.access_token;
  }
  async call(url, init = {}, retry = true) {
    if (!this.token) await this.refresh();
    const response = await fetch(url, { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${this.token}` } });
    if (response.status === 401 && retry) { await this.refresh(); return this.call(url, init, false); }
    return response;
  }
  async json(url, init) {
    const response = await this.call(url, init);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`Google Drive xətası (${response.status}): ${data.error?.message || ""}`.slice(0, 200));
    return data;
  }
  async folder(name, parent) {
    const data = await this.json("https://www.googleapis.com/drive/v3/files?fields=id", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder", ...(parent ? { parents: [parent] } : {}) }),
    });
    return data.id;
  }
  async alive(id) {
    if (!id) return false;
    const response = await this.call(`https://www.googleapis.com/drive/v3/files/${id}?fields=id,trashed`);
    if (!response.ok) return false;
    return !(await response.json()).trashed;
  }
  // New file in a folder, or (with replace) new content for an existing file, keeping its id.
  async upload(name, parent, body, type = "application/octet-stream", replace = "") {
    const start = await this.call(`https://www.googleapis.com/upload/drive/v3/files${replace ? `/${replace}` : ""}?uploadType=resumable&fields=id`, {
      method: replace ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Type": type, "X-Upload-Content-Length": String(body.length) },
      body: JSON.stringify(replace ? { name } : { name, parents: [parent] }),
    });
    if (!start.ok) throw new Error(`Drive-a yükləmə başlamadı (${start.status})`);
    const location = start.headers.get("location");
    const done = await this.call(location, { method: "PUT", headers: { "Content-Type": type }, body });
    const data = await done.json().catch(() => ({}));
    if (!done.ok || !data.id) throw new Error(`Drive-a yükləmə alınmadı (${done.status})`);
    return data.id;
  }
  async find(name, parent) {
    const q = encodeURIComponent(`'${parent}' in parents and name='${name}' and trashed=false`);
    return (await this.json(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`)).files?.[0]?.id || "";
  }
}

// Tables in an order that respects foreign keys, so a restore can insert them one after another.
async function tablesInOrder() {
  const tables = (await db.query(`select table_schema||'.'||table_name as tbl from information_schema.tables
    where table_schema in ('public','auth') and table_type='BASE TABLE' and table_name not like 'backup\\_%' order by 1`)).rows.map((row) => row.tbl);
  const links = (await db.query(`select cn.nspname||'.'||c.relname as child, pn.nspname||'.'||p.relname as parent from pg_constraint k
    join pg_class c on c.oid=k.conrelid join pg_namespace cn on cn.oid=c.relnamespace
    join pg_class p on p.oid=k.confrelid join pg_namespace pn on pn.oid=p.relnamespace where k.contype='f'`)).rows;
  const ordered = [], seen = new Set(), visiting = new Set();
  const visit = (name) => {
    if (seen.has(name) || visiting.has(name) || !tables.includes(name)) return;
    visiting.add(name);
    for (const link of links) if (link.child === name && link.parent !== name) visit(link.parent);
    visiting.delete(name); seen.add(name); ordered.push(name);
  };
  tables.forEach(visit);
  return ordered;
}

const quote = (name) => name.split(".").map((part) => `"${part.replace(/"/g, '""')}"`).join(".");

// One JSON document per line: a header, then for every table a {"table"} line followed by its rows.
async function dumpDatabase(file) {
  const tables = await tablesInOrder();
  const gzip = createGzip({ level: 9 }), out = createWriteStream(file);
  gzip.pipe(out);
  const write = (line) => new Promise((resolve) => (gzip.write(line + "\n") ? resolve() : gzip.once("drain", resolve)));
  await write(JSON.stringify({ format: "kirayeal-backup", version: 1, created_at: new Date().toISOString(), tables }));
  let rows = 0;
  for (const table of tables) {
    await write(JSON.stringify({ table }));
    for (let offset = 0; ; offset += 2000) {
      const chunk = (await db.query(`select row_to_json(t)::text as doc from ${quote(table)} as t order by ctid limit 2000 offset ${offset}`)).rows;
      for (const { doc } of chunk) await write(doc);
      rows += chunk.length;
      if (chunk.length < 2000) break;
    }
  }
  await new Promise((resolve, reject) => { out.on("finish", resolve); out.on("error", reject); gzip.end(); });
  return rows;
}

async function walk(root, folder = root, found = []) {
  for (const entry of await readdir(folder, { withFileTypes: true }).catch(() => [])) {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) await walk(root, path, found);
    else if (entry.isFile()) found.push(relative(root, path).split(sep).join("/"));
  }
  return found;
}

await db.query(`update public.backup_runs set finished_at=now(),ok=false,error='Yarımçıq qaldı' where finished_at is null and started_at<now()-interval '3 hours'`);
if ((await db.query(`select 1 from public.backup_runs where finished_at is null`)).rowCount) { console.log("A backup is already running."); await db.end(); process.exit(0); }
const run = (await db.query(`insert into public.backup_runs(trigger) values('cron') returning id`)).rows[0].id;
const finish = (fields) => db.query(`update public.backup_runs set finished_at=now(),ok=$2,db_file=$3,db_bytes=$4,db_rows=$5,files_new=$6,files_bytes=$7,error=$8 where id=$1`,
  [run, fields.ok, fields.dbFile || null, fields.dbBytes || null, fields.dbRows || null, fields.filesNew || 0, fields.filesBytes || 0, fields.error || null]);

const result = { ok: false };
const tmp = join(appDir, "tmp", "backup");
try {
  const settings = (await db.query(`select * from public.backup_settings where id=1`)).rows[0];
  if (!settings?.drive_token) throw new Error("Google Drive qoşulmayıb. Rəhbər panelində «Google Drive-a qoş» düyməsini basın.");
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) throw new Error("Serverdə GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET yoxdur.");
  const drive = new Drive(openSecret(settings.drive_token));

  // On Drive: folder "kirayeal.az ehtiyat nüsxə" with kirayeal-baza.json.gz and "Şəkillər və videolar".
  let { root_folder: root, files_folder: filesFolder } = settings;
  if (!(await drive.alive(root))) { root = await drive.folder("kirayeal.az ehtiyat nüsxə"); filesFolder = null; }
  if (!(await drive.alive(filesFolder))) { filesFolder = await drive.folder("Şəkillər və videolar", root); await db.query(`delete from public.backup_files`); }
  await db.query(`update public.backup_settings set root_folder=$1,files_folder=$2,updated_at=now() where id=1`, [root, filesFolder]);

  // 1. Database: one file, replaced every night.
  await mkdir(tmp, { recursive: true, mode: 0o700 });
  const file = join(tmp, DB_FILE);
  result.dbRows = await dumpDatabase(file);
  const body = await readFile(file);
  await drive.upload(DB_FILE, root, body, "application/gzip", await drive.find(DB_FILE, root));
  result.dbFile = DB_FILE; result.dbBytes = body.length;
  await rm(file, { force: true });

  // 2. Pictures and videos: only files that are not on Drive yet.
  const storage = process.env.KIRAYE_STORAGE_ROOT || "";
  result.filesNew = 0; result.filesBytes = 0;
  if (storage) {
    const sent = new Map((await db.query(`select path,size from public.backup_files`)).rows.map((row) => [row.path, Number(row.size)]));
    for (const path of await walk(storage)) {
      if (Date.now() - started > TIME_LIMIT_MS || result.filesBytes > MAX_FILE_BYTES_PER_RUN) break; // the rest goes tomorrow
      const info = await stat(join(storage, path)).catch(() => null);
      if (!info || sent.get(path) === info.size) continue;
      const content = await readFile(join(storage, path));
      const id = await drive.upload(path.replaceAll("/", "__"), filesFolder, content, /\.mp4$/i.test(path) ? "video/mp4" : /\.webm$/i.test(path) ? "video/webm" : /\.jpe?g$/i.test(path) ? "image/jpeg" : "application/octet-stream");
      await db.query(`insert into public.backup_files(path,drive_id,size) values($1,$2,$3) on conflict(path) do update set drive_id=excluded.drive_id,size=excluded.size,uploaded_at=now()`, [path, id, info.size]);
      result.filesNew++; result.filesBytes += info.size;
    }
  }
  result.ok = true;
  console.log(`Backup done: ${result.dbRows} rows, ${result.filesNew} new files.`);
} catch (error) {
  result.error = String(error?.message || error).slice(0, 300);
  console.error("Backup failed:", result.error);
} finally {
  await rm(tmp, { recursive: true, force: true }).catch(() => {});
  await finish(result).catch(() => {});
  await db.end();
}
process.exit(result.ok ? 0 : 1);
