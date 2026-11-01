import {NextRequest,NextResponse} from "next/server";
import {spawn} from "node:child_process";
import {existsSync} from "node:fs";
import {join} from "node:path";
import {cookies} from "next/headers";
import {hostQuery} from "../../../../../../lib/host/db";
import {currentUser} from "../../../../../../lib/host/session";
import {isLeader} from "../../../../../../lib/host/staff";
import {sealSecret} from "../../../../../../lib/host/backup-secret";
import {publicSiteUrl} from "../../../../../../lib/site-url";

export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
  const site=publicSiteUrl(),back=(result:string)=>NextResponse.redirect(`${site}/admin?section=backup&backup=${result}`);
  try{
    const user=await currentUser();if(!user||!await isLeader(user))return NextResponse.redirect(`${site}/admin`);
    const params=request.nextUrl.searchParams,code=params.get("code")||"",state=params.get("state")||"";
    const jar=await cookies(),saved=jar.get("kiraye_dstate")?.value||"";
    jar.set("kiraye_dstate","",{path:"/api/admin/backup/drive",maxAge:0});
    if(!code||!state||state!==saved)return back("error");
    const token=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({code,client_id:process.env.GOOGLE_CLIENT_ID||"",client_secret:process.env.GOOGLE_CLIENT_SECRET||"",redirect_uri:`${site}/api/admin/backup/drive/callback`,grant_type:"authorization_code"})});
    if(!token.ok)return back("error");
    const data=await token.json() as {access_token?:string;refresh_token?:string;scope?:string};
    if(!data.refresh_token||!String(data.scope||"").includes("drive.file"))return back("no-access");
    const info=await fetch("https://openidconnect.googleapis.com/v1/userinfo",{headers:{Authorization:`Bearer ${data.access_token}`}});
    const email=info.ok?String((await info.json() as {email?:string}).email||""):"";
    // A new connection starts with fresh folders; files already sent stay on the old Drive.
    await hostQuery(`insert into public.backup_settings(id,drive_token,drive_email,root_folder,db_folder,files_folder,connected_by,connected_at,updated_at) values(1,$1,$2,null,null,null,$3,now(),now())
      on conflict(id) do update set drive_token=excluded.drive_token,drive_email=excluded.drive_email,root_folder=null,db_folder=null,files_folder=null,connected_by=excluded.connected_by,connected_at=now(),updated_at=now()`,[sealSecret(data.refresh_token),email,user.id]);
    await hostQuery(`delete from public.backup_files`);
    // The first copy goes to Drive right away; after that the nightly copy (03:00) keeps it up to date.
    const script=process.env.KIRAYE_APP_DIR?join(process.env.KIRAYE_APP_DIR,"backup-to-drive.mjs"):"";
    // If the hosting stops this process, the 10-minute cron check picks the request up.
    await hostQuery(`update public.backup_settings set run_requested=true where id=1`);
    if(script&&existsSync(script))spawn(process.execPath,[script,"now"],{cwd:process.env.KIRAYE_APP_DIR,detached:true,stdio:"ignore",env:process.env}).unref();
    return back("connected");
  }catch(error){console.error("drive connect failed:",(error as Error).message);return back("error");}
}
