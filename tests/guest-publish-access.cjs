const assert = require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
const page=await browser.newPage({viewport:{width:375,height:667}});
await page.route('https://*.supabase.co/**',async route=>{
 if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*'}});
 await new Promise(resolve=>setTimeout(resolve,25000));
 await route.abort().catch(()=>{});
});
await page.goto((process.env.TEST_BASE_URL||'http://127.0.0.1:3013')+'/new');
// A guest should resolve without waiting for provider settings.
await page.getByRole('link',{name:'Qeydiyyatdan keç',exact:true}).last().waitFor();
await page.getByRole('heading',{name:'Əvvəl hesabına daxil ol'}).waitFor({timeout:20000});
assert.equal(await page.getByRole('link',{name:'Daxil ol',exact:true}).last().count(),1);
const prompt=page.locator('.guestPublishPrompt'),actions=await prompt.locator('.guestPublishActions').boundingBox();
assert(actions && actions.y+actions.height<600,'Login and signup must fit above the mobile bottom menu');
const safety=await page.getByRole('complementary',{name:'Təhlükəsiz elan yerləşdirmə'}).boundingBox();
assert(safety.y>actions.y+actions.height,'Entry actions must precede safety notices');
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
await prompt.getByRole('link',{name:'Qeydiyyatdan keç',exact:true}).click();
await page.getByRole('heading',{name:'Hesab yarat',exact:true}).waitFor();

console.log('PASS guest publish page exposes signup and login without provider requests');
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
