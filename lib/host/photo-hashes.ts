import "server-only";
import {hostQuery} from "./db";

const REPEAT_DAYS=90,MAX_DISTANCE=8;
const MASK=BigInt(0xffff),ONE=BigInt(1),ZERO=BigInt(0);
const parts=(hash:bigint)=>[0,1,2,3].map(i=>Number((BigInt.asUintN(64,hash)>>BigInt(i*16))&MASK));
const distance=(a:bigint,b:bigint)=>{let x=BigInt.asUintN(64,a^b),n=0;while(x>ZERO){n+=Number(x&ONE);x>>=ONE;}return n;};

export async function savePhotoHash(path:string,ownerId:string,hex:string){
  if(!/^[0-9a-f]{16}$/i.test(hex))return;
  const hash=BigInt.asIntN(64,BigInt(`0x${hex}`)),[b0,b1,b2,b3]=parts(hash);
  await hostQuery(`insert into public.photo_hashes(path,owner_id,hash,b0,b1,b2,b3) values($1,$2,$3,$4,$5,$6,$7) on conflict(path) do nothing`,[path,ownerId,hash.toString(),b0,b1,b2,b3]);
}

export type PhotoMatch={listing_id:string;listing_no:string|null;owner_id:string;title:string};
// Listings from the last 90 days (any status, deleted ones too) that use the same photo as one of `images`.
export async function photoMatches(images:string[],exceptId:string|null):Promise<PhotoMatch[]>{
  if(!images.length)return[];
  const mine=await hostQuery<{path:string;hash:string}>(`select path,hash::text from public.photo_hashes where path=any($1::text[])`,[images]).catch(()=>[]);
  if(!mine.length)return[];
  const found=new Set<string>();
  for(const photo of mine){
    const hash=BigInt(photo.hash),[b0,b1,b2,b3]=parts(hash);
    const near=await hostQuery<{path:string;hash:string}>(`select path,hash::text from public.photo_hashes where path<>all($1::text[]) and created_at>now()-make_interval(days=>$6::int) and (b0=$2 or b1=$3 or b2=$4 or b3=$5) limit 200`,[images,b0,b1,b2,b3,REPEAT_DAYS]);
    for(const other of near)if(distance(hash,BigInt(other.hash))<=MAX_DISTANCE)found.add(other.path);
  }
  if(!found.size)return[];
  return hostQuery<PhotoMatch>(`select id listing_id,listing_no::text,owner_id,title from public.listings where images&&$1::text[] and ($2::uuid is null or id<>$2) and created_at>now()-make_interval(days=>$3::int) order by created_at desc limit 5`,[[...found],exceptId,REPEAT_DAYS]);
}
