// Guest gallery checks; all catalog requests are intercepted.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try {
 for (const width of [320,1440]) {
 const context=await browser.newContext({viewport:{width,height:900},hasTouch:true,isMobile:width<720});
 const page=await context.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let images=['/car.svg?one','/car.svg?two','/car.svg?three'];
 const item={id:'22222222-2222-4222-8222-222222222222',owner_id:'11111111-1111-4111-8111-111111111111',title:'Toyota Corolla kirayəsi',category:'car',city:'Bakı',price:55,rental_period:'daily',status:'published',description:'Rahat avtomobil, ətraflı kirayə məlumatı və işlək əlaqə nömrəsi.',contact:'+994501234567',created_at:new Date().toISOString(),attributes:{},min_days:1};
 await page.route('https://*.supabase.co/**',r=>r.fulfill({status:r.request().method()==='OPTIONS'?204:200,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*','content-range':'0-0/1','access-control-expose-headers':'content-range'},contentType:'application/json',body:r.request().method()==='OPTIONS'?'':JSON.stringify(r.request().url().includes('/rest/v1/listings')?[{...item,images}]:{external:{}})}));
 await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:3013');
 await page.locator('.quickView').first().click();
 const gallery=page.getByRole('region',{name:'Elan şəkilləri'});
 const counter=gallery.locator('.galleryCounter');await counter.waitFor();
 assert.equal(await counter.innerText(),'1 / 3');
 await gallery.getByRole('button',{name:'Növbəti şəkil',exact:true}).tap();assert.equal(await counter.innerText(),'2 / 3');
 await gallery.getByRole('button',{name:'Əvvəlki şəkil',exact:true}).tap();assert.equal(await counter.innerText(),'1 / 3');
 await gallery.getByRole('button',{name:'Əvvəlki şəkil',exact:true}).tap();assert.equal(await counter.innerText(),'3 / 3');
 await gallery.getByRole('button',{name:'2-ci şəkil',exact:true}).tap();assert((await gallery.locator('.listingMainImage').getAttribute('src')).endsWith('?two'));
 await gallery.focus();await page.keyboard.press('ArrowRight');assert.equal(await counter.innerText(),'3 / 3');
 if(width<720){
  const stage=await gallery.locator('.galleryStage').boundingBox();
  const cdp=await context.newCDPSession(page);const x=stage.x+stage.width*.75,y=stage.y+stage.height*.6;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-100,y}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForFunction(()=>document.querySelector('.galleryCounter')?.textContent==='1 / 3');
 }
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.getByRole('button',{name:'Bağla',exact:true}).click();
 images=['/car.svg?one'];await page.reload();await page.locator('.quickView').first().click();
 await gallery.waitFor();assert.equal(await gallery.locator('.galleryArrow').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS gallery arrows, wraparound, thumbnails, keyboard, single image and touch swipe at',width);
 await context.close();
 }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
