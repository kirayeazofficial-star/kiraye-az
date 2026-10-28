import {readFile} from "node:fs/promises";
import path from "node:path";
import {NextResponse} from "next/server";

const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,fileName=/^(?:branded-v3-)?[0-9a-f-]{36}\.jpg$/i;
export async function GET(_request:Request,{params}:{params:Promise<{owner:string;file:string}>}){
  try{
    const {owner,file}=await params,root=process.env.KIRAYE_STORAGE_ROOT||"";
    if(!root||!uuid.test(owner)||!fileName.test(file))return new NextResponse(null,{status:404});
    const body=await readFile(path.join(root,owner,file));
    return new NextResponse(body,{headers:{"Content-Type":"image/jpeg","Cache-Control":"public, max-age=31536000, immutable","X-Content-Type-Options":"nosniff"}});
  }catch{return new NextResponse(null,{status:404});}
}
