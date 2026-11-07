// Leftover photos: pictures uploaded for a listing that was never sent (the form was closed or failed).
// Once a day (after 03:00 Baku time) every user photo older than 24 hours that no listing, store, profile
// or banner uses (the banner folder itself is never touched) is moved, with its small copies, to <storage>/.trash/<date>/. Nothing is deleted at once:
// trash folders older than 14 days are removed on a later run, so a mistake can still be undone by hand.
import { mkdir, readdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const photo = /^[0-9a-f-]{36}\.(jpg|mp4|webm)$/i;
const DAY = 86400000;
const bannerFolder = "00000000-0000-4000-8000-0000000000b1"; // leader's banner media: never touched

export async function runCleanup(db) {
  const root = process.env.KIRAYE_STORAGE_ROOT || "";
  if (!root) return;
  const now = (await db.query(`select extract(hour from now() at time zone 'Asia/Baku')::int as h, to_char(now() at time zone 'Asia/Baku','YYYY-MM-DD') as day`)).rows[0];
  if (Number(now.h) < 3) return;
  const claimed = await db.query(`insert into public.notification_log(user_id,kind,ref) values(null,'upload_cleanup',$1) on conflict(kind,ref) do nothing returning id`, [now.day]);
  if (!claimed.rowCount) return;

  // Every file name the site still points to.
  const used = new Set();
  const add = (value) => { const name = String(value || "").split(/[?#]/)[0].split("/").pop(); if (name) used.add(name.toLowerCase().replace(/^(thumb|share)-/, "")); };
  for (const sql of [
    `select unnest(images) as v from public.listings`,
    `select public_path as v from public.listing_images`,
    `select logo_url as v from public.stores union all select cover_url from public.stores`,
    `select avatar_url as v from public.profiles where avatar_url is not null`,
    `select image_url as v from public.banners union all select mobile_url from public.banners`,
    `select listing_image as v from public.chat_threads where listing_image is not null`,
  ]) {
    const rows = (await db.query(sql).catch((error) => { throw new Error(`reference query failed: ${String(error?.message || error).slice(0, 120)}`); })).rows;
    for (const row of rows) add(row.v);
  }
  if (!used.size) return; // never clean against an empty list

  const trash = path.join(root, ".trash", now.day);
  let moved = 0;
  for (const owner of await readdir(root)) {
    if (!uuid.test(owner) || owner === bannerFolder) continue;
    const folder = path.join(root, owner);
    const files = await readdir(folder).catch(() => []);
    for (const name of files) {
      if (!photo.test(name) || used.has(name.toLowerCase())) continue;
      const info = await stat(path.join(folder, name)).catch(() => null);
      if (!info?.isFile() || Date.now() - info.mtimeMs < DAY) continue;
      await mkdir(path.join(trash, owner), { recursive: true, mode: 0o700 });
      for (const file of [name, `share-${name}`, `thumb-${name}`])
        await rename(path.join(folder, file), path.join(trash, owner, file)).catch(() => {});
      moved++;
    }
  }
  if (moved) console.log(`upload cleanup: ${moved} unused photo(s) moved to ${path.relative(root, trash)}`);

  // Trash older than 14 days goes for good.
  const trashRoot = path.join(root, ".trash");
  for (const day of await readdir(trashRoot).catch(() => [])) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(day) && Date.now() - Date.parse(`${day}T00:00:00Z`) > 14 * DAY)
      await rm(path.join(trashRoot, day), { recursive: true, force: true });
  }
}
