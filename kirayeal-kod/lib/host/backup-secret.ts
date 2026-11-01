import "server-only";
import {createCipheriv,createDecipheriv,createHash,randomBytes} from "node:crypto";
// The Drive refresh token is kept encrypted in the database with a key derived from the
// session secret (the same scheme as scripts/backup-to-drive.mjs, which reads it at night).
const key=()=>createHash("sha256").update(`${process.env.KIRAYE_SESSION_SECRET||""}:kirayeal-backup`).digest();
export function sealSecret(value:string){
  const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key(),iv);
  const body=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]);
  return [iv,cipher.getAuthTag(),body].map(part=>part.toString("base64url")).join(".");
}
export function openSecret(sealed:string){
  const [iv,tag,body]=sealed.split(".").map(part=>Buffer.from(part,"base64url"));
  const decipher=createDecipheriv("aes-256-gcm",key(),iv);decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body),decipher.final()]).toString("utf8");
}
