// Isolated Auth/PostgREST fixtures; no real login or database writes.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{for(const width of [320,390]){const p=await b.newPage({viewport:{width,height:844}}),base=process.env.TEST_BASE_URL||'http://127.0.0.1:3242';
 const id='11111111-1111-4111-8111-111111111111',user={id,email:'fixture@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{full_name:'Test User',contact_phone:'+994501234567'}};
 await p.route('https://*.supabase.co/**',r=>{const u=new URL(r.request().url()),headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*','content-range':'*/0','access-control-expose-headers':'content-range'};if(r.request().method()==='OPTIONS')return r.fulfill({status:204,headers});let body=[];if(u.pathname.endsWith('/user'))body=user;else if(u.pathname.includes('/profiles'))body={id,role:'user',display_name:'Test User',phone:'+994501234567'};return r.fulfill({status:200,headers,json:body});});
 await p.goto(base);await p.locator('.mobileNav a[href="/login"]').waitFor();
 const token=Buffer.from('{}').toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:id,aud:'authenticated',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.fixture';
 await p.evaluate(session=>localStorage.setItem('sb-browser-test-auth-token',JSON.stringify(session)),{access_token:token,refresh_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user});
 for(const [route,label] of [['/profile','Hesabım'],['/','Ana səhifə'],['/?favorites=1#elanlar','Seçilmişlər'],['/new','Elan yerləşdir']]){
 await p.goto(base+route);await p.locator('.signedAccountLink').waitFor({state:'attached'});const selected=p.locator('.mobileNav a[aria-current=page]');await selected.waitFor();assert.equal(await selected.count(),1);assert((await selected.innerText()).includes(label));assert.equal(await p.locator('.mobileSignupLink').count(),0);if(route!='/new')assert.equal(await p.locator('.mobilePublish').evaluate(e=>getComputedStyle(e).color),'rgb(101, 117, 109)');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);console.log('PASS current mobile section and hidden signed-in signup',width,route);
 }
 await p.close();
 }}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
