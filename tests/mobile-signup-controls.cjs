// All authentication requests are mocked: no real users or email messages.
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try {
 for(const width of [320,390,1440]) {
 const context=await browser.newContext({viewport:{width,height:900},hasTouch:true,isMobile:width<720});
 const page=await context.newPage(); const errors=[];let signup;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://*.supabase.co/**',async route=>{
 const r=route.request();const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'};
 if(r.method()==='OPTIONS')return route.fulfill({status:204,headers});
 if(r.url().includes('/signup')) {signup=r.postDataJSON(); return route.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify({user:{id:'11111111-1111-4111-8111-111111111111',email:signup.email,identities:[{id:'test'}]},session:null})});}
 return route.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify({external:{email:true,google:false}})});
 });
 await page.goto((process.env.TEST_BASE_URL||'http://127.0.0.1:3013')+'/login?mode=signup');
 const email=page.getByLabel('E-poçt',{exact:true});await email.fill('mobile-test@');
 await page.getByRole('button',{name:'@gmail.com',exact:true}).click();assert.equal(await email.inputValue(),'mobile-test@gmail.com');
 const password=page.getByRole('textbox',{name:'Şifrə',exact:true});
 await page.locator('input[name=password]').fill('Test-only-password-29');
 await page.getByRole('button',{name:'Şifrəni göstər',exact:true}).click();assert.equal(await password.getAttribute('type'),'text');
 await page.getByRole('button',{name:'Şifrəni gizlət',exact:true}).click();assert.equal(await page.locator('input[name=password]').getAttribute('type'),'password');
 await page.getByRole('button',{name:'Hesab yarat',exact:true}).click();
 await page.getByRole('heading',{name:'E-poçtunu yoxla',exact:true}).waitFor();
 assert.equal(signup.email,'mobile-test@gmail.com');assert.equal(signup.password,'Test-only-password-29');assert.deepEqual(errors,[]);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 console.log('PASS mobile signup, email completion, show/hide password, submission and confirmation at',width);
 await context.close();
 }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
