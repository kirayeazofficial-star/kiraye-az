import "server-only";
import {hostQuery} from "./db";
import {FREE_LISTING_LIMIT,LIMIT_WINDOW_DAYS} from "../listing-limit";

export type LimitState={category:string;limit:number;used:number;pending:number;remaining:number;next_free_at:string|null};

// Used = free placements in the window; pending = new listings awaiting review (they take a slot once approved).
export async function freeLimits(ownerId:string,category?:string):Promise<LimitState[]>{
  const rows=await hostQuery<{category:string;used:string;oldest:string|null;pending:string}>(`
    with placed as (
      select category,count(*) used,min(placed_at) oldest from public.listing_placements
       where owner_id=$1 and kind='free' and placed_at>now()-make_interval(days=>$2::int) group by category),
    waiting as (
      select category,count(*) pending from public.listings
       where owner_id=$1 and status='pending' and first_published_at is null group by category)
    select coalesce(p.category,w.category) category,coalesce(p.used,0)::text used,p.oldest::text oldest,coalesce(w.pending,0)::text pending
      from placed p full join waiting w on w.category=p.category`,[ownerId,LIMIT_WINDOW_DAYS]);
  const states=rows.map(row=>{
    const used=Number(row.used),pending=Number(row.pending);
    const next=row.oldest?new Date(Date.parse(row.oldest)+LIMIT_WINDOW_DAYS*86400000).toISOString():null;
    return{category:row.category,limit:FREE_LISTING_LIMIT,used,pending,remaining:Math.max(0,FREE_LISTING_LIMIT-used-pending),next_free_at:used+pending>=FREE_LISTING_LIMIT?next:null};
  });
  return category?states.filter(state=>state.category===category):states;
}
export async function freeLimit(ownerId:string,category:string):Promise<LimitState>{
  return(await freeLimits(ownerId,category))[0]||{category,limit:FREE_LISTING_LIMIT,used:0,pending:0,remaining:FREE_LISTING_LIMIT,next_free_at:null};
}
