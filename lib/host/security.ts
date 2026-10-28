import "server-only";
import {createHash,createHmac,randomBytes,randomUUID,timingSafeEqual} from "node:crypto";
import bcrypt from "bcryptjs";
import {hostConfig} from "./config";

export function newId(){return randomUUID();}
export function newSessionToken(){return randomBytes(32).toString("base64url");}
export function tokenHash(token:string){return createHash("sha256").update(token).digest();}
export async function passwordHash(password:string){return bcrypt.hash(password,12);}
export async function passwordMatches(password:string,hash:string){return bcrypt.compare(password,hash);}
export function newEmailCode(){return String(Math.floor(Math.random()*1_000_000)).padStart(6,"0");}
export function emailCodeHash(email:string,purpose:string,code:string){
  const config=hostConfig();if(!config)throw new Error("Host backend is not enabled.");
  return createHmac("sha256",config.sessionSecret).update(`${email.toLowerCase()}\0${purpose}\0${code}`).digest();
}
export function safeEqual(left:Buffer,right:Buffer){return left.length===right.length&&timingSafeEqual(left,right);}
