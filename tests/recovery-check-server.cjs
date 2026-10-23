const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const code=ts.transpileModule(fs.readFileSync('app/api/auth/recovery-check/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
function load(env,upstream){const exports={};vm.runInNewContext(code,{exports,require,process:{env},Response,Request,URL,AbortSignal,Buffer,fetch:upstream});return exports.POST;}
const req=(body,origin='http://localhost')=>new Request('http://localhost/api/auth/recovery-check',{method:'POST',headers:{origin,'Content-Type':'application/json','x-forwarded-for':'192.0.2.10'},body:JSON.stringify(body)});
(async()=>{
let post=load({},()=>{throw Error('must not call upstream without credentials')});
assert.equal((await post(req({email:'test@example.invalid'}))).status,503);
assert.equal((await post(req({email:'bad'}))).status,400);
assert.equal((await post(req({email:'a'.repeat(2000)+'@example.invalid'}))).status,400);
assert.equal((await post(req({email:'test@example.invalid'},'https://other.invalid'))).status,403);
const proxyRequest=new Request('http://internal-host/api/auth/recovery-check',{method:'POST',headers:{origin:'https://public.example.invalid',host:'public.example.invalid','x-forwarded-proto':'https'},body:JSON.stringify({email:'test@example.invalid'})});
assert.equal((await post(proxyRequest)).status,503);
const env={NEXT_PUBLIC_SUPABASE_URL:'https://browser-test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'fixture-secret-not-real'};
for(const exists of [true,false]){
post=load(env,async(url,init)=>{assert(url.endsWith('/rpc/recovery_email_exists'));assert.equal(init.headers.Authorization,'Bearer fixture-secret-not-real');const args=JSON.parse(init.body);assert.equal(args.p_email,'test@example.invalid');assert.equal(args.p_client_key.length,64);assert(!args.p_client_key.includes('192.0.2'));return Response.json(exists)});
const response=await post(req({email:'TEST@example.invalid'}));const body=await response.text();assert.equal(JSON.parse(body).exists,exists);assert(!body.includes('fixture-secret'));
}
post=load(env,async()=>Response.json({code:'PR429',message:'private detail'},{status:400}));const rate=await post(req({email:'test@example.invalid'}));assert.equal(rate.status,429);assert(!(await rate.text()).includes('private detail'));
console.log('PASS server recovery lookup validation, origin, missing configuration, private credentials, existence and throttling');
})().catch(e=>{console.error(e);process.exit(1)});
