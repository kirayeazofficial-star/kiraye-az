// One letter design for every e-mail kirayeal.az sends: the site itself (lib/host/email-template.ts) and the
// 5-minute notice job (scripts/notify-tasks.mjs) both use this file, so all letters look the same.
// Layout in the manner of bank and security letters: brand on top, a small topic line, a centred title,
// then the text, a details panel, one button and the signature. E-mail apps (Gmail, Outlook, iPhone Mail)
// ignore stylesheets and web fonts, so only tables, inline styles and a safe font stack are used.
// Sizes: title 19px, text 14px/22px, details 14px, small print 12px.
const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://kirayeal.az").replace(/\/$/, "");
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";
const INK = "#111827", TEXT = "#374151", MUTED = "#6b7280", FAINT = "#9ca3af", LINE = "#e5e7eb", PANEL = "#f8fafc", ACCENT = "#cb4618", BRAND = "#104c43";
// "kirayeal.az" in running text: a zero-width space after the dot stops Gmail / iPhone Mail from turning it into a blue link.
const BRAND_TEXT = "kirayeal.&#8203;az";
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
const link = (href) => (href.startsWith("http") ? href : `${site}${href}`);
export const greeting = (name) => `Hörmətli ${String(name || "").trim() || "istifadəçi"},`;
// Titles are full sentences, so they end with a full stop like the rest of the text.
const sentence = (text) => { const value = String(text ?? "").trim(); return /[.!?:…]$/.test(value) ? value : `${value}.`; };
const brandText = (text) => esc(text).replace(/kirayeal\.az/g, BRAND_TEXT);

function frame({ label, title, preheader, body, footerNote }) {
  const year = new Date().getFullYear();
  return `<!doctype html><html lang="az"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light"><title>${esc(sentence(title))}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(preheader)}&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;"><tr><td align="center" style="padding:28px 12px 32px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
    <tr><td align="center" style="padding:0 0 18px;font-family:${FONT};">
      <a href="${site}" style="font-size:22px;line-height:26px;font-weight:700;letter-spacing:-0.4px;color:${BRAND};text-decoration:none;">kirayeal<span style="color:${ACCENT};">.az</span></a>
    </td></tr>
    <tr><td style="background:#ffffff;border:1px solid ${LINE};border-radius:10px;padding:30px 28px 28px;font-family:${FONT};color:${TEXT};overflow-wrap:anywhere;word-break:break-word;">
      <p style="margin:0 0 8px;text-align:center;font-family:${FONT};font-size:12px;line-height:16px;font-weight:600;letter-spacing:0.8px;text-transform:uppercase;color:${MUTED};">${esc(label)}</p>
      <h1 style="margin:0 0 22px;padding:0 0 22px;border-bottom:1px solid ${LINE};text-align:center;font-family:${FONT};font-size:19px;line-height:26px;font-weight:600;color:${INK};">${esc(sentence(title))}</h1>
      ${body}
      <p style="margin:26px 0 0;font-family:${FONT};font-size:14px;line-height:22px;color:${TEXT};">Hörmətlə,<br>${BRAND_TEXT} komandası</p>
    </td></tr>
    <tr><td align="center" style="padding:20px 20px 0;font-family:${FONT};font-size:12px;line-height:19px;color:${MUTED};">
      ${esc(footerNote)}<br>
      <a href="${site}/help" style="color:${MUTED};text-decoration:underline;">Kömək</a> &middot; <a href="${site}/rules" style="color:${MUTED};text-decoration:underline;">Qaydalar</a> &middot; <a href="${site}/privacy" style="color:${MUTED};text-decoration:underline;">Məxfilik</a> &middot; <a href="mailto:kirayeal.az@gmail.com" style="color:${MUTED};text-decoration:underline;">kirayeal.az@gmail.com</a><br>
      <span style="color:${FAINT};">© ${year} ${BRAND_TEXT} — Azərbaycanda kirayə elanları</span>
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}
const para = (text, color = TEXT, margin = "0 0 16px") => `<p style="margin:${margin};font-family:${FONT};font-size:14px;line-height:22px;color:${color};">${brandText(text)}</p>`;
const small = (text) => `<p style="margin:22px 0 0;padding:14px 16px;border-radius:8px;background:${PANEL};font-family:${FONT};font-size:12px;line-height:18px;color:${MUTED};">${brandText(text)}</p>`;
const textLetter = (title, lines) => ["kirayeal.az", "", sentence(title), "", ...lines, "", "Hörmətlə,", "kirayeal.az komandası", "", site].join("\n");

// Confirmation / recovery / staff sign-in code.
export function codeLetter({ heading: title, name, intro, code, note, label = "Təsdiq kodu" }) {
  const body = `${para(greeting(name), INK)}${para(intro)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 8px;"><tr><td align="center" style="background:${PANEL};border:1px solid ${LINE};border-radius:8px;padding:16px 12px;">
        <span style="font-family:${FONT};font-size:28px;line-height:34px;font-weight:600;letter-spacing:8px;color:${INK};">${esc(code)}</span>
      </td></tr></table>
      <p style="margin:0 0 4px;text-align:center;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">${esc(note)}</p>
      ${small(codeSafety)}`;
  const html = frame({ label, title, preheader: `${sentence(title)} ${note}`, body, footerNote: automaticNote });
  const text = textLetter(title, [greeting(name), "", intro, "", `Təsdiq kodu: ${code}`, note, "", codeSafety, "", automaticNote]);
  return { html, text };
}

// Notice (security alert, new message, rejected or expiring listing, saved search, reports): text,
// optional details panel, one button and an optional note.
export function noticeLetter({ heading: title, name, intro, rows = [], button, note, label = "Bildiriş", footerNote = "Bu məktub avtomatik göndərilmişdir. E-poçt bildirişlərini şəxsi kabinetinizin «Profil» bölməsində idarə edə bilərsiniz." }) {
  const cell = (i) => `padding:11px 16px;${i ? `border-top:1px solid ${LINE};` : ""}font-family:${FONT};font-size:14px;line-height:20px;vertical-align:top;overflow-wrap:anywhere;word-break:break-word;`;
  const list = rows.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 22px;background:${PANEL};border:1px solid ${LINE};border-radius:8px;border-collapse:separate;">${rows.map((row, i) => row.value !== undefined
    ? `<tr><td style="${cell(i)}color:${MUTED};overflow-wrap:anywhere;word-break:break-word;">${esc(row.label)}</td><td align="right" style="${cell(i)}color:${INK};font-weight:500;">${row.href ? `<a href="${esc(link(row.href))}" style="color:${INK};text-decoration:none;">${esc(row.value)}</a>` : esc(row.value)}</td></tr>`
    : `<tr><td colspan="2" style="${cell(i)}color:${INK};">${row.href ? `<a href="${esc(link(row.href))}" style="color:${INK};text-decoration:none;font-weight:500;">${esc(row.label)}</a>` : esc(row.label)}</td></tr>`).join("")}</table>` : "";
  const cta = button ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 0;"><tr><td align="center"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background:${BRAND};border-radius:6px;"><a href="${esc(link(button.href))}" style="display:inline-block;padding:11px 26px;font-family:${FONT};font-size:14px;line-height:20px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">${esc(button.text)}</a></td></tr></table></td></tr></table>` : "";
  const body = `${para(greeting(name), INK)}${para(intro)}${list}${cta}${note ? small(note) : ""}`;
  const html = frame({ label, title, preheader: intro, body, footerNote });
  const text = textLetter(title, [greeting(name), "", intro, ...rows.map((row) => `• ${row.label}${row.value ? ` — ${row.value}` : ""}${row.href ? ` ${link(row.href)}` : ""}`), ...(button ? ["", `${button.text}: ${link(button.href)}`] : []), ...(note ? ["", note] : []), "", footerNote]);
  return { html, text };
}

const automaticNote = "Bu məktub avtomatik göndərilib. Yardım üçün kirayeal.az@gmail.com ünvanına müraciət edə bilərsiniz.";
const codeSafety = "Bu sorğunu siz göndərməmisinizsə, kodu daxil etməyin. Təsdiq kodunu heç kimlə paylaşmayın. kirayeal.az əməkdaşları sizdən təsdiq kodunu tələb etmir.";
const verificationCopy = {
  signup: { label: "Qeydiyyat", heading: "Qeydiyyatınızı təsdiqləyin", intro: "kirayeal.az saytında qeydiyyatınızı tamamlamaq üçün aşağıdakı təsdiq kodunu qeydiyyat səhifəsində daxil edin." },
  recovery: { label: "Şifrə bərpası", heading: "Şifrənizi bərpa edin", intro: "Hesabınızın şifrəsini bərpa etmək üçün sorğu göndərilib. Aşağıdakı təsdiq kodunu şifrə bərpası səhifəsində daxil edin. Daha sonra yeni şifrə təyin edə bilərsiniz." },
  email_change: { label: "E-poçt dəyişikliyi", heading: "E-poçt dəyişikliyini təsdiqləyin", intro: "Hesabınıza bağlı e-poçt ünvanının dəyişdirilməsi üçün sorğu göndərilib. Dəyişikliyi təsdiqləmək üçün aşağıdakı kodu şəxsi kabinetinizin «Profil» bölməsində daxil edin." },
  staff_login: { label: "İdarəetmə paneli", heading: "İdarəetmə panelinə girişi təsdiqləyin", intro: "İdarəetmə panelinə yeni cihazdan giriş üçün sorğu göndərilib. Girişi təsdiqləmək üçün aşağıdakı kodu giriş səhifəsində daxil edin. Təsdiqdən sonra cihaz 3 gün ərzində yadda saxlanılacaq." },
};

// The subject and both message formats always describe the same operation.
export function verificationLetter(purpose, name, code) {
  const copy = verificationCopy[purpose];
  if (!copy) throw new Error("Unknown verification purpose");
  return { subject: `${copy.label} üçün təsdiq kodu — kirayeal.az`, ...codeLetter({ ...copy, name, code, note: "Kod göndərildiyi andan 10 dəqiqə ərzində etibarlıdır." }) };
}
