import "server-only";
import nodemailer from "nodemailer";
import {codeLetter} from "./email-template";

function required(name:string){const value=process.env[name]?.trim();if(!value)throw new Error(`${name} is missing.`);return value;}

export async function sendVerificationCode(email:string,code:string,purpose:"signup"|"recovery"|"email_change"){
  const port=Number(process.env.KIRAYE_SMTP_PORT||465);
  const transporter=nodemailer.createTransport({
    host:required("KIRAYE_SMTP_HOST"),port,secure:port===465,
    auth:{user:required("KIRAYE_SMTP_USER"),pass:required("KIRAYE_SMTP_PASSWORD")},
  });
  const subject=purpose==="recovery"?"Şifrə yeniləmə kodu — kirayeal.az":purpose==="email_change"?"E-poçt dəyişmə kodu — kirayeal.az":"Hesab təsdiq kodu — kirayeal.az";
  const letter=codeLetter({
    heading:purpose==="recovery"?"Şifrənizi yeniləyin":purpose==="email_change"?"E-poçt ünvanınızı təsdiqləyin":"Hesabınızı təsdiqləyin",
    intro:purpose==="recovery"?"Şifrəni yeniləmək üçün aşağıdakı kodu saytda müvafiq xanaya yazın.":purpose==="email_change"?"E-poçt ünvanınızı dəyişmək üçün aşağıdakı kodu saytda müvafiq xanaya yazın.":"kirayeal.az-da qeydiyyatı tamamlamaq üçün aşağıdakı kodu saytda müvafiq xanaya yazın.",
    code,
    note:"Kod 10 dəqiqə ərzində etibarlıdır.",
  });
  await transporter.sendMail({
    from:`kirayeal.az <${required("KIRAYE_SMTP_USER")}>`,to:email,subject,text:letter.text,html:letter.html,
  });
}
