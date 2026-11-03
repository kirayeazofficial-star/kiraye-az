import "server-only";
import nodemailer from "nodemailer";
import {verificationLetter} from "./email-template";
export {noticeLetter} from "./email-template";

function required(name:string){const value=process.env[name]?.trim();if(!value)throw new Error(`${name} is missing.`);return value;}

export async function sendVerificationCode(email:string,code:string,purpose:"signup"|"recovery"|"email_change"|"staff_login",name=""){
  const port=Number(process.env.KIRAYE_SMTP_PORT||465);
  const transporter=nodemailer.createTransport({
    host:required("KIRAYE_SMTP_HOST"),port,secure:port===465,
    auth:{user:required("KIRAYE_SMTP_USER"),pass:required("KIRAYE_SMTP_PASSWORD")},
  });
  const letter=verificationLetter(purpose,name,code);
  await transporter.sendMail({
    from:`kirayeal.az <${required("KIRAYE_SMTP_USER")}>`,to:email,subject:letter.subject,text:letter.text,html:letter.html,
  });
}

// Any other letter (notices). Never throws: a missing mail setting only skips the letter.
export async function sendLetter(to:string,subject:string,letter:{html:string;text:string}){
  try{
    const port=Number(process.env.KIRAYE_SMTP_PORT||465);
    const transporter=nodemailer.createTransport({host:required("KIRAYE_SMTP_HOST"),port,secure:port===465,auth:{user:required("KIRAYE_SMTP_USER"),pass:required("KIRAYE_SMTP_PASSWORD")}});
    await transporter.sendMail({from:`kirayeal.az <${required("KIRAYE_SMTP_USER")}>`,to,subject,text:letter.text,html:letter.html});
    return true;
  }catch(error){console.error("mail failed:",(error as Error).message);return false;}
}
