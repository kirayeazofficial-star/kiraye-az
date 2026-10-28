// One-time import of an old private backup (accounts, listings, photos).
// The data never goes through git: put a folder with legacy-import.sql and
// images/<owner>/<file>.jpg next to the app (default ~/kirayeal-import).
// usage: node import-legacy.mjs <import-folder> <folder-with-node_modules/pg>
// Reads database/storage settings from the environment. Safe to run twice.
import { access, copyFile, mkdir, readFile, readdir, rename } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";

const folder = resolve(process.argv[2] || "");
const modules = resolve(process.argv[3] || ".");
const sqlFile = join(folder, "legacy-import.sql");
if (!(await access(sqlFile).then(() => true, () => false))) {
  console.log("No legacy import pending.");
  process.exit(0);
}
const storage = process.env.KIRAYE_STORAGE_ROOT?.trim();
if (!storage) throw new Error("KIRAYE_STORAGE_ROOT is not set.");
const { Client } = createRequire(join(modules, "package.json"))("pg");
const client = new Client({
  host: process.env.KIRAYE_DB_HOST, port: Number(process.env.KIRAYE_DB_PORT || 5432),
  database: process.env.KIRAYE_DB_NAME, user: process.env.KIRAYE_DB_USER, password: process.env.KIRAYE_DB_PASSWORD,
  connectionTimeoutMillis: 10000,
});
let copied = 0;
const images = join(folder, "images");
for (const owner of await readdir(images).catch(() => [])) {
  await mkdir(join(storage, owner), { recursive: true, mode: 0o750 });
  for (const file of await readdir(join(images, owner))) {
    await copyFile(join(images, owner, file), join(storage, owner, file));
    copied++;
  }
}
await client.connect();
try {
  await client.query(await readFile(sqlFile, "utf8"));
} finally {
  await client.end();
}
await rename(folder, `${folder}-done-${new Date().toISOString().replace(/[:.]/g, "-")}`);
console.log(`Legacy import finished (${copied} photos).`);
