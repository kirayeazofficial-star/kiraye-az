// One branded letter frame for every e-mail kirayeal.az sends: the site itself (lib/host/email-template.ts)
// and the 5-minute notice job (scripts/notify-tasks.mjs) both use this file, so all letters look the same.
// E-mail apps (Gmail, Outlook, iPhone Mail) ignore stylesheets and web fonts: tables, inline styles and a
// safe font stack only. Sizes: heading 22px, text 15px/24px, small print 12–13px.
const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://kirayeal.az").replace(/\/$/, "");
const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif";
const INK = "#111827", TEXT = "#374151", MUTED = "#6b7280", LINE = "#e5e7eb", ACCENT = "#ff5a1f", BRAND = "#143f3b";
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
const link = (href) => (href.startsWith("http") ? href : `${site}${href}`);
export const greeting = (name) => `Hörmətli ${String(name || "").trim() || "istifadəçi"},`;

function frame({ title, preheader, body, footerNote }) {
  return `<!doctype html><html lang="az"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#f4f5f7;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(preheader)}&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f5f7;"><tr><td align="center" style="padding:32px 12px 40px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
    <tr><td style="background:#ffffff;border:1px solid ${LINE};border-top:4px solid ${ACCENT};border-radius:14px 14px 0 0;padding:22px 32px 18px;font-family:${FONT};">
      <a href="${site}" style="font-size:24px;line-height:28px;font-weight:700;letter-spacing:-0.4px;color:${BRAND};text-decoration:none;">kirayeal<span style="color:${ACCENT};">.az</span></a>
    </td></tr>
    <tr><td style="background:#ffffff;border:1px solid ${LINE};border-top:0;border-radius:0 0 14px 14px;padding:8px 32px 32px;font-family:${FONT};color:${TEXT};">
      ${body}
      <p style="margin:28px 0 0;font-size:15px;line-height:24px;color:${TEXT};">Hörmətlə,<br><span style="font-weight:700;color:${INK};">kirayeal.az komandası</span></p>
    </td></tr>
    <tr><td style="padding:22px 16px 0;font-family:${FONT};font-size:12px;line-height:19px;color:${MUTED};text-align:center;">
      <a href="${site}" style="color:${INK};font-weight:700;text-decoration:none;">kirayeal.az</a> — Azərbaycanda kirayə elanları<br>
      <a href="${site}/help" style="color:${MUTED};text-decoration:underline;">Kömək</a> &nbsp;·&nbsp; <a href="${site}/rules" style="color:${MUTED};text-decoration:underline;">Qaydalar</a> &nbsp;·&nbsp; <a href="https://www.instagram.com/kirayeal.az/" style="color:${MUTED};text-decoration:underline;">Instagram</a> &nbsp;·&nbsp; <a href="mailto:kirayeal.az@gmail.com" style="color:${MUTED};text-decoration:underline;">kirayeal.az@gmail.com</a><br>
      <span style="color:#9ca3af;">${esc(footerNote)}</span>
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}
const heading = (text) => `<h1 style="margin:16px 0 16px;font-family:${FONT};font-size:22px;line-height:30px;font-weight:700;color:${INK};">${esc(text)}</h1>`;
const para = (text, color = TEXT) => `<p style="margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:24px;color:${color};">${esc(text)}</p>`;

// Confirmation / recovery code.
export function codeLetter({ heading: title, intro, code, note }) {
  const body = `${heading(title)}${para(greeting(), INK)}${para(intro)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 18px;"><tr><td align="center" style="background:#fff5f0;border:1px solid #ffd9c7;border-radius:12px;padding:20px 12px;">
        <span style="font-family:'SF Mono',Menlo,Consolas,'Courier New',monospace;font-size:34px;line-height:40px;font-weight:700;letter-spacing:10px;color:#d9440c;">${esc(code)}</span>
      </td></tr></table>
      ${para(note)}
      <p style="margin:18px 0 0;padding:14px 16px;border-radius:10px;background:#f9fafb;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">Bu sorğunu siz etməmisinizsə, məktubu nəzərə almayın — hesabınızda heç nə dəyişməyəcək. Kodu heç kimə deməyin: kirayeal.az əməkdaşları kodunuzu heç vaxt soruşmur.</p>`;
  const html = frame({ title, preheader: `${title}: ${code}`, body, footerNote: "Bu məktub avtomatik göndərilib, cavab yazmağa ehtiyac yoxdur." });
  const text = ["kirayeal.az", "", title, "", greeting(), "", intro, "", code, "", note, "", "Hörmətlə,", "kirayeal.az komandası", "", "Bu sorğunu siz etməmisinizsə, məktubu nəzərə almayın. Kodu heç kimə deməyin.", "", site].join("\n");
  return { html, text };
}

// Notice (new message, rejected or expiring listing, saved search, weekly report): heading, short text,
// optional rows and one button.
export function noticeLetter({ heading: title, name, intro, rows = [], button, note }) {
  const cell = (i) => `padding:13px 16px;${i ? `border-top:1px solid #f0f1f3;` : ""}font-family:${FONT};font-size:14px;line-height:20px;`;
  const list = rows.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 22px;border:1px solid ${LINE};border-radius:12px;border-collapse:separate;">${rows.map((row, i) => `<tr><td style="${cell(i)}color:${INK};">${row.href ? `<a href="${esc(link(row.href))}" style="color:${INK};text-decoration:none;font-weight:600;">${esc(row.label)}</a>` : esc(row.label)}</td>${row.value !== undefined ? `<td align="right" style="${cell(i)}font-weight:700;color:${INK};white-space:nowrap;">${esc(row.value)}</td>` : ""}</tr>`).join("")}</table>` : "";
  const cta = button ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 0;"><tr><td align="center" style="background:${ACCENT};border-radius:10px;"><a href="${esc(link(button.href))}" style="display:inline-block;padding:14px 26px;font-family:${FONT};font-size:15px;line-height:20px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">${esc(button.text)}</a></td></tr></table>` : "";
  const extra = note ? `<p style="margin:22px 0 0;padding-top:16px;border-top:1px solid #f0f1f3;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">${esc(note)}</p>` : "";
  const body = `${heading(title)}${para(greeting(name), INK)}${para(intro)}${list}${cta}${extra}`;
  const html = frame({ title, preheader: intro, body, footerNote: "Bu məktub avtomatik göndərilib. Bildirişləri kabinetdə, «Profil» bölməsində söndürə bilərsiniz." });
  const text = ["kirayeal.az", "", title, "", greeting(name), "", intro, ...rows.map((row) => `• ${row.label}${row.value ? ` — ${row.value}` : ""}${row.href ? ` ${link(row.href)}` : ""}`), ...(button ? ["", `${button.text}: ${link(button.href)}`] : []), "", "Hörmətlə,", "kirayeal.az komandası", ...(note ? ["", note] : [])].join("\n");
  return { html, text };
}
