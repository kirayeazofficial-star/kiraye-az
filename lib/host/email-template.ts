// Branded HTML letter for every e-mail the site sends: table layout and inline styles only,
// because e-mail apps (Gmail, Outlook, iPhone Mail) ignore stylesheets.
const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://kirayeal.az").replace(/\/$/, "");
const font = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const escape = (value: string) => value.replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

export function codeLetter({ heading, intro, code, note }: { heading: string; intro: string; code: string; note: string }) {
  const digits = escape(code);
  const html = `<!doctype html><html lang="az"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${escape(heading)}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escape(heading)}: ${digits}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
    <tr><td style="padding:0 4px 18px;font-family:${font};font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#123f39;">kirayeal<span style="color:#ff5a1f;">.az</span></td></tr>
    <tr><td style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:32px 28px;font-family:${font};color:#1f2937;">
      <h1 style="margin:0 0 12px;font-size:20px;line-height:1.35;font-weight:700;color:#111827;">${escape(heading)}</h1>
      <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#4b5563;">${escape(intro)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="background:#fff4ee;border:1px solid #ffd9c7;border-radius:12px;padding:18px 12px;">
        <span style="font-family:${font};font-size:34px;line-height:1;font-weight:800;letter-spacing:10px;color:#e8490f;">${digits}</span>
      </td></tr></table>
      <p style="margin:22px 0 0;font-size:14px;line-height:1.6;color:#4b5563;">${escape(note)}</p>
      <p style="margin:18px 0 0;padding-top:18px;border-top:1px solid #f0f1f3;font-size:13px;line-height:1.6;color:#6b7280;">Bu sorğunu siz etməmisinizsə, məktubu nəzərə almayın — hesabınızda heç nə dəyişməyəcək. Kodu heç kimə deməyin: kirayeal.az əməkdaşları kodunuzu heç vaxt soruşmur.</p>
    </td></tr>
    <tr><td style="padding:18px 8px 0;font-family:${font};font-size:12px;line-height:1.7;color:#9ca3af;text-align:center;">
      <a href="${site}" style="color:#6b7280;text-decoration:none;font-weight:600;">kirayeal.az</a> · Azərbaycanda kirayə elanları<br>
      Əlaqə: <a href="mailto:kirayeal.az@gmail.com" style="color:#6b7280;text-decoration:none;">kirayeal.az@gmail.com</a> · +994 50 219 11 45<br>
      Bu məktub avtomatik göndərilib, cavab yazmağa ehtiyac yoxdur.
    </td></tr>
  </table>
</td></tr></table></body></html>`;
  const text = `kirayeal.az\n\n${heading}\n\n${intro}\n\n${code}\n\n${note}\n\nBu sorğunu siz etməmisinizsə, məktubu nəzərə almayın. Kodu heç kimə deməyin.\n\n${site}`;
  return { html, text };
}
