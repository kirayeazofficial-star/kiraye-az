// Local fixtures only. No live email, payment or database mutation.
const assert=require('node:assert/strict');const {chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3210';
try{const viewportWidth=process.env.TEST_DESKTOP?1440:390;const ctx=await browser.newContext({viewport:{width:viewportWidth,height:844},locale:'tr-TR'});const p=await ctx.newPage(),errors=[];p.on('pageerror',error=>errors.push(error.message));
const owner='11111111-1111-4111-8111-111111111111',id='22222222-2222-4222-8222-222222222222';const user={id:owner,email:'fixture@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{}};
const ad={id,owner_id:owner,category:'car',title:'Honda kirayəsi sınaq elanı',city:'Bakı',price:50,rental_period:'daily',status:'published',description:'Saz vəziyyətdə avtomobil münasib şərtlərlə kirayəyə verilir.',contact:'+994501234567',images:['/car.svg','/room.svg'],created_at:new Date().toISOString(),expires_at:new Date(Date.now()+29*864e5).toISOString(),min_days:1,deposit:0,attributes:{brand:'Honda',model:'Civic'}};
await p.route('https://*.supabase.co/**',r=>{const req=r.request(),url=new URL(req.url()),headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*','content-range':'0-0/1','access-control-expose-headers':'content-range'};let body=[];if(req.method()==='OPTIONS')return r.fulfill({status:204,headers});if(url.pathname.endsWith('/rpc/renew_listing')){ad.status='pending';body=null;}else if(url.pathname.endsWith('/user'))body=user;else if(url.pathname.includes('/profiles'))body={id:owner,role:'user'};else if(url.pathname.includes('/listings'))body=url.searchParams.get('id')?ad:[ad];return r.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify(body)});});
await p.goto(base);await p.locator('.listingCard').first().waitFor();
await p.screenshot({path:`/tmp/kiraye-home-first-screen-${viewportWidth}.png`});
if(viewportWidth>720){
 await p.locator('.header .accountLink').waitFor({state:'visible'});assert.equal(await p.locator('.header .accountLink').innerText(),'Daxil ol');
 assert.equal(await p.locator('.header .mobileSignupLink').isVisible(),false);
}else{
 const signup=p.locator('.header .mobileSignupLink');await signup.waitFor({state:'visible'});
 assert.equal(await signup.innerText(),'Qeydiyyatdan keç');assert.equal(await signup.getAttribute('href'),'/login?mode=signup');
 assert.equal(await p.locator('.header .accountLink').isVisible(),false);
 const login=p.locator('.mobileNav a[href="/login"]');await login.waitFor({state:'visible'});assert((await login.innerText()).includes('Daxil ol'));
 assert.equal(await p.locator('.mobileSearchLabel').innerText(),'Axtar');
}
assert.equal(await p.locator('.header .accountLink').count(),1);
assert.equal(await p.locator('.welcomeGuide,.header .signupLink').count(),0);
const cardBox=await p.locator('.listingCard').first().boundingBox();assert(cardBox.y<(viewportWidth>720?570:720),`Listings start too low: ${cardBox.y}`);

assert.equal(await p.locator('.listingCard .photoMark').count(),1);
await p.getByRole('button',{name:'Русский',exact:true}).click();await p.getByRole('heading',{name:'Что хочешь арендовать?',exact:true}).waitFor();assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
await p.getByRole('button',{name:'English',exact:true}).click();await p.getByRole('heading',{name:'What would you like to rent?',exact:true}).waitFor();assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
await p.reload();await p.getByRole('heading',{name:'What would you like to rent?',exact:true}).waitFor();
await p.getByRole('button',{name:'More filters',exact:true}).click();
await p.getByLabel('Filtr kateqoriyası',{exact:true}).selectOption('car');
await p.getByLabel('Transmission',{exact:true}).selectOption({label:'Automatic'});assert.equal(await p.getByLabel('Transmission',{exact:true}).inputValue(),'Avtomat');
await p.getByRole('button',{name:'Start date — təqvimi aç',exact:true}).click();
const calendar=await p.locator('.azCalendar').boundingBox();assert(calendar.x>=0 && calendar.x+calendar.width<=viewportWidth);
await p.getByRole('button',{name:'Təqvimi bağla',exact:true}).click();
if(viewportWidth<=720)await p.getByRole('button',{name:'Show listings',exact:true}).click();
assert.equal(await p.locator('html').getAttribute('lang'),'en');
await p.getByRole('button',{name:'Azərbaycanca',exact:true}).click();await p.getByRole('heading',{name:'Nə kirayələmək istəyirsən?',exact:true}).waitFor();
assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
await p.screenshot({path:`/tmp/kiraye-home-improvements-${viewportWidth}.png`,fullPage:true});
const jwt=Buffer.from(JSON.stringify({alg:'HS256'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:owner,aud:'authenticated',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.test';
await p.evaluate(session=>localStorage.setItem('sb-browser-test-auth-token',JSON.stringify(session)),{access_token:jwt,refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user});
await p.goto(base+'/profile/listings/'+id);await p.getByRole('heading',{name:ad.title,exact:true}).waitFor();
const call=p.getByRole('link',{name:/Zəng et/});assert((await call.innerText()).includes('+994 50 123 45 67'));assert(!(await call.innerText()).includes('*'));assert.equal(await call.getAttribute('href'),'tel:'+ad.contact);
assert.equal(await p.locator('.galleryStage .photoMark').count(),1);
await p.getByRole('button',{name:'Götürmə tarixi — təqvimi aç',exact:true}).click();
const future=new Date();future.setDate(future.getDate()+60);const months=['Yanvar','Fevral','Mart','Aprel','May','İyun','İyul','Avqust','Sentyabr','Oktyabr','Noyabr','Dekabr'];
await p.getByLabel('Ay seç',{exact:true}).selectOption(String(future.getMonth()));await p.getByLabel('İl seç',{exact:true}).selectOption(String(future.getFullYear()));
await p.getByRole('button',{name:`${future.getDate()} ${months[future.getMonth()]} ${future.getFullYear()}`,exact:true}).click();
assert.equal(await p.getByLabel('Götürmə tarixi',{exact:true}).inputValue(),`${String(future.getDate()).padStart(2,'0')}.${String(future.getMonth()+1).padStart(2,'0')}.${future.getFullYear()}`);
assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
await p.screenshot({path:`/tmp/kiraye-detail-improvements-${viewportWidth}.png`,fullPage:true});ad.expires_at=new Date(Date.now()-1000).toISOString();
await p.goto(base+'/profile');await p.getByRole('button',{name:'Müddəti bitib (1)',exact:true}).click();
await p.getByRole('button',{name:'Bərpa et',exact:true}).click();await p.getByRole('status').filter({hasText:'Elan bərpa üçün yoxlamaya göndərildi.'}).waitFor();
await p.getByRole('button',{name:'Yoxlanılır (1)',exact:true}).waitFor();
ad.status='archived';delete ad.expires_at;
await p.goto(base+'/profile');await p.getByRole('heading',{name:'Elanlarım',exact:true}).waitFor();
await p.locator('.accountListings article').waitFor();assert.equal(await p.getByRole('button',{name:'Bərpa et',exact:true}).count(),0);
await p.getByRole('link',{name:'Yenilə və göndər',exact:true}).waitFor();
assert.deepEqual(errors,[]);await ctx.close();console.log('PASS mobile account access, persistent AZ/RU/EN homepage, full call number, photo marks and Azerbaijani calendar under Turkish browser locale');
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exit(1)});
