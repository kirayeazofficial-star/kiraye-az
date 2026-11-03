// Browser checks with isolated message fixtures; no real conversation is read or written.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const base=process.env.KIRAYE_TEST_BASE_URL||'http://127.0.0.1:3000';
const now=new Date().toISOString();
const threads=['first','second'].map((id,i)=>({id,listing_id:'fixture',listing_title:'Dəniz mənzərəli uzun başlıqlı kirayə mənzil — '+id,peer_name:'Uzun ad və soyad olan istifadəçi '+i,peer_no:i+1,is_buyer:i===0,listing_active:true,blocked:false,blocked_by_me:false,last_message_at:now,preview:'Mesaj məzmunu '.repeat(12),unread:12}));
async function fixture(page,holdFirst=false){
 let release;
 const gate=new Promise(resolve=>{release=resolve});
 await page.route('**/api/auth/host',route=>route.fulfill({json:{user:{id:'viewer'}}}));
 await page.route('**/api/account/profile',route=>route.fulfill({json:{profile:{name:'Sınaq',profile_no:1}}}));
 await page.route('**/api/messages**',async route=>{
  if(route.request().method()==='POST')return route.fulfill({json:{ok:true}});
  const url=new URL(route.request().url());
  if(url.searchParams.get('action')==='inbox')return route.fulfill({json:{items:threads}});
  const id=url.searchParams.get('thread');
  if(id==='first'&&holdFirst)await gate;
  return route.fulfill({json:{items:[{id:id==='first'?1:2,author_id:'peer',body:id+' '+('UzunMətn'.repeat(35)),created_at:now}]}});
 });
 return release;
}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined)});
 try{
 for(const width of [320,375,768,1440]){
  const page=await browser.newPage({viewport:{width,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await fixture(page);
  await page.goto(base+'/messages');await page.locator('.kzChatItem').first().waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.locator('.kzChatItem').first().click();await page.locator('.kzBubble').waitFor();
  const input=page.locator('#chat-body');await input.fill('Birinci sətir\nİkinci sətir\nÜçüncü sətir\nDördüncü sətir');
  await page.waitForFunction(()=>document.querySelector('#chat-body').getBoundingClientRect().height>85);
  assert.ok(await input.evaluate(n=>n.clientHeight>=n.scrollHeight-2),'Short multiline message must remain readable without scrolling');
  await input.fill('');await page.waitForFunction(()=>document.querySelector('#chat-body').getBoundingClientRect().height<55);
  const metrics=await page.locator('.kzComposer').evaluate(n=>{const b=n.getBoundingClientRect(),c=n.querySelector('button').getBoundingClientRect();return {sendWidth:c.width,sendHeight:c.height,inside:c.right<=b.right,overflow:document.documentElement.scrollWidth>innerWidth}});
  assert.ok(metrics.sendWidth>=44&&metrics.sendHeight>=44&&metrics.inside&&!metrics.overflow,'Composer and long messages must fit the screen');
  if(width<768){await page.getByRole('button',{name:'Söhbətlərə qayıt'}).click();await page.locator('.kzChatList').waitFor({state:'visible'});await page.locator('.kzTabbar').waitFor({state:'visible'});}
  assert.equal(errors.length,0,errors.join('\n'));console.log('PASS',width,'long names/messages, growing composer, intact send button and mobile return');await page.close();
 }
 const page=await browser.newPage({viewport:{width:1280,height:900}}),release=await fixture(page,true);
 await page.goto(base+'/messages');await page.locator('.kzChatItem').first().click();await page.locator('.kzChatItem').nth(1).click();await page.waitForFunction(()=>document.querySelector('.kzBubble p')?.textContent.startsWith('second'));
 release();await page.waitForTimeout(250);assert.ok((await page.locator('.kzBubble p').innerText()).startsWith('second'),'Late response from the first conversation must not replace the selected conversation');
 console.log('PASS delayed conversation cannot replace the currently selected messages');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
