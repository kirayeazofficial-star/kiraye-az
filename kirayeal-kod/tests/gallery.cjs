const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const base=process.env.KIRAYE_TEST_BASE_URL||'http://127.0.0.1:3000';
const listingPath=process.env.KIRAYE_TEST_LISTING_PATH;
if(!listingPath?.startsWith('/listings/'))throw new Error('Set KIRAYE_TEST_LISTING_PATH to a local listing with exactly three photos.');
(async()=>{
const b=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined)});try{
const context=await b.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true});
const p=await context.newPage(),errors=[];p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));
await p.route('**/api/listing-view',route=>route.fulfill({json:{ok:true}}));
await p.goto(base+listingPath);
const rail=p.locator('.kzPhotoRail');await rail.waitFor();const cdp=await context.newCDPSession(p);
async function swipe(locator,from,to){const box=await locator.boundingBox();const y=box.y+box.height/2;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width*from,y}]});for(let i=1;i<=10;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width*(from+(to-from)*i/10),y}]});await p.waitForTimeout(25)}return cdp;}
await swipe(rail,.85,.15);assert.ok(await rail.evaluate(n=>n.scrollLeft)>30,'The rail must already move while the finger is still down');await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForFunction(()=>document.querySelector('.galleryCounter').textContent.trim()==='2 / 3');assert.equal(await p.locator('dialog[open]').count(),0);console.log('PASS inline photo follows finger before release; settles on 2/3 without opening viewer');
await p.waitForFunction(()=>{const n=document.querySelector('.kzPhotoRail');return Math.abs(n.scrollLeft-n.clientWidth)<2});await p.locator('.galleryOpen[aria-current=true]').tap();const viewer=p.locator('dialog[open]');await viewer.waitFor();await swipe(viewer.locator('.kzViewerStage'),.85,.15);assert.ok(await viewer.locator('.kzViewerNeighbor').count()>0);const frame=await viewer.locator('.kzViewerStage').boundingBox(),preview=await viewer.locator('.kzViewerNeighbor').first().boundingBox();assert.ok(Math.abs(frame.width-preview.width)<2&&Math.abs(frame.height-preview.height)<2,'Adjacent preview must use the same centered photo frame');assert.ok((await viewer.locator('.kzViewerCurrent').evaluate(n=>getComputedStyle(n).transform))!=='none');await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForFunction(()=>document.querySelector('.kzViewerCount').textContent.trim()==='3 / 3');console.log('PASS fullscreen adjacent preview and completed swipe');
await swipe(viewer.locator('.kzViewerStage'),.8,.2);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(350);assert.equal((await viewer.locator('.kzViewerCount').innerText()).trim(),'3 / 3');console.log('PASS last-photo boundary does not wrap');
await viewer.locator('.kzViewerStage').dispatchEvent('pointerdown',{pointerId:9,clientX:200,clientY:300,pointerType:'touch'});await viewer.locator('.kzViewerStage').dispatchEvent('pointermove',{pointerId:9,clientX:300,clientY:300,pointerType:'touch'});await viewer.locator('.kzViewerStage').dispatchEvent('pointercancel',{pointerId:9,pointerType:'touch'});await p.waitForTimeout(300);assert.equal((await viewer.locator('.kzViewerCount').innerText()).trim(),'3 / 3');
await viewer.getByRole('button',{name:'Şəkilləri bağla'}).click();await p.waitForFunction(()=>!document.querySelector('dialog[open]'));assert.equal((await p.locator('.galleryCounter').innerText()).trim(),'3 / 3');
assert.equal(errors.length,0,errors.join('\n'));console.log('PASS cancelled gesture, close and inline synchronization; no runtime errors');
const desktop=await b.newPage({viewport:{width:1280,height:900}});await desktop.route('**/api/listing-view',route=>route.fulfill({json:{ok:true}}));await desktop.goto(base+listingPath);await desktop.locator('.galleryArrow.next').click();await desktop.waitForFunction(()=>{const rail=document.querySelector('.kzPhotoRail');return Math.abs(rail.scrollLeft-rail.clientWidth)<2});
await desktop.locator('.thumbnails button').first().click();await desktop.waitForFunction(()=>document.querySelector('.kzPhotoRail').scrollLeft<2);
await desktop.locator('.thumbnails button').nth(2).click();await desktop.waitForFunction(()=>{const rail=document.querySelector('.kzPhotoRail');return Math.abs(rail.scrollLeft-2*rail.clientWidth)<2});
await desktop.locator('.galleryOpen[aria-current=true]').click();await desktop.locator('dialog[open]').waitFor();await desktop.keyboard.press('ArrowLeft');await desktop.waitForFunction(()=>document.querySelector('.kzViewerCount').textContent.trim()==='2 / 3');
await desktop.keyboard.press('=');await desktop.locator('.kzViewerStage.zoomed').waitFor();await desktop.keyboard.press('-');await desktop.waitForFunction(()=>!document.querySelector('.kzViewerStage.zoomed'));await desktop.keyboard.press('Escape');await desktop.waitForFunction(()=>!document.querySelector('dialog[open]'));console.log('PASS desktop arrows, thumbnails, keyboard, zoom and Escape');

}finally{await b.close()}

})().catch(error=>{console.error(error);process.exitCode=1});
