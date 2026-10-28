import "server-only";
import nodemailer from "nodemailer";

function required(name:string){const value=process.env[name]?.trim();if(!value)throw new Error(`${name} is missing.`);return value;}

export async function sendVerificationCode(email:string,code:string,purpose:"signup"|"recovery"|"email_change"){
  const port=Number(process.env.KIRAYE_SMTP_PORT||465);
  const transporter=nodemailer.createTransport({
    host:required("KIRAYE_SMTP_HOST"),port,secure:port===465,
    auth:{user:required("KIRAYE_SMTP_USER"),pass:required("KIRAYE_SMTP_PASSWORD")},
  });
  const subject=purpose==="recovery"?"Kirayeal.az şifrə yeniləmə kodu":purpose==="email_change"?"Kirayeal.az e-poçt dəyişmə kodu":"Kirayeal.az təsdiq kodu";
  await transporter.sendMail({
    from:`Kirayeal.az <${required("KIRAYE_SMTP_USER")}>`,to:email,subject,
    text:`Təsdiq kodunuz: ${code}\n\nKod 10 dəqiqə ərzində etibarlıdır. Bu sorğunu siz etməmisinizsə məktubu nəzərə almayın.`,
    html:`<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px"><h2 style="color:#164f48">Kirayeal.az</h2><p>${purpose==="recovery"?"Şifrənizi yeniləmək":purpose==="email_change"?"E-poçt ünvanınızı dəyişmək":"Hesabınızı təsdiqləmək"} üçün kod:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#ef7048">${code}</p><p>Kod 10 dəqiqə ərzində etibarlıdır.</p></div>`,
  });
}
