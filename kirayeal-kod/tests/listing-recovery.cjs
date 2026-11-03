// Real PostgreSQL route tests, isolated by an outer rollback. Never run against a hosting database.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {randomUUID}=require('node:crypto'),{Client}=require('pg'),{NextRequest}=require('next/server');
function load(file,imports={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:name=>name in imports?imports[name]:require(name),process,console,Buffer,URL});return exports;}
(async()=>{
 assert.ok(['127.0.0.1','localhost'].includes(process.env.KIRAYE_DB_HOST)&&process.env.KIRAYE_DB_NAME==='kiraye_dev','Requires an isolated local kiraye_dev database');
 const db=new Client({host:process.env.KIRAYE_DB_HOST,port:Number(process.env.KIRAYE_DB_PORT),database:process.env.KIRAYE_DB_NAME,user:process.env.KIRAYE_DB_USER,password:process.env.KIRAYE_DB_PASSWORD});
 await db.connect();await db.query('BEGIN');
 try{
  let actor=null,remaining=0,failAudit=false;
  const connection={query:async(sql,args)=>{if(failAudit&&sql.includes('insert into public.moderation_events'))throw Error('Simulated audit failure');return db.query(sql,args)}};
  const host={hostQuery:async(sql,args)=>(await connection.query(sql,args)).rows,hostTransaction:async task=>{await db.query('SAVEPOINT route_call');try{const result=await task(connection);await db.query('RELEASE SAVEPOINT route_call');return result}catch(e){await db.query('ROLLBACK TO SAVEPOINT route_call');throw e}}};
  const session={currentUser:async()=>actor};
  const staff=load('lib/host/staff.ts',{'server-only':{},'./db':host,'./session':session});
  const common={'next/server':require('next/server'),'../../../../lib/host/db':host,'../../../../lib/host/session':session,'../../../../lib/host/staff':staff,'../../../../lib/server-request':load('lib/server-request.ts'),'../../../../lib/host/limits':{freeLimit:async()=>({remaining})}};
  const restore=load('app/api/listings/restore/route.ts',common).POST,submit=load('app/api/listings/submit/route.ts',common).POST;
  const admin=load('app/api/admin/route.ts',{'next/server':require('next/server'),'../../../lib/admin-list-page':{ADMIN_LIST_PAGE_SIZE:20},'../../../lib/host/db':host,'../../../lib/host/session':session,'../../../lib/host/notify':{},'../../../lib/host/site-flags':{}}).POST;
  const users={};for(const role of ['leader','moderator','owner','other']){const id=randomUUID();users[role]={id,email:`${id}@example.invalid`};await db.query('insert into auth.users(id,email) values($1,$2)',[id,users[role].email]);await db.query('insert into public.profiles(id,role) values($1,$2)',[id,['leader','moderator'].includes(role)?'admin':'user']);if(['leader','moderator'].includes(role))await db.query('insert into public.staff_members(user_id,staff_role) values($1,$2)',[id,role]);}
  const fixture=async(owner='owner',status='pending',paid=true,deleted=false)=>{const id=randomUUID();await db.query(`insert into public.listings(id,owner_id,title,description,category,city,price,rental_period,contact,status,payment_required,paid_reason,deleted_at,first_published_at,expires_at) values($1,$2,'Local test','Local rollback fixture','property','Bakı',100,'monthly','0501234567',$3,$4,$5,$6,now()-interval '35 days',now()+interval '20 days')`,[id,users[owner].id,status,paid,paid?'repeat':null,deleted?new Date():null]);return id};
  const row=async id=>(await db.query('select * from public.listings where id=$1',[id])).rows[0];
  const origin=new URL(process.env.NEXT_PUBLIC_SITE_URL||'https://kirayeal.az').origin;
  const call=async(route,id,extra={})=>{const response=await route(new NextRequest(origin+'/api/test',{method:'POST',headers:{'Content-Type':'application/json',origin},body:JSON.stringify({id,...extra})}));return {...await response.json(),httpStatus:response.status}};
  actor=users.leader;
  for(const owner of ['leader','owner']){
   const id=await fixture(owner,'archived',true,true);assert.equal((await call(restore,id)).httpStatus,200);const restored=await row(id);assert.equal(restored.status,'published');assert.equal(restored.payment_required,false);assert.equal(restored.paid_reason,null);assert.equal(restored.deleted_at,null);assert.ok(+restored.expires_at>Date.now()+29*86400000);
   const event=(await db.query('select * from public.moderation_events where listing_id=$1',[id])).rows[0];assert.equal(event.owner_id,users[owner].id);assert.equal(event.actor_id,actor.id);assert.equal(event.actor_kind,'admin');assert.equal((await call(submit,id)).already_submitted,true);assert.equal((await row(id)).status,'published');
  }
  const legacy=await fixture('owner','published');assert.equal((await call(submit,legacy)).httpStatus,200);assert.equal((await row(legacy)).status,'published');assert.equal((await row(legacy)).payment_required,false);
  const waiting=await fixture();assert.equal((await call(submit,waiting)).httpStatus,200);assert.equal((await row(waiting)).status,'pending');assert.equal((await row(waiting)).payment_required,false);assert.equal((await call(submit,waiting)).already_submitted,true);
  const failed=await fixture('owner','archived',true,true);failAudit=true;assert.equal((await call(restore,failed)).httpStatus,503);failAudit=false;assert.equal((await row(failed)).payment_required,true);assert.equal((await row(failed)).status,'archived');
  console.log('PASS leader restores own/other listings without payment holds, repairs legacy state, retries safely, and rolls back on audit failure');
  for(const role of ['owner','moderator']){
   actor=users[role];const expired=await fixture(role,'expired');assert.equal((await call(restore,expired,{leader:true})).httpStatus,402);assert.equal((await row(expired)).status,'expired');
   const own=await fixture(role);assert.equal((await call(submit,own,{leader:true})).httpStatus,429);assert.equal((await row(own)).payment_required,true);
   const foreign=await fixture('other');assert.equal((await call(submit,foreign)).httpStatus,409);assert.equal((await row(foreign)).payment_required,true);
  }
  actor=users.owner;remaining=1;const free=await fixture();await db.query('update public.listings set paid_reason=null where id=$1',[free]);assert.equal((await call(submit,free)).httpStatus,200);assert.equal((await row(free)).payment_required,false);
  console.log('PASS ordinary users and moderators cannot bypass payment or ownership; an available free slot still works');
  const approval=await fixture('owner');actor=users.moderator;assert.equal((await call(admin,approval,{action:'moderate',from:'pending',status:'published'})).httpStatus,409);assert.equal((await row(approval)).payment_required,true);actor=users.leader;assert.equal((await call(admin,approval,{action:'moderate',from:'pending',status:'published'})).httpStatus,200);assert.equal((await row(approval)).payment_required,false);assert.equal((await row(approval)).paid_reason,null);
  console.log('PASS leader approval clears payment holds; moderator approval cannot waive payment');
 }finally{await db.query('ROLLBACK');await db.end()}
})().catch(e=>{console.error(e);process.exitCode=1});
