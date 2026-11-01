// Installs a prebuilt release (built by GitHub) into the live cPanel app folder.
// The previous build is kept in .kirayeal-backups so it can be restored.
import { access, cp, mkdir, readFile, rename, rm, writeFile, copyFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";

const target = resolve(process.argv[2] || "");
if (!process.argv[2]) throw new Error("Usage: node install-release.mjs <app-folder>");
const source = process.cwd();
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backups = join(dirname(target), ".kirayeal-backups");
const buildId = (await readFile(join(source, ".next/BUILD_ID"), "utf8")).trim();
const meta = JSON.parse(await readFile(join(source, "RELEASE.json"), "utf8"));
const exists = (p) => access(p).then(() => true, () => false);

for (const p of [".next/standalone/server.js", ".next/standalone/.next/static", ".next/standalone/public"])
  await access(join(source, p));
await access(join(target, "app.js"));
await mkdir(backups, { recursive: true, mode: 0o700 });

// Server settings (database, mail) live in .env files of the app folder. Used
// only to prepare the database; values are never printed.
const settings = {};
for (const name of [".env", ".env.production", ".env.local", ".env.production.local"]) {
  const text = await readFile(join(target, name), "utf8").catch(() => "");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || line.trim().startsWith("#")) continue;
    settings[match[1]] = /^(["']).*\1$/.test(match[2]) ? match[2].slice(1, -1) : match[2];
  }
}
if (await exists(join(source, "host/postgres"))) {
  const run = spawnSync(
    process.execPath,
    [join(source, "run-host-migrations.mjs"), source, join(source, ".next/standalone")],
    { env: { ...process.env, ...settings }, encoding: "utf8" },
  );
  console.log((run.stdout || "").trim());
  if (run.status !== 0)
    console.error("DATABASE NOT PREPARED (the site still updates):", (run.stderr || "").split("\n").filter(Boolean).slice(-2).join(" "));
  else if (await exists(join(dirname(target), "kirayeal-import"))) {
    // Old private data (not in git) waiting in ~/kirayeal-import is loaded once.
    const imported = spawnSync(
      process.execPath,
      [join(source, "import-legacy.mjs"), join(dirname(target), "kirayeal-import"), join(source, ".next/standalone")],
      { env: { ...process.env, ...settings }, encoding: "utf8" },
    );
    console.log((imported.stdout || "").trim());
    if (imported.status !== 0)
      console.error("LEGACY IMPORT FAILED (the site still updates):", (imported.stderr || "").replace(/\s+/g, " ").slice(-400));
  }
}

const fresh = join(target, ".next.new");
const previous = join(backups, `${stamp}-previous-build`);
await rm(fresh, { recursive: true, force: true });
let swapped = false;
try {
  await mkdir(fresh, { recursive: true });
  await cp(join(source, ".next/standalone"), join(fresh, "standalone"), { recursive: true });
  await copyFile(join(source, ".next/BUILD_ID"), join(fresh, "BUILD_ID"));
  if (await exists(join(target, ".next"))) await rename(join(target, ".next"), previous);
  swapped = true;
  await rename(fresh, join(target, ".next"));
  await copyFile(join(source, "app.js"), join(target, "app.js"));
  // Backup tools live next to app.js: the 03:00 cron job runs backup-to-drive.mjs from there.
  for (const name of ["backup-to-drive.mjs", "notify-tasks.mjs", "email-frame.mjs", "restore-backup.mjs"])
    if (await exists(join(source, name))) await copyFile(join(source, name), join(target, name));
  // Source code of this version (the nightly backup sends it to Google Drive when it changes).
  if (await exists(join(source, "kirayeal-kod"))) {
    await rm(join(target, "kirayeal-kod"), { recursive: true, force: true });
    await cp(join(source, "kirayeal-kod"), join(target, "kirayeal-kod"), { recursive: true });
  }
  await writeFile(join(target, "DEPLOYED-RELEASE.json"), JSON.stringify({ ...meta, buildId, created_at: stamp }, null, 2));
  await mkdir(join(target, "tmp"), { recursive: true });
  await writeFile(join(target, "tmp/restart.txt"), stamp);
  console.log("Release installed. Restart requested. Expected build:", buildId);
} catch (error) {
  console.error("Install failed:", error.message);
  await rm(fresh, { recursive: true, force: true });
  if (swapped && (await exists(previous))) {
    await rm(join(target, ".next"), { recursive: true, force: true });
    await rename(previous, join(target, ".next"));
    console.error("Previous build restored.");
  }
  process.exit(1);
}

let verified = false;
for (let attempt = 0; attempt < 6 && !verified; attempt++) {
  await new Promise((done) => setTimeout(done, 3000));
  try {
    const response = await fetch(`https://kirayeal.az/api/health?release=${encodeURIComponent(buildId)}`, { signal: AbortSignal.timeout(5000), cache: "no-store" });
    const data = await response.json();
    verified = response.ok && data.status === "ok" && data.buildId === buildId;
  } catch {}
}
console.log(verified ? "HTTP verified: the new build is responding." : "HTTP release NOT verified yet. Restart the app in cPanel Node.js and check kirayeal.az/api/health.");
