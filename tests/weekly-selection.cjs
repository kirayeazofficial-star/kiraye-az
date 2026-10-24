// Local fixtures: no live account or database writes.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
const page=await browser.newPage({viewport:{width:390,height:844}}),base=process.env.TEST_BASE_URL||'http://127.0.0.1:3233',owner='11111111-1111-4111-8111-111111111111';
const user={id:owner,email:'fixture@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{}};
let readinessRequests=0;
await page.route('https://*.supabase.co/**',r=>{const u=new URL(r.request().url()),headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'};if(r.request().method()==='OPTIONS')return r.fulfill({status:204,headers});if(u.pathname.endsWith('/rental_features_ready')){readinessRequests++;return r.fulfill({status:404,headers,json:{code:'PGRST202'}});}let body=[];if(u.pathname.endsWith('/user'))body=user;else if(u.pathname.includes('/profiles'))body={id:owner,role:'user'};return r.fulfill({status:200,headers,json:body});});
await page.goto(base);const token=Buffer.from(JSON.stringify({alg:'HS256'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:owner,aud:'authenticated',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.fixture';
await page.evaluate(session=>localStorage.setItem('sb-browser-test-auth-token',JSON.stringify(session)),{access_token:token,refresh_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user});
await page.goto(base+'/new');await page.getByLabel('Kateqoriya',{exact:true}).waitFor();
const categories=await page.getByLabel('Kateqoriya',{exact:true}).locator('option').evaluateAll(els=>els.map(e=>e.value).filter(Boolean));
for(const category of categories){await page.getByLabel('Kateqoriya',{exact:true}).selectOption(category);await page.getByRole('button',{name:/^Davam et/}).click();const weekly=page.locator('input[name=rental_period][value=weekly]');assert(await weekly.isEnabled());await weekly.check();assert(await weekly.isChecked());await page.locator('.publishSteps button').first().click();console.log('PASS weekly selection',category);}
const id='22222222-2222-4222-8222-222222222222';
await page.route('https://*.supabase.co/rest/v1/listings*',r=>r.fulfill({status:200,headers:{'access-control-allow-origin':'*'},json:{id,owner_id:owner,category:'property',title:'Sınaq mənzili',city:'Bakı',price:500,rental_period:'monthly',status:'published',description:'Kirayə üçün mənzil.',contact:'+994501234567',images:[],created_at:new Date().toISOString(),attributes:{kind:'Mənzil'}}}));
await page.goto(base+'/edit/'+id);await page.getByLabel('Kateqoriya',{exact:true}).waitFor();await page.getByRole('button',{name:/^Davam et/}).click();assert(await page.locator('input[name=rental_period][value=monthly]').isChecked());await page.locator('input[name=rental_period][value=weekly]').check();assert(await page.locator('input[name=rental_period][value=weekly]').isChecked());console.log('PASS existing monthly listing can change to weekly');
assert.equal(readinessRequests,0);
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
