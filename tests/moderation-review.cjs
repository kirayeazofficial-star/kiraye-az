// Mocked private endpoints only; no live account, email or database writes.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{for(const width of [320,390,768,1440]){
 const page=await browser.newPage({viewport:{width,height:900}}),base=process.env.TEST_BASE_URL||'http://127.0.0.1:3239';
 const admin='11111111-1111-4111-8111-111111111111',owner='22222222-2222-4222-8222-222222222222',id='33333333-3333-4333-8333-333333333333';
 const user={id:admin,email:'admin@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{}};
 const token=Buffer.from('{}').toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:admin,aud:'authenticated',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.fixture';
 await page.addInitScript(session=>localStorage.setItem('sb-browser-test-auth-token',JSON.stringify(session)),{access_token:token,refresh_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user});
 const event={id:1,listing_id:id,actor_id:owner,actor_name:'Elan Sahibi',actor_kind:'owner',action:'resubmitted',old_status:'published',new_status:'pending',changed_fields:['title'],before_values:{title:'Əvvəlki elan başlığı'},after_values:{title:'Yeni elan başlığı'},reason:null,created_at:new Date().toISOString()};
 let contextFails=false;
 await page.route('https://*.supabase.co/**',route=>{const req=route.request(),url=new URL(req.url()),headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*','content-range':'0-0/1','access-control-expose-headers':'content-range'};if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});let body=[];
 if(url.pathname.endsWith('/user'))body=user;
 else if(url.pathname.includes('/profiles'))body={id:admin,role:'admin'};
 else if(url.pathname.endsWith('/admin_listing_context')){if(contextFails)return route.fulfill({status:404,headers,json:{code:'PGRST202'}});body={owner:{id:owner,name:'Elan Sahibi',joined_at:'2025-01-01T00:00:00Z'},owner_listings:[{id,title:'Yeni elan başlığı',status:'pending',created_at:event.created_at}],reports:{open:2,resolved:1},events:[event],signals:[{id:'44444444-4444-4444-8444-444444444444',title:'Oxşar elan',owner_id:'55555555-5555-4555-8555-555555555555',status:'published',same_phone:true,same_image:false,similar_text:true}]};}
 else if(url.pathname.endsWith('/admin_moderation_history'))body=[event];
 else if(url.pathname.includes('/listings'))body=[{id,owner_id:owner,title:'Yeni elan başlığı',description:'Saz vəziyyətdə avtomobil kirayəyə verilir.',category:'car',city:'Bakı',price:70,rental_period:'daily',contact:'+994501234567',images:['/car.svg'],status:'pending',created_at:event.created_at,attributes:{}}];
 return route.fulfill({status:200,headers,json:body});});
 await page.goto(base+'/admin');await page.locator('.moderationCard').waitFor();
 const preset=page.getByLabel('Hazır rədd səbəbi',{exact:true});await preset.selectOption({index:1});assert((await page.locator('.moderationReason textarea').inputValue()).includes('Şəkillər'));
 await page.locator('.moderationReason textarea').fill('Şəkillər düzgün deyil. Yeni şəkil göndərin.');
 await page.locator('.moderationReview>summary').click();await page.getByText('Eyni əlaqə nömrəsi · Oxşar elan mətni',{exact:true}).waitFor();await page.getByText('Şikayətlər: 2 açıq, 1 baxılıb.',{exact:false}).waitFor();
 await page.locator('.moderationTimeline details>summary').click();await page.getByText('Əvvəlki elan başlığı',{exact:false}).waitFor();
 await page.getByRole('button',{name:'Tarixçəni yenilə',exact:true}).click();await page.locator('#moderation-history .moderationTimeline li').first().waitFor();assert.equal(await page.locator('#moderation-history .moderationTimeline li').count(),1);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 if(width>720){const positions=await page.evaluate(()=>{const brand=document.querySelector('.headerBrand .logo').getBoundingClientRect(),nav=document.querySelector('.header>nav').getBoundingClientRect();return {brand:brand.y+brand.height/2,nav:nav.y+nav.height/2};});assert(Math.abs(positions.brand-positions.nav)<2,JSON.stringify(positions));}
 await page.screenshot({path:`/tmp/kiraye-moderation-${width}.png`});
 contextFails=true;await page.reload();await page.locator('.moderationReview>summary').click();await page.getByRole('alert').filter({hasText:'Server yeniləməsi və admin icazəsi'}).waitFor();assert.equal(await page.getByText('Yoxlanılan elanlar arasında uyğunluq tapılmadı.',{exact:true}).count(),0);
 console.log('PASS review presets, signals, history/diff, missing migration notice and header alignment',width);await page.close();
 }}finally{await browser.close()}})().catch(error=>{console.error(error);process.exit(1)});
