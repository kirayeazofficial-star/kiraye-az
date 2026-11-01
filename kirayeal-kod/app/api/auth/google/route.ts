import {NextResponse} from "next/server";
import {randomBytes} from "node:crypto";
import {publicSiteUrl} from "../../../../lib/site-url";

export const dynamic="force-dynamic";
export async function GET(){
  const clientId=process.env.GOOGLE_CLIENT_ID?.trim(),site=publicSiteUrl();
  if(!clientId||!process.env.GOOGLE_CLIENT_SECRET)return NextResponse.redirect(`${site}/login?google=off`);
  const state=randomBytes(24).toString("hex");
  const url=new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search=new URLSearchParams({client_id:clientId,redirect_uri:`${site}/api/auth/google/callback`,response_type:"code",scope:"openid email profile",state,prompt:"select_account"}).toString();
  const res=NextResponse.redirect(url.toString());
  res.cookies.set("kiraye_gstate",state,{httpOnly:true,secure:true,sameSite:"lax",path:"/api/auth/google",maxAge:600});
  return res;
}
