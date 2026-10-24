// This simulates missing browser APIs, not a claim of testing real iPhone Safari.
const assert=require('node:assert/strict');const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
const ctx=await b.newContext({viewport:{width:375,height:667},isMobile:true,hasTouch:true});const p=await ctx.newPage();const errors=[];let signup;
p.on('pageerror',e=>errors.push(e.message));
await ctx.addInitScript(()=>{
 for(const [object,key] of [[Object,'hasOwn'],[Array.prototype,'at'],[String.prototype,'at'],[Promise,'any'],[Promise,'withResolvers'],[URL,'canParse'],[AbortSignal,'timeout'],[window.crypto,'randomUUID']]) Object.defineProperty(object,key,{value:undefined,configurable:true,writable:true});
 Object.defineProperty(navigator,'locks',{value:undefined,configurable:true});
 window.__missingAtStartup=typeof Object.hasOwn==='undefined'&&typeof AbortSignal.timeout==='undefined';
});
await p.route('https://*.supabase.co/**',r=>{
 const req=r.request();const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'};
 if(req.method()==='OPTIONS')return r.fulfill({status:204,headers});
 let body={external:{email:true}};
 if(req.url().includes('/signup')){signup=req.postDataJSON();body={user:{id:'11111111-1111-4111-8111-111111111111',email:signup.email,identities:[{id:'fixture'}]},session:null};}
 return r.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify(body)});
});
await p.goto((process.env.TEST_BASE_URL||'http://127.0.0.1:3013')+'/login?mode=signup');
await p.getByLabel('Ad və soyad',{exact:true}).fill('Sınaq İstifadəçi');await p.getByLabel('Telefon nömrəsi',{exact:true}).fill('0501234567');
await p.getByLabel('E-poçt',{exact:true}).fill('legacy-test@');await p.getByRole('button',{name:'@gmail.com',exact:true}).tap();
await p.getByLabel('Şifrə',{exact:true}).fill('test-only-password-18');await p.getByRole('button',{name:'Şifrəni göstər',exact:true}).tap();assert.equal(await p.locator('input[name=password]').getAttribute('type'),'text');
assert.equal(await p.evaluate(()=>window.__missingAtStartup),true);
assert.equal(await p.evaluate(()=>[typeof Object.hasOwn,typeof Array.prototype.at,typeof AbortSignal.timeout,typeof crypto.randomUUID].join(',')),'function,function,function,function');
await p.getByRole('button',{name:'Güclü şifrə yarat',exact:true}).tap();
const generated=await p.locator('input[name=password]').inputValue();assert.equal(generated.length,20);assert(/[A-Z]/.test(generated)&&/[a-z]/.test(generated)&&/[0-9]/.test(generated)&&/[^A-Za-z0-9]/.test(generated));
assert.equal(await p.locator('input[name=password]').getAttribute('type'),'text');
await p.getByRole('button',{name:'Hesab yarat',exact:true}).tap();await p.getByRole('heading',{name:'E-poçtunu yoxla',exact:true}).waitFor();assert.equal(signup.email,'legacy-test@gmail.com');assert.equal(signup.password,generated);assert.deepEqual(errors,[]);
console.log('PASS signup typing, completion, password visibility and submission with older-browser APIs initially missing');await ctx.close();
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
