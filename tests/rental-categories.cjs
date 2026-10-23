// All accounts, uploads and listing requests are local browser fixtures.
const assert=require('node:assert/strict');const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{for(const width of [390,1440]){
const ctx=await b.newContext({viewport:{width,height:900},hasTouch:true});const p=await ctx.newPage();const errors=[];let saved, profileItem;
p.on('pageerror',e=>errors.push(e.message));
if(process.env.TEST_LEGACY) await ctx.addInitScript(()=>{
 for(const [object,key] of [[Object,'hasOwn'],[Array.prototype,'at'],[AbortSignal,'timeout'],[crypto,'randomUUID']]) Object.defineProperty(object,key,{value:undefined,writable:true,configurable:true});
});
const id='11111111-1111-4111-8111-111111111111',listingId='22222222-2222-4222-8222-222222222222';
const user={id,email:'fixture@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},created_at:new Date().toISOString()};
const jwt=Buffer.from(JSON.stringify({alg:'HS256'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:id,exp:Math.floor(Date.now()/1000)+3600,aud:'authenticated'})).toString('base64url')+'.test';
await ctx.addInitScript(session=>localStorage.setItem('sb-browser-test-auth-token',JSON.stringify(session)),{access_token:jwt,refresh_token:'test-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user});
await p.route('https://*.supabase.co/**',async r=>{
 const req=r.request(),path=new URL(req.url()).pathname,headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'};let body={};
 if(req.method()==='OPTIONS')return r.fulfill({status:204,headers});
 if(path.endsWith('/user'))body=user;
 else if(path.includes('/profiles'))body=req.method()==='GET'?{id,role:'user',display_name:'Fixture',phone:'+994501234567'}:{};
 else if(path.includes('/rpc/'))body=true;
 else if(path.includes('/listings')&&req.method()==='POST'){saved=req.postDataJSON();body={id:listingId};}
 else if(path.includes('/listings'))body=profileItem?[profileItem]:[];
 else if(path.includes('/storage/'))body={Key:'test.png',Id:listingId};
 else if(path.includes('/settings'))body={external:{email:true}};
 return r.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify(body)});
});
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3013';
const cases=process.env.TEST_ONLY_PROFILE ? [] : [['electric','Elektrik skuter','Bir şarjla yürüş məsafəsi (km)','35'],['clothing','Kostyum','Ölçü haqqında əlavə məlumat','Boy 175 sm'],['equipment','Qaynaq aparatı','Maksimum qaynaq cərəyanı (A)','200'],['photo','Obyektiv','Uyğun kamera bağlantısı','Sony E'],['camping','Çadır','Neçə nəfərlikdir','3'],['event','Masa və stul','Dəstdə neçə ədəd var','20']];
for(const [category,kind,field,value] of cases){
 await p.goto(base+'/new');await p.getByLabel('Kateqoriya',{exact:true}).selectOption(category);
 const next=()=>p.getByRole('button',{name:'Davam et →',exact:true}).click();await next();
 await p.locator('select[name=kind]').selectOption(kind);
 if(category==='electric'){
  await p.getByLabel('Marka',{exact:true}).selectOption('Xiaomi');await p.getByLabel('Model',{exact:true}).selectOption('Electric Scooter 4');
  await p.getByLabel(field,{exact:true}).fill('35');await p.locator('select[name=kind]').selectOption('Elektrik velosiped');
  assert.equal(await p.getByLabel('Marka',{exact:true}).inputValue(),'');assert.equal(await p.getByLabel('Marka',{exact:true}).locator('option[value=Xiaomi]').count(),0);
  assert.equal(await p.getByLabel(field,{exact:true}).inputValue(),'');await p.locator('select[name=kind]').selectOption(kind);
 }
 await p.getByLabel(field,{exact:true}).fill(value);
 assert.equal(await p.locator('input[name=engine_cc]').count(),0);assert.equal(await p.locator('select[name=gearbox]').count(),0);
 await p.getByLabel('Elanın başlığı',{exact:true}).fill(kind+' kirayəsi üçün sınaq elanı');await p.getByLabel('Şəhər',{exact:true}).selectOption('Bakı');await p.getByLabel('Qiymət (₼)',{exact:true}).fill('30');await p.getByLabel('Ətraflı təsvir',{exact:true}).fill('Məhsul saz vəziyyətdədir və ətraflı kirayə şərtləri razılaşdırılır.');
 await next();await p.getByLabel('Elan şəkilləri',{exact:true}).setInputFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aK1cAAAAASUVORK5CYII=','base64')});await next();
 await p.getByLabel(/Telefon nömrəsi/).fill('0501234567');await p.locator('input[type=checkbox][required]').check();await p.getByRole('button',{name:'Elanı yoxlamaya göndər →',exact:true}).click();
 await p.getByRole('heading',{name:'Elanın yoxlamaya göndərildi'}).waitFor();assert.equal(saved.category,category);assert.equal(saved.attributes.kind,kind);assert.equal(saved.attributes.engine_cc,undefined);assert(Object.values(saved.attributes).includes(value));
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);console.log('PASS category-specific posting and saved specifications',width,category);
}
profileItem={...(saved || {owner_id:id,title:'Səliqəli kirayə elanı',category:'electric',price:30,rental_period:'daily',description:'Saz vəziyyətdə kirayə məhsulu.',contact:'+994501234567'}),id:listingId,created_at:new Date().toISOString(),status:'published',images:['/car.svg']};
await p.goto(base+'/profile');const article=p.locator('.accountListings article').first();await article.waitFor();
assert((await article.boundingBox()).height < (width < 720 ? 380 : 260));
assert.equal(await article.locator('.promotionPanel').isVisible(),false);
await article.locator('.promotionTrigger').click();await article.locator('.promotionPanel').waitFor();
assert.equal(await article.locator('.paymentChoices input[type=radio]').count(),18);
const firstPackage=article.locator('.promotionPackage').first();
await firstPackage.locator('summary').first().click();
await firstPackage.getByRole('radio',{name:'9 dəfə (8 saatdan bir) — 2 AZN',exact:true}).check();
await firstPackage.getByRole('radio',{name:'Şəxsi hesab (0,00 AZN)',exact:true}).check();
await firstPackage.locator('.inactivePayment summary').click();
await firstPackage.getByRole('status').filter({hasText:'Texniki işlər aparılır'}).waitFor();

assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
await p.screenshot({path:`/tmp/kiraye-category-profile-${width}.png`,fullPage:true});
await p.getByRole('button',{name:'Reklam pəncərəsini bağla',exact:true}).click();assert.equal(await article.locator('.promotionPanel').isVisible(),false);
await p.getByRole('region',{name:'Şəxsi hesabın balansı'}).locator('summary').click();
await p.getByRole('region',{name:'Şəxsi hesabın balansı'}).getByRole('status').waitFor();
console.log('PASS compact owner promotion control and listing proportions',width);
assert.deepEqual(errors,[]);await ctx.close();
}}finally{await b.close()}
})().catch(e=>{console.error(e);process.exit(1)});
