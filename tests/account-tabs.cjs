// Isolated account fixtures. No listing or payment is created.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright');
const base=process.env.KIRAYE_TEST_BASE_URL||'http://127.0.0.1:3000';
(async()=>{
 const b=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined)});
 try{for(const scenario of [{name:'leader',leader:true,payments:false,items:[],visible:true},{name:'closed',leader:false,payments:false,items:[],visible:false},{name:'enabled',leader:false,payments:true,items:[],visible:true},{name:'existing',leader:false,payments:false,items:[{id:'11111111-1111-4111-8111-111111111111',owner_id:'viewer',title:'Ödəniş gözləyən sınaq elanı',description:'Yerli sınaq',category:'property',city:'Bakı',price:100,rental_period:'monthly',contact:'0501234567',status:'pending',payment_required:true,created_at:new Date().toISOString(),images:['/samples/ev-1.jpg']}],visible:true}]){
  const p=await b.newPage({viewport:{width:375,height:850}});let writes=0;p.on('request',r=>{if(r.method()==='POST')writes++});
  await p.route('**/api/auth/host',r=>r.fulfill({json:{user:{id:'viewer',email:'preview@example.invalid'},leader:scenario.leader}}));
  await p.route('**/api/account/profile',r=>r.fulfill({json:{profile:{name:'Sınaq',profile_no:1,role:'user',staff_role:scenario.leader?'leader':null}}}));
  await p.route('**/api/settings',r=>r.fulfill({json:{payments:scenario.payments,leader:scenario.leader}}));
  await p.route(/\/api\/listings\?/,r=>r.fulfill({json:{items:scenario.items}}));
  await p.route('**/api/listings/limits',r=>r.fulfill({json:{items:[]}}));await p.route('**/api/stores?mine=1',r=>r.fulfill({json:{}}));
  await p.goto(base+'/profile');const tabs=p.locator('.kzOwnTabs');await tabs.waitFor();await p.waitForTimeout(150);
  const payment=tabs.getByRole('button',{name:/Ödəniş gözləyir/});assert.equal(await payment.count(),scenario.visible?1:0);
  for(const name of ['Aktiv','Gözləmədə','Rədd edilib','Müddəti bitib','Silinmiş'])assert.equal(await tabs.getByRole('button',{name:new RegExp('^'+name)}).count(),1,'Core state remains available: '+name);
  if(scenario.visible){await payment.click();if(scenario.items.length){await p.locator('.accountListings article').first().waitFor();assert.equal((await payment.locator('b').innerText()).trim(),'1');}else await p.getByText('Ödəniş gözləyən elan yoxdur.',{exact:true}).waitFor();}
  assert.equal(writes,0);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);console.log('PASS',scenario.name,'correct payment visibility, stable states and no payment writes');await p.close();
 }}finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
