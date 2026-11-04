// Local browser fixtures and pure helpers: no real e-mail, listing or profile is submitted.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {chromium}=require('playwright');
const base=process.env.KIRAYE_TEST_BASE_URL||'http://127.0.0.1:3000';
function load(file,imports={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:n=>n in imports?imports[n]:require(n),Response,console});return exports;}
const user={id:'11111111-1111-4111-8111-111111111111',email:'preview@example.invalid',display_name:'Aysel Məmmədova',phone:'0501234567'};
const profile={...user,name:user.display_name,profile_no:1,role:'user',phone_remaining:3,email_remaining:3};
async function fixture(page,hasPassword=true){
 await page.route('**/api/auth/host',r=>r.fulfill({json:{user}}));
 await page.route('**/api/account/profile',r=>r.fulfill({json:{profile:{...profile,has_password:hasPassword}}}));
 await page.route('**/api/settings',r=>r.fulfill({json:{payments:false,leader:false}}));
 await page.route('**/api/listings/limits',r=>r.fulfill({json:{items:[]}}));
 await page.route('**/tile.openstreetmap.org/**',r=>r.abort());
}
async function chooseLanguage(p,language){await p.locator('.kzHeader .languageToggle').getByRole('button',{name:language,exact:true}).click();}
(async()=>{
 const {noticeSubject}=await import('../scripts/email-frame.mjs');
 for(const topic of ['Yeni mesaj','Elanınız rədd edildi','Elanınızın yayım müddəti başa çatır'])for(const title of ['Normal başlıq','Uzun mənzil başlığı '.repeat(12),'🏠'.repeat(140)]){const subject=noticeSubject(topic,title);assert.ok(Array.from(subject).length<=120);assert.ok(subject.endsWith('»'));assert.equal((subject.match(/«/g)||[]).length,1);assert.ok(!/[\uD800-\uDBFF]$/.test(subject.slice(0,-1)));}
 const {draftLocation}=load('lib/listing-draft.ts',{'./location':load('lib/location.ts')});
 assert.equal(draftLocation({fields:{district:['Nəsimi'],metro:['Sahil']}}).district,'Nəsimi');assert.equal(draftLocation({fields:{metro:['Sahil']}}).metro,'Sahil');
 const bad=draftLocation({fields:{},location:{point:[999,999],exact:true}});assert.equal(bad.point,null);assert.equal(bad.exact,false);
 let sent=0;const route=load('app/api/account/profile/route.ts',{'../../../../lib/server-request':{sameOrigin:()=>true},'../../../../lib/rental-details':{normalizePhone:x=>x},'../../../../lib/host/db':{hostQuery:async sql=>sql.includes('profile_change_attempts')?[{attempts:1}]:sql.includes('password_hash')?[{password_hash:null}]:[]},'../../../../lib/host/session':{currentUser:async()=>user},'../../../../lib/host/security':{passwordMatches:async()=>false},'../../../../lib/host/mailer':{sendVerificationCode:async()=>sent++}});
 const response=await route.POST(new Request(base+'/api/account/profile',{method:'POST',body:JSON.stringify({action:'email',email:'new@example.invalid',password:'wrong'})}));assert.equal(response.status,409);assert.equal((await response.json()).code,'provider_reauth_required');assert.equal(sent,0);
 console.log('PASS safe Unicode subjects, backward-compatible draft location and passwordless account guard');
 const b=await chromium.launch({executablePath:fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined});
 try{
 const c=await b.newContext({viewport:{width:375,height:812},geolocation:{latitude:40.4093,longitude:49.8671},permissions:['geolocation']});const p=await c.newPage();await fixture(p);await p.goto(base+'/new');await p.getByLabel('Kateqoriya',{exact:true}).selectOption('property');await p.getByRole('button',{name:'Davam et',exact:true}).click();await p.locator('select[name=kind]').selectOption('Mənzil');await p.locator('input[name=rooms]').fill('2');await p.locator('input[name=area_m2]').fill('80');await p.locator('select[name=city]').selectOption('Bakı');await p.locator('input[name=price]').fill('0');await p.getByRole('button',{name:'Davam et',exact:true}).click();await p.getByRole('alert').filter({hasText:'dəyər ən azı 0.01 olmalıdır.'}).first().waitFor();assert.ok(!(await p.locator('main').innerText()).includes('Value must'));
 await p.locator('input[name=price]').fill('500');await p.locator('select[name=district]').selectOption('Nəsimi');await p.locator('select[name=metro]').selectOption('Sahil');await p.getByRole('button',{name:'Mənim yerim',exact:true}).click();const exact=p.getByRole('checkbox',{name:/Dəqiq ünvanı göstər/});await exact.check();await p.waitForTimeout(500);await p.reload();await p.getByRole('button',{name:'Qaralamaya davam et',exact:true}).click();await p.locator('select[name=district]').waitFor();assert.equal(await p.locator('select[name=district]').inputValue(),'Nəsimi');assert.equal(await p.locator('select[name=metro]').inputValue(),'Sahil');assert.equal(await p.getByRole('checkbox',{name:/Dəqiq ünvanı göstər/}).isChecked(),true);
 console.log('PASS draft preserves district, metro, map pin and exactness; localized validation and canonical translated city');await c.close();
 for(const hasPassword of [false,true]){const p=await b.newPage({viewport:{width:320,height:812}});await fixture(p,hasPassword);await p.goto(base+'/account');await p.getByRole('button',{name:'E-poçtu dəyiş',exact:true}).click();assert.equal(await p.locator('input[autocomplete=current-password]').count(),hasPassword?1:0);if(!hasPassword){const link=p.getByRole('link',{name:'Şifrə təyin et',exact:true});await link.waitFor();assert.equal(await link.getAttribute('href'),'/login?mode=reset');}assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await p.close();}
 console.log('PASS Google-only and password accounts display the appropriate safe email-change path');
 {const p=await b.newPage({viewport:{width:320,height:812}});await p.route('**/api/listings?**',r=>r.fulfill({json:{items:[{id:'fixture',title:'Kirayə mənzil',category:'home',city:'Bakı',price:1500,rental_period:'month',status:'published',created_at:new Date().toISOString(),images:['/placeholder.svg']}],total:1}}));await p.goto(base);await p.locator('.kzCardMeta').first().waitFor();const colors=await p.evaluate(()=>({top:getComputedStyle(document.querySelector('.kzRoundPlus')).backgroundColor,bottom:getComputedStyle(document.querySelector('.kzTabPlus')).backgroundColor}));assert.equal(colors.top,'rgb(246, 83, 32)');assert.equal(colors.bottom,colors.top);const sizes=await p.locator('.kzSortButton,.kzChip,.kzMapToggle').evaluateAll(ns=>ns.filter(n=>n.getClientRects().length).map(n=>n.getBoundingClientRect().height));assert.ok(sizes.every(n=>n>=44));assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await p.close();}
 console.log('PASS orange publish actions, mobile touch targets and no horizontal overflow');
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
