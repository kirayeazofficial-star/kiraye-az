import {open,readFile,stat,writeFile} from "node:fs/promises";
import {makeThumbnail,queuedThumbnail} from "../../../../../lib/host/thumbnail";
import path from "node:path";
import {NextResponse} from "next/server";

const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,fileName=/^(?:branded-v3-|share-|thumb-)?[0-9a-f-]{36}\.(jpg|mp4|webm)$/i;
const types:Record<string,string>={jpg:"image/jpeg",mp4:"video/mp4",webm:"video/webm"};
const cache={"Cache-Control":"public, max-age=31536000, immutable","X-Content-Type-Options":"nosniff"};
export async function GET(request:Request,{params}:{params:Promise<{owner:string;file:string}>}){
  try{
    const {owner,file}=await params,root=process.env.KIRAYE_STORAGE_ROOT||"";
    const match=fileName.exec(file);
    if(!root||!uuid.test(owner)||!match)return new NextResponse(null,{status:404});
    const extension=match[1].toLowerCase(),location=path.join(root,owner,file);
    if(extension==="jpg"){
      // ?s=thumb (cards, lists) and ?s=view (listing page) use small copies saved at upload.
      // List thumbnails must never fall back to an unbounded original: old photos can be
      // small on disk but tens of megapixels when decoded by a phone.
      const size=new URL(request.url).searchParams.get("s"),plain=/^(?:thumb-|share-)/.test(file)?null:file;
      const tries=plain&&size==="view"?[`share-${plain}`]:[];
      if(plain&&size==="thumb"){
        // Older photos have no small copy yet: make it once from the 1200 px copy (or the original), keep it on
        // disk next to the photo, and send that. Phones then never load the 1–4 MB original in lists.
        const thumbPath=path.join(root,owner,`thumb-${plain}`);
        const ready=await readFile(thumbPath).catch(()=>null);
        if(ready)return new NextResponse(ready,{headers:{"Content-Type":types.jpg,...cache}});
        const made=await queuedThumbnail(thumbPath,async()=>{
          const source=await readFile(path.join(root,owner,`share-${plain}`)).catch(()=>null)||await readFile(location);
          const small=makeThumbnail(source);
          await writeFile(thumbPath,small,{mode:0o600,flag:"wx"}).catch(()=>{});
          return small;
        });
        if(made)return new NextResponse(made,{headers:{"Content-Type":types.jpg,...cache}});
        // The list can still show the listing and open its detail page. A failed thumbnail
        // must not silently make every list row decode a full-resolution photograph.
        return new NextResponse(null,{status:422,headers:{"Cache-Control":"no-store"}});
      }
      for(const name of tries){const found=await readFile(path.join(root,owner,name)).catch(()=>null);if(found)return new NextResponse(found,{headers:{"Content-Type":types.jpg,...cache}});}
      return new NextResponse(await readFile(location),{headers:{"Content-Type":types.jpg,...cache}});
    }
    // Videos are sent in parts: phones (Safari above all) only play a video that supports Range requests.
    const size=(await stat(location)).size;
    const range=/^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range")||"");
    let start=0,end=size-1;
    if(range){
      if(range[1])start=Number(range[1]);else if(range[2])start=Math.max(0,size-Number(range[2]));
      if(range[1]&&range[2])end=Math.min(Number(range[2]),size-1);
      if(start>end||start>=size)return new NextResponse(null,{status:416,headers:{"Content-Range":`bytes */${size}`}});
    }
    if(range)end=Math.min(end,start+4*1024*1024-1);
    const handle=await open(location,"r");
    try{
      const body=Buffer.alloc(end-start+1);await handle.read(body,0,body.length,start);
      const partial=!!range;
      return new NextResponse(body,{status:partial?206:200,headers:{"Content-Type":types[extension],"Accept-Ranges":"bytes","Content-Length":String(body.length),...(partial?{"Content-Range":`bytes ${start}-${end}/${size}`}:{}),...cache}});
    }finally{await handle.close();}
  }catch{return new NextResponse(null,{status:404});}
}
