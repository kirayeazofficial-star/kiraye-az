// Isolated browser fixtures. No live account or database access.
const assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3260';
 const owner='11111111-1111-4111-8111-111111111111',id='22222222-2222-4222-8222-222222222222';
 const user={id:owner,email:'fixture@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{}};
 const ad={id,listing_no:10000001,owner_id:owner,category:'car',title:'Qalereya sınağı',city:'Bakı',price:50,rental_period:'daily',status:'published',description:'Uzun kirayə şərtləri. '.repeat(160),contact:'+994501234567',images:['/car.svg?one','/car.svg?two','/car.svg?three'],created_at:new Date().toISOString(),attributes:{}};
 try {for(const width of [320,375,768,1440]){
 const context=await browser.newContext({viewport:{width,height:width===375?667:900},hasTouch:true,isMobile:width<720});const page=await context.newPage();page.setDefaultNavigationTimeout(120000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://*.supabase.co/**',r=>{const u=new URL(r.request().url());let body=[];
 if(u.pathname.endsWith('/user'))body=user;
 else if(u.pathname.includes('/profiles'))body={id:owner,role:'admin',display_name:'Qalereya sınağı',profile_no:30000001};
 else if(u.pathname.endsWith('/admin_current_access'))body={allowed:true,role:'moderator'};
 else if(u.pathname.endsWith('/public_listing_info'))body={seller_name:'Sınaq',views:1};
 else if(u.pathname.includes('/listings'))body=(u.searchParams.get('id')||'').startsWith('neq.')?[{...ad,id:owner,title:'Bənzər elan'}]:u.searchParams.get('id')?ad:[{...ad,status:'pending'}];
 return r.fulfill({status:200,headers:{'access-control-allow-origin':'*','content-range':'0-0/1','access-control-expose-headers':'content-range'},json:body});});
 await page.goto(base);
 const jwt=Buffer.from('{}').toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:owner,aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.fixture';
 await page.evaluate(s=>localStorage.setItem('sb-browser-test-auth-token',JSON.stringify(s)),{access_token:jwt,refresh_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user});
 await page.goto(base+'/profile/listings/'+id);const open=page.getByRole('button',{name:'Şəkli böyüt',exact:true});await open.waitFor().catch(async e=>{console.error(await page.locator("body").innerText());await page.screenshot({path:"/tmp/kiraye-viewer-failure.png"});throw e;});
 await page.locator('.relatedCard').first().waitFor();
 for(const y of [0,400,800,1400,2200]){await page.evaluate(y=>scrollTo(0,y),y);const a=await page.locator('.listingGallery').boundingBox(),b=await page.locator('.relatedListings').boundingBox();assert(a.y+a.height<=b.y+1,'gallery must end before related listings at '+width+' scroll '+y);}
 await open.click();let viewer=page.getByRole('dialog');await viewer.waitFor();assert.equal(await viewer.getByRole('status').innerText(),'1 / 3');
 await viewer.getByRole('button',{name:'Növbəti böyük şəkil'}).click();assert.equal(await viewer.getByRole('status').innerText(),'2 / 3');
 await page.keyboard.press('ArrowLeft');assert.equal(await viewer.getByRole('status').innerText(),'1 / 3');
 if(width<720){const box=await viewer.locator('.imageViewerStage').boundingBox(),cdp=await context.newCDPSession(page),x=box.x+box.width*.75,y=box.y+box.height*.5;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-100,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForFunction(()=>document.querySelector('.imageViewer footer span')?.textContent==='2 / 3');}
 await page.keyboard.press('Escape');await viewer.waitFor({state:'detached'});assert.equal(await open.evaluate(e=>e===document.activeElement),true,'focus returns to opening button');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.goto(base+'/admin');const thumb=page.locator('.moderationImages button').first();await thumb.waitFor();const before=page.url();await thumb.click();viewer=page.getByRole('dialog');await viewer.waitFor();assert.equal(page.url(),before,'moderation photo stays inside site');assert.equal(context.pages().length,1);
 await viewer.getByRole('button',{name:'Şəkilləri bağla'}).click();
 await page.goto(base+'/profile');await page.locator('.cabinetCards').waitFor();await page.getByRole('link',{name:'Mənim elanlarım',exact:true}).click();
 if(width<=1024)await page.waitForFunction(()=>document.querySelector('.cabinetSidebar')?.classList.contains('isCollapsed'));
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.goto(base+'/profile?section=transactions');await page.getByRole('heading',{name:'Əməliyyat tarixçəsi',exact:true}).waitFor();
 if(width<=1024)await page.getByRole('button',{name:/Kabinet bölmələri/}).click();
 await page.getByRole('link',{name:'Mənim elanlarım',exact:true}).click();await page.getByRole('heading',{name:'Elanlarım',exact:true}).waitFor();
 assert.deepEqual(errors,[]);
 await page.screenshot({path:`/tmp/kiraye-gallery-${width}.png`});console.log('PASS gallery layout, in-site enlargement, keyboard/touch, focus and admin photos',width);await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
