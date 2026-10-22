const assert = require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
const page=await browser.newPage({viewport:{width:390,height:844}});
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
console.log('PASS guest publish page exposes signup and login without provider requests');
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
