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
const rail=p.locator('.kzPhotoRail');await rail.waitFor();assert.equal(await p.locator('.galleryStage').evaluate(n=>getComputedStyle(n,"::before").display),"none","Gallery must not decode a second full-size original for a blurred background");const cdp=await context.newCDPSession(p);
async function swipe(locator,from,to){const box=await locator.boundingBox();const y=box.y+box.height/2;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width*from,y}]});for(let i=1;i<=10;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width*(from+(to-from)*i/10),y}]});await p.waitForTimeout(25)}return cdp;}
await swipe(rail,.85,.15);assert.ok(await rail.evaluate(n=>n.scrollLeft)>30,'The rail must already move while the finger is still down');await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForFunction(()=>document.querySelector('.galleryCounter').textContent.trim()==='2 / 3');assert.equal(await p.locator('dialog[open]').count(),0);console.log('PASS inline photo follows finger before release; settles on 2/3 without opening viewer');
await p.waitForFunction(()=>{const n=document.querySelector('.kzPhotoRail');return Math.abs(n.scrollLeft-n.clientWidth)<2});await p.locator('.galleryOpen[aria-current=true]').tap();const viewer=p.locator('dialog[open]');await viewer.waitFor();const retained=await viewer.locator('.kzViewerNeighbor').last().elementHandle();await swipe(viewer.locator('.kzViewerStage'),.85,.15);assert.ok(await viewer.locator('.kzViewerNeighbor').count()>0);const frame=await viewer.locator('.kzViewerStage').boundingBox(),preview=await viewer.locator('.kzViewerNeighbor').first().boundingBox();assert.ok(Math.abs(frame.width-preview.width)<2&&Math.abs(frame.height-preview.height)<2,'Adjacent preview must use the same centered photo frame');assert.ok((await viewer.locator('.kzViewerCurrent').evaluate(n=>getComputedStyle(n).transform))!=='none');await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForFunction(()=>document.querySelector('.kzViewerCount').textContent.trim()==='3 / 3');assert.ok(await retained.evaluate(n=>n.isConnected&&n.classList.contains('kzViewerCurrent')),'The already loaded neighbouring slide must become current without replacing its image');console.log('PASS fullscreen swipe keeps the same decoded image element');
await swipe(viewer.locator('.kzViewerStage'),.8,.2);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(350);assert.equal((await viewer.locator('.kzViewerCount').innerText()).trim(),'3 / 3');console.log('PASS last-photo boundary does not wrap');
await viewer.locator('.kzViewerStage').dispatchEvent('pointerdown',{pointerId:9,clientX:200,clientY:300,pointerType:'touch'});await viewer.locator('.kzViewerStage').dispatchEvent('pointermove',{pointerId:9,clientX:300,clientY:300,pointerType:'touch'});await viewer.locator('.kzViewerStage').dispatchEvent('pointercancel',{pointerId:9,pointerType:'touch'});await p.waitForTimeout(300);assert.equal((await viewer.locator('.kzViewerCount').innerText()).trim(),'3 / 3');
await viewer.getByRole('button',{name:'Şəkilləri bağla'}).click();await p.waitForFunction(()=>!document.querySelector('dialog[open]'));assert.equal((await p.locator('.galleryCounter').innerText()).trim(),'3 / 3');
assert.equal(errors.length,0,errors.join('\n'));console.log('PASS cancelled gesture, close and inline synchronization; no runtime errors');
const desktop=await b.newPage({viewport:{width:1280,height:900}});await desktop.route('**/api/listing-view',route=>route.fulfill({json:{ok:true}}));await desktop.goto(base+listingPath);await desktop.locator('.galleryArrow.next').click();await desktop.waitForFunction(()=>{const rail=document.querySelector('.kzPhotoRail');return Math.abs(rail.scrollLeft-rail.clientWidth)<2});
await desktop.locator('.thumbnails button').first().click();await desktop.waitForFunction(()=>document.querySelector('.kzPhotoRail').scrollLeft<2);
await desktop.locator('.thumbnails button').nth(2).click();await desktop.waitForFunction(()=>{const rail=document.querySelector('.kzPhotoRail');return Math.abs(rail.scrollLeft-2*rail.clientWidth)<2});
await desktop.locator('.galleryOpen[aria-current=true]').click();await desktop.locator('dialog[open]').waitFor();await desktop.keyboard.press('ArrowLeft');await desktop.waitForFunction(()=>document.querySelector('.kzViewerCount').textContent.trim()==='2 / 3');
await desktop.keyboard.press('=');await desktop.locator('.kzViewerStage.zoomed').waitFor();await desktop.keyboard.press('-');await desktop.waitForFunction(()=>!document.querySelector('.kzViewerStage.zoomed'));await desktop.keyboard.press('Escape');await desktop.waitForFunction(()=>!document.querySelector('dialog[open]'));console.log('PASS desktop arrows, thumbnails, keyboard, zoom and Escape');

// Older Safari has no native modal dialog and may not have HTMLImageElement.decode.
const legacy=await b.newPage({viewport:{width:375,height:667}});
await legacy.addInitScript(()=>{if(window.HTMLDialogElement){HTMLDialogElement.prototype.showModal=undefined;HTMLDialogElement.prototype.close=undefined;}HTMLImageElement.prototype.decode=undefined;});
await legacy.route('**/api/listing-view',route=>route.fulfill({json:{ok:true}}));
await legacy.goto(base+listingPath);await legacy.waitForFunction(()=>!document.querySelector('.galleryOpen[aria-current=true] .kzGalleryLoading'));await legacy.locator('.galleryOpen[aria-current=true]').click();await legacy.locator('dialog[open]').waitFor();await legacy.keyboard.press('ArrowRight');await legacy.waitForFunction(()=>document.querySelector('.kzViewerCount').textContent.trim()==='2 / 3');await legacy.keyboard.press('Escape');await legacy.waitForFunction(()=>!document.querySelector('dialog[open]'));await legacy.close();
console.log('PASS gallery works without native dialog or image decode APIs');

// Hold detail photos back while thumbnails load: a slow connection must not blank the slide.
const slow=await b.newPage({viewport:{width:375,height:812}});
let release;const gate=new Promise(resolve=>{release=resolve});
try{
await slow.route('**/*',async route=>{
 const request=route.request(),url=new URL(request.url());
 const full=request.resourceType()==='image'&&(url.searchParams.get('s')==='view'||(/^\/samples\/[^/]+\.jpg$/.test(url.pathname)));
 if(full)await gate;
 await route.continue().catch(()=>{});
});
await slow.route('**/api/listing-view',route=>route.fulfill({json:{ok:true}}));
await slow.goto(base+listingPath,{waitUntil:'domcontentloaded'});
await slow.waitForFunction(()=>!document.querySelector('.galleryOpen[aria-current=true] .kzGalleryLoading'));
await slow.locator('.galleryOpen[aria-current=true]').click();await slow.locator('dialog[open]').waitFor();
await slow.waitForFunction(()=>{const n=document.querySelector('.kzViewerCurrent .kzGalleryPreview');return n?.complete&&n.naturalWidth>0});
await slow.keyboard.press('ArrowRight');await slow.waitForFunction(()=>document.querySelector('.kzViewerCount').textContent.trim()==='2 / 3');
await slow.waitForFunction(()=>{const n=document.querySelector('.kzViewerCurrent .kzGalleryPreview');return n?.complete&&n.naturalWidth>0});
assert.equal(await slow.locator('.kzViewerCurrent .kzGalleryFull').evaluate(n=>getComputedStyle(n).opacity),'0');
const layer=await slow.locator('.kzViewerCurrent').elementHandle();release();
await slow.waitForFunction(()=>getComputedStyle(document.querySelector('.kzViewerCurrent .kzGalleryFull')).opacity==='1');
assert.ok(await layer.evaluate(n=>n.isConnected&&n.classList.contains('kzViewerCurrent')));
console.log('PASS slow detail photo keeps its thumbnail until decode; no source swap on slide change');
}finally{release();await slow.close()}

}finally{await b.close()}

})().catch(error=>{console.error(error);process.exitCode=1});
