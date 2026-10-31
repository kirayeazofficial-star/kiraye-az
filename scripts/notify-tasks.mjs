// E-mail notices sent by the 5-minute cron job (backup-to-drive.mjs calls runNotices first):
// 1. "Elanınızın müddəti bitir" — 3 days before a listing expires (once per listing and expiry date).
// 2. Saved search alerts — new listings matching a saved search, checked at most once an hour.
// 3. Weekly report for the site owner — Monday after 09:00 (Baku time), once a week.
// Letters go out only between 09:00 and 21:00 Baku time. Every notice is recorded in notification_log.
const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://kirayeal.az").replace(/\/$/, "");
const ownerEmail = "kirayeal.az@gmail.com";
const font = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const esc = (value) => String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
const money = (value) => Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 }).replace(/,/g, " ");
const period = (id) => (id === "monthly" ? "ay" : id === "weekly" ? "həftə" : "gün");

// Same look as noticeLetter in lib/host/email-template.ts.
function letter({ heading, name, intro, rows = [], button, note }) {
  const link = (href) => (href.startsWith("http") ? href : `${site}${href}`);
  const list = rows.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:1px solid #eef0f2;border-radius:12px;">${rows.map((row, i) => `<tr><td style="padding:12px 14px;${i ? "border-top:1px solid #f0f1f3;" : ""}font-family:${font};font-size:14px;line-height:1.45;color:#111827;">${row.href ? `<a href="${esc(link(row.href))}" style="color:#111827;text-decoration:none;font-weight:600;">${esc(row.label)}</a>` : esc(row.label)}</td>${row.value !== undefined ? `<td align="right" style="padding:12px 14px;${i ? "border-top:1px solid #f0f1f3;" : ""}font-family:${font};font-size:14px;font-weight:700;color:#e8490f;white-space:nowrap;">${esc(row.value)}</td>` : ""}</tr>`).join("")}</table>` : "";
  const cta = button ? `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#ff5a1f;border-radius:10px;"><a href="${esc(link(button.href))}" style="display:inline-block;padding:13px 22px;font-family:${font};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${esc(button.text)}</a></td></tr></table>` : "";
  const html = `<!doctype html><html lang="az"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(heading)}</title></head><body style="margin:0;padding:0;background:#f3f4f6;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;"><tr><td align="center" style="padding:32px 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;"><tr><td style="padding:0 4px 18px;font-family:${font};font-size:26px;font-weight:800;color:#123f39;">kirayeal<span style="color:#ff5a1f;">.az</span></td></tr><tr><td style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:30px 26px;font-family:${font};color:#1f2937;"><h1 style="margin:0 0 14px;font-size:20px;line-height:1.35;font-weight:700;color:#111827;">${esc(heading)}</h1><p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#111827;">${esc(greeting(name))}</p><p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">${esc(intro)}</p>${list}${cta}<p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#4b5563;">Hörmətlə,<br><strong style="color:#111827;">kirayeal.az komandası</strong></p>${note ? `<p style="margin:20px 0 0;padding-top:16px;border-top:1px solid #f0f1f3;font-size:12.5px;line-height:1.6;color:#6b7280;">${esc(note)}</p>` : ""}</td></tr><tr><td style="padding:18px 8px 0;font-family:${font};font-size:12px;line-height:1.7;color:#9ca3af;text-align:center;"><a href="${site}" style="color:#6b7280;text-decoration:none;font-weight:600;">kirayeal.az</a> · Azərbaycanda kirayə elanları<br>Əlaqə: <a href="mailto:kirayeal.az@gmail.com" style="color:#6b7280;text-decoration:none;">kirayeal.az@gmail.com</a><br>Bu məktub avtomatik göndərilib. Bildirişləri kabinetdə, «Profil» bölməsində söndürə bilərsiniz.</td></tr></table></td></tr></table></body></html>`;
  const text = ["kirayeal.az", "", heading, "", greeting(name), "", intro, ...rows.map((row) => `• ${row.label}${row.value ? ` — ${row.value}` : ""}${row.href ? ` ${link(row.href)}` : ""}`), ...(button ? ["", `${button.text}: ${link(button.href)}`] : []), "", "Hörmətlə,", "kirayeal.az komandası", ...(note ? ["", note] : [])].join("\n");
  return { html, text };
}
const greeting = (name) => `Hörmətli ${String(name || "").trim() || "istifadəçi"},`;

export async function runNotices(db, requireFromApp) {
  const hour = Number((await db.query(`select extract(hour from now() at time zone 'Asia/Baku')::int as h`)).rows[0].h);
  if (hour < 9 || hour >= 21) return;
  if (!process.env.KIRAYE_SMTP_HOST || !process.env.KIRAYE_SMTP_USER || !process.env.KIRAYE_SMTP_PASSWORD) return;
  const nodemailer = requireFromApp("nodemailer");
  const port = Number(process.env.KIRAYE_SMTP_PORT || 465);
  const transport = nodemailer.createTransport({ host: process.env.KIRAYE_SMTP_HOST, port, secure: port === 465, auth: { user: process.env.KIRAYE_SMTP_USER, pass: process.env.KIRAYE_SMTP_PASSWORD } });
  const send = (to, subject, body) => transport.sendMail({ from: `kirayeal.az <${process.env.KIRAYE_SMTP_USER}>`, to, subject, text: body.text, html: body.html });
  const claim = async (userId, kind, ref) => (await db.query(`insert into public.notification_log(user_id,kind,ref) values($1,$2,$3) on conflict(kind,ref) do nothing returning id`, [userId, kind, ref])).rowCount > 0;
  for (const task of [expiring, storeExpiring, savedSearches, weekly]) {
    try { await task(db, send, claim); } catch (error) { console.error(`notice ${task.name} failed:`, String(error?.message || error).slice(0, 200)); }
  }
}

async function expiring(db, send, claim) {
  const rows = (await db.query(`select l.id,l.title,l.owner_id,l.expires_at,to_char(l.expires_at at time zone 'Asia/Baku','DD.MM.YYYY') as until,u.email,p.display_name as name
    from public.listings l join auth.users u on u.id=l.owner_id left join public.profiles p on p.id=l.owner_id
    where l.status='published' and l.deleted_at is null and l.expires_at>now() and l.expires_at<=now()+interval '3 days' and coalesce(p.email_notifications,true)
    order by l.expires_at limit 50`)).rows;
  for (const row of rows) {
    if (!(await claim(row.owner_id, "expiry", `${row.id}:${row.until}`))) continue;
    await send(row.email, `Elanınızın yayım müddəti başa çatır — «${row.title}»`.slice(0, 120), letter({
      heading: "Elanınızın yayım müddəti başa çatır",
      name: row.name,
      intro: `«${row.title}» elanınızın yayım müddəti ${row.until} tarixində başa çatır. Elan hələ aktualdırsa, onu kabinetinizdən yeniləyə və ya irəli çəkə bilərsiniz.`,
      button: { text: "Elanlarımı idarə et", href: "/profile?section=listings" },
      note: "Əmlak və ya əşya artıq kirayəyə verilibsə, heç bir əməliyyat tələb olunmur: müddət başa çatdıqda elan avtomatik olaraq saytdan çıxarılacaq.",
    }));
  }
}

// Stores: a letter 3 days before the paid period ends, and one on the day it has ended.
async function storeExpiring(db, send, claim) {
  const rows = (await db.query(`select s.id,s.name,s.owner_id,s.active_until<=now() as ended,to_char(s.active_until at time zone 'Asia/Baku','DD.MM.YYYY') as until,pl.name as plan,u.email,p.display_name as person
    from public.stores s join public.store_plans pl on pl.id=s.plan join auth.users u on u.id=s.owner_id left join public.profiles p on p.id=s.owner_id
    where s.status='active' and s.active_until>now()-interval '1 day' and s.active_until<=now()+interval '3 days' order by s.active_until limit 50`).catch(() => ({ rows: [] }))).rows;
  for (const row of rows) {
    if (!(await claim(row.owner_id, row.ended ? "store_ended" : "store_expiry", `${row.id}:${row.until}`))) continue;
    await send(row.email, (row.ended ? `Mağazanızın müddəti başa çatdı — «${row.name}»` : `Mağazanızın müddəti başa çatır — «${row.name}»`).slice(0, 120), letter({
      heading: row.ended ? "Mağazanızın müddəti başa çatdı" : "Mağazanızın müddəti 3 gün sonra başa çatır",
      name: row.person,
      intro: row.ended
        ? `«${row.name}» mağazasının «${row.plan}» paketi üzrə müddəti ${row.until} tarixində başa çatıb. Mağaza səhifəsi müvəqqəti bağlanıb, elanlarınızdakı «Mağaza» nişanı götürülüb və elan limiti standart həddə qaytarılıb. Elanlarınız saytda qalır.`
        : `«${row.name}» mağazasının «${row.plan}» paketi üzrə müddəti ${row.until} tarixində başa çatır. Müddət uzadılmazsa, mağaza səhifəsi bağlanacaq, elanlarınızdakı «Mağaza» nişanı götürüləcək və elan limiti standart həddə qayıdacaq.`,
      rows: [{ label: "Mağaza", value: row.name }, { label: "Paket", value: row.plan }, { label: row.ended ? "Bitmə tarixi" : "Bitəcəyi tarix", value: row.until }],
      button: { text: "Mağazanı idarə et", href: "/profile?section=store" },
      note: "Müddəti uzatmaq üçün kabinetdə «Mağaza» bölməsindən müraciət edin və ya kirayeal.az@gmail.com ünvanına yazın. Uzadıldıqdan sonra mağaza əvvəlki ünvanında yenidən açılır.",
    }));
  }
}

async function savedSearches(db, send, claim) {
  const alerts = (await db.query(`select a.id,a.user_id,a.label,a.params,a.last_checked,u.email,p.display_name as name from public.saved_search_alerts a join auth.users u on u.id=a.user_id
    left join public.profiles p on p.id=a.user_id where a.last_checked<now()-interval '1 hour' and coalesce(p.email_notifications,true) order by a.last_checked limit 50`)).rows;
  for (const alert of alerts) {
    const p = alert.params || {}, where = [`l.status='published'`, `l.deleted_at is null`, `(l.expires_at is null or l.expires_at>now())`, `coalesce(l.first_published_at,l.created_at)>$1`, `l.owner_id<>$2`], values = [alert.last_checked, alert.user_id];
    const add = (sql, value) => { values.push(value); where.push(sql.replaceAll("?", `$${values.length}`)); };
    if (p.category) add("l.category=?", String(p.category));
    if (p.city) add("l.city=?", String(p.city));
    if (p.period) add("l.rental_period=?", String(p.period));
    if (Number(p.max) > 0) add("l.price<=?", Number(p.max));
    if (Number(p.min) > 0) add("l.price>=?", Number(p.min));
    if (p.query) add("(l.title ilike ? or l.description ilike ?)", `%${String(p.query).replace(/[%_\\]/g, " ").slice(0, 80)}%`);
    const found = (await db.query(`select l.id,l.title,l.price,l.rental_period,l.city from public.listings l where ${where.join(" and ")} order by coalesce(l.first_published_at,l.created_at) desc limit 6`, values)).rows;
    await db.query(`update public.saved_search_alerts set last_checked=now() where id=$1`, [alert.id]);
    if (!found.length || !(await claim(alert.user_id, "search", `${alert.id}:${found[0].id}`))) continue;
    await send(alert.email, `Yeni elan: ${alert.label}`.slice(0, 120), letter({
      heading: "Axtarışınıza uyğun yeni elanlar",
      name: alert.name,
      intro: `Yadda saxladığınız «${alert.label}» axtarışına uyğun ${found.length > 5 ? "bir neçə" : found.length} yeni elan dərc olunub. Ən sonuncular aşağıdadır.`,
      rows: found.slice(0, 5).map((item) => ({ label: `${item.title} · ${item.city}`, value: `${money(item.price)} ₼/${period(item.rental_period)}`, href: `/listings/${item.id}` })),
      button: { text: "Bütün elanlara bax", href: "/#elanlar" },
      note: "Bu bildiriş saytda yadda saxladığınız axtarış əsasında göndərilib. Axtarışı ana səhifədəki «Yadda saxlanılan axtarışlar» bölməsindən silə bilərsiniz.",
    }));
  }
}

// One query at a time: a single pg client does not run queries in parallel.
const sequence = async (jobs) => { const out = []; for (const job of jobs) out.push(await job()); return out; };

async function weekly(db, send, claim) {
  const now = (await db.query(`select extract(isodow from now() at time zone 'Asia/Baku')::int as dow, to_char(now() at time zone 'Asia/Baku','IYYY-IW') as week`)).rows[0];
  if (Number(now.dow) !== 1 || !(await claim(null, "weekly", now.week))) return;
  const one = async (sql) => Number((await db.query(sql)).rows[0]?.n || 0);
  const [users, listings, published, messages, views, pending, reports] = await sequence([
    () => one(`select count(*) as n from auth.users where created_at>now()-interval '7 days'`),
    () => one(`select count(*) as n from public.listings where created_at>now()-interval '7 days'`),
    () => one(`select count(*) as n from public.listings where status='published' and deleted_at is null and (expires_at is null or expires_at>now())`),
    () => one(`select count(*) as n from public.chat_messages where created_at>now()-interval '7 days'`),
    () => one(`select count(*) as n from public.listing_views where view_day>current_date-7`).catch(() => 0),
    () => one(`select count(*) as n from public.listings where status='pending' and deleted_at is null`),
    () => one(`select count(*) as n from public.listing_reports where status='open'`).catch(() => 0),
  ]);
  const top = (await db.query(`select l.category,count(*) as n from public.listing_views v join public.listings l on l.id=v.listing_id where v.view_day>current_date-7 group by 1 order by 2 desc limit 3`).catch(() => ({ rows: [] }))).rows;
  const names = { property: "Ev və mənzil", car: "Avtomobil", motorcycle: "Motosiklet", villa: "Villa və bağ", commercial: "Kommersiya", equipment: "Alətlər və texnika", clothing: "Geyim", electric: "Elektrik nəqliyyat", photo: "Foto və video", camping: "Turizm", bicycle: "Velosiped", event: "Tədbir üçün" };
  await send(ownerEmail, `Həftəlik hesabat — kirayeal.az`, letter({
    heading: "Həftəlik hesabat: son 7 gün",
    name: "Rəhbər",
    intro: "Saytın son 7 gün üzrə əsas göstəriciləri aşağıda təqdim olunur.",
    rows: [
      { label: "Yeni istifadəçi", value: String(users) },
      { label: "Yeni elan", value: String(listings) },
      { label: "Hazırda yayımda olan elan", value: String(published) },
      { label: "Göndərilən mesaj", value: String(messages) },
      { label: "Elanlara baxış", value: String(views) },
      { label: "Yoxlama gözləyən elan", value: String(pending) },
      { label: "Açıq şikayət", value: String(reports) },
      ...top.map((row, i) => ({ label: `${i + 1}. Ən çox baxılan: ${names[row.category] || row.category}`, value: `${row.n} baxış` })),
    ],
    button: { text: "Rəhbər panelini aç", href: "/admin" },
  }));
}
