const assert=require('node:assert/strict');const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{for(const scenario of ['missing','exists','unknown']){
const ctx=await b.newContext();const p=await ctx.newPage();let recoveries=0;
await p.route('**/api/auth/recovery-check',r=>r.fulfill({status:scenario==='unknown'?503:200,contentType:'application/json',body:JSON.stringify(scenario==='unknown'?{code:'recovery_check_unavailable'}:{exists:scenario==='exists'})}));
await p.route('https://*.supabase.co/**',r=>{const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'};if(r.request().method()==='OPTIONS')return r.fulfill({status:204,headers});if(r.request().url().includes('/recover'))recoveries++;return r.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify({external:{email:true}})});});
await p.goto((process.env.TEST_BASE_URL||'http://127.0.0.1:3013')+'/login?mode=reset');await p.getByLabel('E-poçt',{exact:true}).fill('account-test@example.invalid');await p.getByRole('button',{name:'6 rəqəmli kod göndər',exact:true}).click();
if(scenario==='missing'){await p.getByRole('status').filter({hasText:'Bu e-poçtla hesab tapılmadı'}).waitFor();assert.equal(recoveries,0);assert.equal(await p.locator('input[name=token]').count(),0);}
else if(scenario==='exists'){await p.getByRole('heading',{name:'Kodu daxil et',exact:true}).waitFor();assert.equal(recoveries,1);}
else{await p.getByRole('heading',{name:'Şifrə bərpası',exact:true}).waitFor();assert.equal(await p.getByLabel('6 rəqəmli kod',{exact:true}).count(),0);await p.getByRole('button',{name:'Bərpa məktubum gəlib — kodu daxil et',exact:true}).click();await p.getByLabel('6 rəqəmli kod',{exact:true}).waitFor();assert.equal(recoveries,1);}
console.log('PASS recovery account check',scenario);await ctx.close();}
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
