// Authentication responses are mocked: no account, password or e-mail is changed.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const base=process.env.KIRAYE_TEST_BASE_URL||'http://127.0.0.1:3000';
async function mock(page,error='INVALID_CREDENTIALS',status=401){
 await page.route('**/api/auth/google/status',r=>r.fulfill({json:{enabled:true}}));
 await page.route('**/api/auth/host',r=>{
  if(r.request().method()==='GET')return r.fulfill({json:{user:null}});
  const action=r.request().postDataJSON().action;
  if(action==='request_recovery'||action==='reset_password')return r.fulfill({json:{ok:true}});
  return r.fulfill({status:action==='verify'?400:status,json:{error:action==='verify'?'INVALID_CODE':error,...(error==='TOO_MANY_ATTEMPTS'?{retry_at:new Date(Date.now()+15*60*1000).toISOString()}:{})}});
 });
}
async function credentials(p){await p.locator('input[name=email]').fill('preview@example.invalid');await p.locator('#auth-password').fill('ExamplePassword123');}
(async()=>{
 const b=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined)});
 try{
 for(const width of [320,375,768,1440]){
  const p=await b.newPage({viewport:{width,height:900}});await mock(p);await p.goto(base+'/login');await p.locator('.googleButton').waitFor();await credentials(p);await p.locator('.authSubmit').click();const alert=p.locator('#auth-error[role=alert]');await alert.waitFor();assert.match(await alert.innerText(),/E-poçt və ya şifrə yanlışdır/);const color=await alert.evaluate(n=>getComputedStyle(n).color.match(/\d+/g).map(Number));assert.ok(color[0]>color[1]*1.5,'Error text must remain visibly red despite legacy notice styles');
  const errorBox=await alert.boundingBox(),buttonBox=await p.locator('.authSubmit').boundingBox();assert.ok(errorBox.y+errorBox.height<=buttonBox.y,'Failure must appear before the submit button');
  assert.equal(await p.locator('#auth-password').getAttribute('aria-invalid'),'true');assert.equal(await p.locator('#auth-password').inputValue(),'ExamplePassword123');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await p.locator('#auth-password').fill('CorrectedPassword123');assert.equal(await alert.count(),0);assert.equal(await p.locator('#auth-password').getAttribute('aria-invalid'),null);console.log('PASS',width,'Google-enabled layout, visible error, linked invalid fields, retained password and cleared correction');await p.close();
 }
 const rate=await b.newPage();await mock(rate,'TOO_MANY_ATTEMPTS',429);await rate.goto(base+'/login');await credentials(rate);await rate.locator('.authSubmit').click();await rate.locator('#auth-error').waitFor();assert.equal(await rate.locator('.authSubmit').isDisabled(),true);await rate.getByRole('status').filter({hasText:'15 dəqiqə'}).waitFor();assert.equal(await rate.locator('#auth-password').getAttribute('aria-invalid'),null);console.log('PASS retry countdown uses server retry_at, with no false invalid-password marker');await rate.close();
 const code=await b.newPage();await mock(code);await code.goto(base+'/login?mode=reset');await code.locator('input[name=email]').fill('preview@example.invalid');await code.locator('.authSubmit').click();await code.locator('input[name=code]').fill('000000');await code.locator('.authSubmit').click();await code.getByRole('alert').filter({hasText:'Kod düzgün deyil'}).waitFor();assert.equal(await code.locator('#auth-error').count(),1);console.log('PASS incorrect verification code appears as one error near its form');await code.close();
 const reset=await b.newPage();await reset.addInitScript(()=>sessionStorage.setItem('kiraye:recovery',JSON.stringify({email:'preview@example.invalid',code:'123456',expiresAt:Date.now()+600000})));await mock(reset);await reset.goto(base+'/reset-password');await reset.locator('input[name=password]').fill('NewPassword123');await reset.locator('input[name=confirm]').fill('OtherPassword123');await reset.locator('.authSubmit').click();await reset.getByRole('alert').filter({hasText:'Şifrələr eyni olmalıdır'}).waitFor();await reset.locator('input[name=confirm]').fill('NewPassword123');await reset.locator('.authSubmit').click();await reset.locator('.kzFeedback[data-tone=success][role=status]').waitFor();assert.equal(await reset.locator('.kzFeedback[role=alert]').count(),0);console.log('PASS reset distinguishes mismatch failure from confirmed success');await reset.close();
 }finally{await b.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
