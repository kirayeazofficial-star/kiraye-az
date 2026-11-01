import "server-only";
import {hostQuery} from "./db";
import {FREE_LISTING_LIMIT,LIMIT_WINDOW_DAYS} from "../listing-limit";
import {activeStore} from "./stores";
import {limitRules} from "./limit-rules";
import {categories} from "../marketplace";
import {groupOf,limitGroups} from "../limit-rules";

export type LimitState={category:string;limit:number;used:number;pending:number;remaining:number;next_free_at:string|null};

// Used = free placements in the window; pending = new listings awaiting review (they take a slot once approved).
// `phone` (the listing's contact number): free places used from other accounts with the same number count too,
// so a second account does not give a second free listing.
const phoneDigits=(value:string)=>value.replace(/\D/g,"").slice(-9);
export async function freeLimits(ownerId:string,category?:string,phone=""):Promise<LimitState[]>{
  const digits=phoneDigits(phone);
  const sameOwner=`(x.owner_id=$1 or ($3<>'' and right(regexp_replace(coalesce(l.contact,''),'\\D','','g'),9)=$3))`;
  const rows=await hostQuery<{category:string;used:string;oldest:string|null;pending:string}>(`
    with placed as (
      select x.category,count(*) used,min(x.placed_at) oldest from public.listing_placements x left join public.listings l on l.id=x.listing_id
       where ${sameOwner} and x.kind='free' and x.placed_at>now()-make_interval(days=>$2::int) group by x.category),
    waiting as (
      select x.category,count(*) pending from public.listings x left join public.listings l on l.id=x.id
       where ${sameOwner} and x.status='pending' and x.first_published_at is null and not coalesce(x.payment_required,false) group by x.category)
    select coalesce(p.category,w.category) category,coalesce(p.used,0)::text used,p.oldest::text oldest,coalesce(w.pending,0)::text pending
      from placed p full join waiting w on w.category=p.category`,[ownerId,LIMIT_WINDOW_DAYS,digits.length===9?digits:""]);
  // An active store raises the limit to its package (null = no limit).
  const store=await activeStore(ownerId);
  const rules=store?null:await limitRules();
  if(rules?.enabled){
    // Group rule: one window per group of categories; "paid" categories never have a free place.
    const byCategory=new Map(rows.map(row=>[row.category,row]));
    const states=categories.map(({id})=>{
      const paid=rules.paid.includes(id),group=limitGroups.find(item=>item.id===groupOf(id))!;
      const members=group.categories.filter(cat=>!rules.paid.includes(cat)).map(cat=>byCategory.get(cat)).filter(Boolean) as typeof rows;
      const used=paid?Number(byCategory.get(id)?.used||0):members.reduce((sum,row)=>sum+Number(row.used),0);
      const pending=paid?Number(byCategory.get(id)?.pending||0):members.reduce((sum,row)=>sum+Number(row.pending),0);
      const oldest=members.map(row=>row.oldest).filter(Boolean).sort()[0]||null;
      const limit=paid?0:rules.free[group.id];
      const next=!paid&&oldest?new Date(Date.parse(oldest)+LIMIT_WINDOW_DAYS*86400000).toISOString():null;
      return{category:id,limit,used,pending,remaining:Math.max(0,limit-used-pending),next_free_at:!paid&&used+pending>=limit?next:null};
    });
    return category?states.filter(state=>state.category===category):states;
  }
  const LIMIT=store?(store.listing_limit??100000):FREE_LISTING_LIMIT;
  const states=rows.map(row=>{
    const used=Number(row.used),pending=Number(row.pending);
    const next=row.oldest?new Date(Date.parse(row.oldest)+LIMIT_WINDOW_DAYS*86400000).toISOString():null;
    return{category:row.category,limit:LIMIT,used,pending,remaining:Math.max(0,LIMIT-used-pending),next_free_at:used+pending>=LIMIT?next:null};
  });
  return category?states.filter(state=>state.category===category):states;
}
export async function freeLimit(ownerId:string,category:string,phone=""):Promise<LimitState>{
  const found=(await freeLimits(ownerId,category,phone))[0];if(found)return found;
  const store=await activeStore(ownerId),limit=store?(store.listing_limit??100000):FREE_LISTING_LIMIT;
  return{category,limit,used:0,pending:0,remaining:limit,next_free_at:null};
}
