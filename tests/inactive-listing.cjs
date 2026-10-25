const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
function load(file,modules={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:n=>modules[n],Date,AbortSignal});return exports;}
(async()=>{const lifecycle=load('lib/listing-lifecycle.ts');const now=Date.now(),id='11111111-1111-4111-8111-111111111111';let ad={id,status:'published',created_at:new Date(now-31*864e5).toISOString()};
assert(lifecycle.isListingExpired(ad,now));assert(!lifecycle.isListingExpired({...ad,created_at:new Date(now-29*864e5).toISOString()},now));assert(lifecycle.isListingExpired({...ad,expires_at:new Date(now).toISOString()},now));
const client={from:()=>{const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:ad,error:null})};return q;},rpc:()=>({abortSignal:async()=>({data:null,error:null})})};
const {getPublicListing}=load('lib/public-listing.ts',{'react':{cache:f=>f},'./supabase':{publicSupabase:client},'./marketplace':{examples:[]},'./listing-lifecycle':lifecycle});
assert.equal((await getPublicListing(id)).item,null);ad={...ad,status:'archived',created_at:new Date().toISOString()};assert.equal((await getPublicListing(id)).item,null);ad={...ad,status:'published'};assert.equal((await getPublicListing(id)).item.id,id);console.log('PASS thirty-day boundary, legacy expiry fallback and public archived/expired exclusion');
})().catch(e=>{console.error(e);process.exit(1)});
