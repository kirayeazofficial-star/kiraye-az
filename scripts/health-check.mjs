// Site health, checked by the 5-minute cron job (backup-to-drive.mjs calls runHealth first).
// Each check is ok / warn (problem coming: under 3 GB free disk, certificate ends in 14 days) / bad (problem now).
// A warn or bad result is e-mailed to the leader at most once a day per check, and once more when it is fixed;
// the latest results are shown in Rəhbər paneli → «Ümumi baxış». State is also kept in a small file next to
// app.js, so an alert still goes out when the database itself is down.
import { readFile, writeFile, statfs } from "node:fs/promises";
import { join } from "node:path";
import tls from "node:tls";
import { noticeLetter } from "./email-frame.mjs";

const OWNER = "kirayeal.az@gmail.com";
const DAY = 86400000;
const names = { site: "Sayt", database: "Baza", disk: "Disk sahəsi", backup: "Gecəki ehtiyat nüsxə", mail: "E-poçt göndərmə", ssl: "SSL sertifikatı (https)" };

async function check(appDir, db, requireFromApp, previous) {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://kirayeal.az").replace(/\/$/, "");
  const results = {};
  // 1. The site answers.
  try {
    const started = Date.now();
    const response = await fetch(`${site}/api/health`, { signal: AbortSignal.timeout(20000), headers: { "user-agent": "kirayeal-health" } });
    const ms = Date.now() - started;
    results.site = response.ok ? (ms > 8000 ? { level: "warn", detail: `Sayt çox gec cavab verir (${Math.round(ms / 1000)} san).` } : { level: "ok", detail: `İşləyir · ${ms} ms` }) : { level: "bad", detail: `Sayt açılmır (HTTP ${response.status}).` };
  } catch (error) { results.site = { level: "bad", detail: `Sayt açılmır: ${String(error?.message || error).slice(0, 80)}` }; }
  // 2. Database.
  if (!db) results.database = { level: "bad", detail: "Bazaya qoşulmaq mümkün olmadı." };
  else {
    try { const started = Date.now(); await db.query("select 1"); const ms = Date.now() - started; results.database = ms > 3000 ? { level: "warn", detail: `Baza gec cavab verir (${ms} ms).` } : { level: "ok", detail: `İşləyir · ${ms} ms` }; }
    catch (error) { results.database = { level: "bad", detail: `Baza xətası: ${String(error?.message || error).slice(0, 80)}` }; }
  }
  // 3. Disk space of the hosting account.
  try {
    // Free space left (an absolute amount: on shared hosting the percentage is the whole server's disk).
    const s = await statfs(appDir), free = s.bavail * s.bsize / 1e9, freeGb = free.toFixed(1);
    results.disk = free < 1 ? { level: "bad", detail: `Diskdə cəmi ${freeGb} GB boş yer qalıb.` } : free < 3 ? { level: "warn", detail: `Diskdə boş yer azalır: ${freeGb} GB qalıb.` } : { level: "ok", detail: `${freeGb} GB boş` };
  } catch { results.disk = { level: "ok", detail: "Yoxlanmadı" }; }
  // 4. Last night's backup (only once Google Drive is connected and a backup has ever run).
  if (db) {
    try {
      const rows = (await db.query(`select (select max(started_at) from public.backup_runs where ok) last_ok, (select count(*) from public.backup_runs where ok) total, (select error from public.backup_runs order by started_at desc limit 1) last_error`)).rows[0];
      if (!Number(rows.total)) results.backup = { level: "ok", detail: "Drive hələ qoşulmayıb" };
      else { const age = Date.now() - Date.parse(rows.last_ok); results.backup = age > 30 * 3600000 ? { level: "bad", detail: `Son uğurlu ehtiyat nüsxə ${Math.round(age / 3600000)} saat əvvəl alınıb.${rows.last_error ? ` Xəta: ${String(rows.last_error).slice(0, 80)}` : ""}` } : { level: "ok", detail: `${Math.round(age / 3600000)} saat əvvəl alınıb` }; }
    } catch { /* table missing: no backups yet */ }
  }
  // 5. Mail server login (at most hourly, see run()).
  if (previous.mail && Date.now() - (previous.mail.checkedAt || 0) < 3600000) results.mail = { level: previous.mail.level, detail: previous.mail.detail };
  else if (process.env.KIRAYE_SMTP_HOST) {
    try {
      const nodemailer = requireFromApp("nodemailer"), port = Number(process.env.KIRAYE_SMTP_PORT || 465);
      await nodemailer.createTransport({ host: process.env.KIRAYE_SMTP_HOST, port, secure: port === 465, auth: { user: process.env.KIRAYE_SMTP_USER, pass: process.env.KIRAYE_SMTP_PASSWORD }, connectionTimeout: 15000 }).verify();
      results.mail = { level: "ok", detail: "Göndərmə işləyir" };
    } catch (error) { results.mail = { level: "bad", detail: `E-poçt göndərilə bilmir: ${String(error?.message || error).slice(0, 80)}` }; }
  }
  // 6. HTTPS certificate.
  try {
    const host = new URL(site).hostname;
    const until = await new Promise((resolve, reject) => { const socket = tls.connect({ host, port: 443, servername: host, timeout: 15000 }, () => { const cert = socket.getPeerCertificate(); socket.end(); resolve(cert?.valid_to ? Date.parse(cert.valid_to) : NaN); }); socket.on("error", reject); socket.on("timeout", () => { socket.destroy(); reject(new Error("timeout")); }); });
    const days = Math.floor((until - Date.now()) / DAY);
    results.ssl = !Number.isFinite(days) ? { level: "ok", detail: "Yoxlanmadı" } : days < 3 ? { level: "bad", detail: `SSL sertifikatının vaxtı ${days < 0 ? "bitib" : `${days} gündən sonra bitir`}.` } : days < 14 ? { level: "warn", detail: `SSL sertifikatı ${days} gündən sonra bitir. cPanel → SSL/TLS bölməsində yeniləyin.` } : { level: "ok", detail: `${days} gün qalıb` };
  } catch { results.ssl = { level: "ok", detail: "Yoxlanmadı" }; }
  return results;
}

export async function runHealth(appDir, db, requireFromApp) {
  const file = join(appDir, ".site-health.json");
  const state = JSON.parse(await readFile(file, "utf8").catch(() => "{}"));
  // The mail check logs in to the mail server: once an hour is enough.
  const results = await check(appDir, db, requireFromApp, state);
  const now = Date.now(), problems = [], fixed = [];
  for (const [key, result] of Object.entries(results)) {
    const old = state[key] || {};
    if (result.level !== "ok") { if (!old.alertedAt || now - old.alertedAt > DAY || old.level !== result.level) { problems.push([key, result]); result.alertedAt = now; } else result.alertedAt = old.alertedAt; }
    else if (old.level && old.level !== "ok" && old.alertedAt) fixed.push([key, result]);
    result.checkedAt = now; state[key] = result;
  }
  await writeFile(file, JSON.stringify(state)).catch(() => {});
  if (db) {
    for (const [key, result] of Object.entries(results)) await db.query(`insert into public.site_health(key,ok,level,detail,checked_at,alerted_at) values($1,$2,$3,$4,now(),$5) on conflict(key) do update set ok=excluded.ok,level=excluded.level,detail=excluded.detail,checked_at=now(),alerted_at=excluded.alerted_at`, [key, result.level === "ok", result.level, result.detail, result.alertedAt ? new Date(result.alertedAt) : null]).catch(() => {});
  }
  if ((!problems.length && !fixed.length) || !process.env.KIRAYE_SMTP_HOST) return;
  const to = new Set([OWNER]);
  if (db) for (const row of (await db.query(`select u.email from public.staff_members s join auth.users u on u.id=s.user_id where s.staff_role='leader' and u.disabled_at is null`).catch(() => ({ rows: [] }))).rows) to.add(row.email);
  const nodemailer = requireFromApp("nodemailer"), port = Number(process.env.KIRAYE_SMTP_PORT || 465);
  const transport = nodemailer.createTransport({ host: process.env.KIRAYE_SMTP_HOST, port, secure: port === 465, auth: { user: process.env.KIRAYE_SMTP_USER, pass: process.env.KIRAYE_SMTP_PASSWORD } });
  const bad = problems.some(([, r]) => r.level === "bad");
  const letter = problems.length
    ? noticeLetter({ heading: bad ? "Saytda problem var" : "Saytda problem yaranır", name: "Rəhbər", intro: bad ? "Avtomatik yoxlama saytda problem tapdı. Təcili baxmaq lazımdır:" : "Avtomatik yoxlama tezliklə problem yarada biləcək bir vəziyyət tapdı:", rows: problems.map(([key, r]) => ({ label: names[key] || key, value: r.detail })), button: { text: "Rəhbər panelinə keç", href: "/admin" }, note: "Bu məktub hər 5 dəqiqədən bir işləyən yoxlamadan gəlir. Eyni problem üçün gündə ən çox bir dəfə yazılır; düzələndə ayrıca xəbər gələcək." })
    : noticeLetter({ heading: "Problem aradan qalxdı", name: "Rəhbər", intro: "Əvvəl bildirilən problem artıq yoxdur:", rows: fixed.map(([key, r]) => ({ label: names[key] || key, value: r.detail })), button: { text: "Rəhbər panelinə keç", href: "/admin" } });
  const subject = problems.length ? `${bad ? "Diqqət" : "Xəbərdarlıq"}: ${problems.map(([key]) => names[key] || key).join(", ")} — kirayeal.az` : "Problem aradan qalxdı — kirayeal.az";
  for (const address of to) await transport.sendMail({ from: `kirayeal.az <${process.env.KIRAYE_SMTP_USER}>`, to: address, subject, text: letter.text, html: letter.html }).catch((error) => console.error("health mail failed:", String(error?.message || error).slice(0, 120)));
}
