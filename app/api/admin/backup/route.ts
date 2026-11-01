import {NextRequest,NextResponse} from "next/server";
import {access} from "node:fs/promises";
import {join} from "node:path";
import {sameOrigin} from "../../../../lib/server-request";
import {hostQuery} from "../../../../lib/host/db";
import {currentUser} from "../../../../lib/host/session";
import {isLeader} from "../../../../lib/host/staff";

export const dynamic="force-dynamic";
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});
// The backup script sits next to app.js (copied there by every deploy); a cron job checks it every 10 minutes.
const script=()=>process.env.KIRAYE_APP_DIR?join(process.env.KIRAYE_APP_DIR,"backup-to-drive.mjs"):"";
async function leader(){const user=await currentUser();return user&&await isLeader(user)?user:null;}

export async function GET(){
  try{
    if(!await leader())return reply({error:"FORBIDDEN"},403);
    const [settings,runs,files,code]=await Promise.all([
      hostQuery<{drive_email:string|null;connected_at:string|null;root_folder:string|null;connected:boolean}>(`select drive_email,connected_at,root_folder,drive_token is not null as connected from public.backup_settings where id=1`),
      hostQuery(`select id,trigger,started_at,finished_at,heartbeat_at,ok,db_file,db_bytes,db_rows,files_new,files_bytes,error,(finished_at is null and coalesce(heartbeat_at,started_at)<now()-interval '10 minutes') as stalled from public.backup_runs order by started_at desc limit 6`),
      hostQuery<{count:string;bytes:string}>(`select count(*)::text as count,coalesce(sum(size),0)::text as bytes from public.backup_files where path not like 'kod/%'`),
      hostQuery<{path:string;size:string;uploaded_at:string}>(`select path,size::text as size,uploaded_at::text as uploaded_at from public.backup_files where path like 'kod/%' order by uploaded_at desc limit 1`),
    ]);
    const ready=!!script()&&await access(script()).then(()=>true,()=>false);
    return reply({connected:!!settings[0]?.connected,email:settings[0]?.drive_email||"",connected_at:settings[0]?.connected_at||null,folder:settings[0]?.root_folder||null,runs,files:{count:Number(files[0]?.count||0),bytes:Number(files[0]?.bytes||0)},code:code[0]?{version:code[0].path.slice(4),bytes:Number(code[0].size),at:code[0].uploaded_at}:null,ready,google:!!(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET)});
  }catch{return reply({error:"BACKUP_UNAVAILABLE"},503);}
}

export async function POST(request:NextRequest){
  if(!sameOrigin(request))return reply({error:"FORBIDDEN"},403);
  try{
    if(!await leader())return reply({error:"FORBIDDEN"},403);
    const {action}=await request.json() as {action?:string};
    if(action==="disconnect"){
      await hostQuery(`update public.backup_settings set drive_token=null,root_folder=null,db_folder=null,files_folder=null,updated_at=now() where id=1`);
      await hostQuery(`delete from public.backup_files`);
      return reply({ok:true});
    }
    return reply({error:"INVALID_ACTION"},400);
  }catch{return reply({error:"BACKUP_UNAVAILABLE"},503);}
}
