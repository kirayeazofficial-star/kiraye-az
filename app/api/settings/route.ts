import {NextResponse} from "next/server";
import {currentUser} from "../../../lib/host/session";
import {isLeader} from "../../../lib/host/staff";
import {paymentsEnabled} from "../../../lib/host/site-flags";

export const dynamic="force-dynamic";
// Public site switches for the pages: are paid services on, and is the visitor the leader (free use).
export async function GET(){
  const [payments,user]=await Promise.all([paymentsEnabled(),currentUser().catch(()=>null)]);
  const leader=user?await isLeader(user).catch(()=>false):false;
  return NextResponse.json({payments,leader},{headers:{"Cache-Control":"no-store"}});
}
