import {NextResponse} from "next/server";
import {randomBytes} from "node:crypto";
import {currentUser} from "../../../../../lib/host/session";
import {isLeader} from "../../../../../lib/host/staff";
import {publicSiteUrl} from "../../../../../lib/site-url";

export const dynamic="force-dynamic";
// Leader connects their Google Drive for the nightly backups. drive.file only lets the site
// see the files it creates itself, nothing else on the Drive.
export async function GET(){
  const site=publicSiteUrl(),clientId=process.env.GOOGLE_CLIENT_ID?.trim();
  const user=await currentUser().catch(()=>null);
  if(!user||!await isLeader(user).catch(()=>false))return NextResponse.redirect(`${site}/admin`);
  if(!clientId||!process.env.GOOGLE_CLIENT_SECRET)return NextResponse.redirect(`${site}/admin?backup=no-google`);
  const state=randomBytes(24).toString("hex");
  const url=new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search=new URLSearchParams({client_id:clientId,redirect_uri:`${site}/api/admin/backup/drive/callback`,response_type:"code",scope:"openid email https://www.googleapis.com/auth/drive.file",access_type:"offline",prompt:"consent",state}).toString();
  const res=NextResponse.redirect(url.toString());
  res.cookies.set("kiraye_dstate",state,{httpOnly:true,secure:true,sameSite:"lax",path:"/api/admin/backup/drive",maxAge:600});
  return res;
}
