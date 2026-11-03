// Read-only browser checks. Start the local app first; no e-mail or message is sent.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const base=process.env.KIRAYE_TEST_BASE_URL||'http://127.0.0.1:3000';
let passed=0;
const pass=name=>{passed++;console.log('PASS',name)};
(async()=>{
 const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
 const browser=await chromium.launch({executablePath,headless:true});
 try{
  for(const width of [320,375,768,1440]){
   const context=await browser.newContext({viewport:{width,height:900}});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   const response=await page.goto(base);assert.ok(response.ok(),'Local server must be running');
   await page.locator('.kzCategories').waitFor();await page.waitForFunction(()=>!document.querySelector('.kzSkeleton'));
   if(width>=768){const contrast=await page.locator('.kzSearch button').evaluate(n=>{const s=getComputedStyle(n);return {text:s.color,background:s.backgroundColor}});assert.notEqual(contrast.text,contrast.background,'Search label must remain visible on its button');}
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   assert.ok(await page.locator('.kzCard').count()<=18);
   const checkNavigation=async()=>{
    if(width>=768)return;
    const metrics=await page.locator('.kzTabbar').evaluate(nav=>({width:nav.clientWidth,links:[...nav.children].map(n=>{const box=n.getBoundingClientRect(),label=n.querySelector('span:last-child');return {width:box.width,height:box.height,top:label.getBoundingClientRect().top,textWidth:label.scrollWidth,available:label.clientWidth}})}));
    assert.ok(metrics.links.every(n=>n.textWidth<=n.available&&n.height>=44),'Navigation text must fit each touch target');
    assert.ok(Math.abs(metrics.links.reduce((sum,n)=>sum+n.width,0)-metrics.width)<2,'No inherited spacing may shrink navigation columns');
    assert.ok(Math.max(...metrics.links.map(n=>n.top))-Math.min(...metrics.links.map(n=>n.top))<1,'Navigation labels must share a baseline');
   };
   await checkNavigation();
   assert.equal(await page.locator('.kzCard button').count(),0,'Listing card photos must have no favorite overlay');
   if(await page.locator('.kzCardLink').count()){
    await page.locator('.kzCardLink').first().click();const favorite=page.locator('.kzTitleActions button[aria-pressed]');await favorite.waitFor();await favorite.click();assert.equal(await favorite.getAttribute('aria-pressed'),'true');await favorite.click();assert.equal(await favorite.getAttribute('aria-pressed'),'false');
   }
   await page.goto(base+'/help');await page.locator('.helpCard summary').first().click();assert.equal(await page.locator('.helpCard').first().getAttribute('open'),'');
   await page.evaluate(()=>localStorage.setItem('kirayeal:language','ru'));await page.reload();await page.waitForFunction(()=>document.documentElement.lang==='ru'&&document.querySelector('main h1')?.textContent==='Есть вопрос? Начни здесь.');await checkNavigation();
   await page.evaluate(()=>localStorage.setItem('kirayeal:language','en'));await page.reload();await page.waitForFunction(()=>document.documentElement.lang==='en'&&document.querySelector('main h1')?.textContent==='Have a question? Start here.');await checkNavigation();assert.ok(!(await page.locator('.kzTabbar').innerText()).includes('İ'),'English labels must use English casing');
   await page.evaluate(()=>localStorage.setItem('kirayeal:language','az'));await page.reload();await page.waitForFunction(()=>document.documentElement.lang==='az'&&document.querySelector('main h1')?.textContent==='Sualın var? Buradan başla.');
   assert.equal(errors.length,0,errors.join('\n'));pass(`${width}px layout, card budget, favorites where available, FAQ and language switching`);await context.close();
  }
  for (const width of [320,375,768,1440]) {
   const page=await browser.newPage({viewport:{width,height:900}}),issues=[];
   page.on('console',message=>{if(message.type()==='error'&&/hydrat/i.test(message.text()))issues.push(message.text());});
   for(const mode of ['login','signup','reset']){
    await page.goto(`${base}/login?mode=${mode}`);await page.locator('#auth-title').waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    const eye=page.locator('.passwordToggle');
    if(await eye.count()){
     const box=await eye.evaluate(n=>{const b=n.getBoundingClientRect(),i=n.querySelector('svg').getBoundingClientRect();return {width:Math.round(b.width*100)/100,height:Math.round(b.height*100)/100,contained:i.left>=b.left&&i.right<=b.right&&i.top>=b.top&&i.bottom<=b.bottom};});
     assert.ok(box.width>=44&&box.width<=50&&box.height>=44&&box.contained,'Eye icon must fit its consistent touch target');
     await page.locator('#auth-password').fill('PreviewPassword123');await eye.click();assert.equal(await page.locator('#auth-password').getAttribute('type'),'text');assert.equal(await page.locator('#auth-password').inputValue(),'PreviewPassword123');await eye.click();assert.equal(await page.locator('#auth-password').getAttribute('type'),'password');
    }
   }
   assert.equal(issues.length,0,issues.join('\n'));pass(`${width}px login, registration and recovery controls without clipped icons or hydration mismatch`);await page.close();
  }
  const {codeLetter,noticeLetter}=await import(pathToFileURL(path.resolve('scripts/email-frame.mjs')).href);
  const page=await browser.newPage({viewport:{width:320,height:812}});
  for(const letter of [codeLetter({heading:'Hesabınızı təsdiqləyin',name:'Aysel',intro:'Təsdiq kodunu daxil edin.',code:'123456',note:'10 dəqiqə'}),noticeLetter({heading:'Yeni mesajınız var',name:'Aysel',intro:'Yeni mesaj daxil olmuşdur.',rows:[{label:'Elan',value:'Günlük kirayə mənzil'}],button:{text:'Mesajı oxuyun',href:'/messages'}})]){await page.setContent(letter.html);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),320)}
  pass('Authentication and notice e-mails fit 320px');
 }finally{await browser.close()}
 console.log(`${passed} browser scenarios passed`);
})().catch(e=>{console.error(e);process.exitCode=1});
