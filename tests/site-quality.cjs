const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file,imports={},globals={}){const e={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,{exports:e,require:n=>n in imports?imports[n]:require(n),...globals});return e;}
(async()=>{
 for(const value of [undefined,null,false,true,'true']){const mod=load('lib/host/site-flags.ts',{'server-only':{},'./db':{hostQuery:async()=>value===undefined?[]:[{enabled:value}]}});assert.equal(await mod.paymentsEnabled(),value===true);}
 const broken=load('lib/host/site-flags.ts',{'server-only':{},'./db':{hostQuery:async()=>{throw Error('unavailable')}}});assert.equal(await broken.paymentsEnabled(),false);
 let calls=0;const flags=load('lib/use-site-flags.ts',{react:{}},{fetch:async()=>{calls++;if(calls===1)throw Error('offline');return {ok:true,json:async()=>({payments:false,leader:true})}}});
 assert.equal((await flags.loadSiteFlags()).payments,false);assert.equal((await flags.loadSiteFlags()).leader,true);assert.equal(flags.paidVisible({payments:false,leader:false}),false);assert.equal(flags.paidVisible({payments:false,leader:true}),true);
 for(const response of [{ok:false,json:async()=>({payments:true,leader:true})},{ok:true,json:async()=>({})}]){const m=load('lib/use-site-flags.ts',{react:{}},{fetch:async()=>response});assert.equal((await m.loadSiteFlags()).payments,false);assert.equal((await m.loadSiteFlags()).leader,false);}
 const {catalogPreview}=load('lib/catalog-preview.ts');const real=Array.from({length:18},(_,i)=>`real-${i}`),samples=Array.from({length:36},(_,i)=>`sample-${i}`);
 const {safeLoginDestination}=load('lib/auth-messages.ts');assert.equal(safeLoginDestination('/messages'),'/messages');assert.equal(safeLoginDestination('/balance'),'/balance');
 for(const unsafe of ['https://example.com','//example.com','/messages?next=https://example.com','/unknown',null])assert.equal(safeLoginDestination(unsafe),'/profile');
 assert.equal(catalogPreview(real,samples,18).length,18);assert.equal(catalogPreview(real.slice(0,2),samples,18).length,18);assert.equal(catalogPreview(real.slice(0,2),samples,18)[0],'real-0');assert.equal(catalogPreview(real.slice(0,2),samples,18)[2],'sample-0');assert.equal(catalogPreview([],samples,18).length,18);
 const {codeLetter,noticeLetter,verificationLetter}=await import('../scripts/email-frame.mjs');const letter=codeLetter({heading:'Hesabınızı təsdiqləyin',name:'<script>',intro:'Təsdiq kodunu daxil edin.',code:'123456',note:'10 dəqiqə'});assert.ok(letter.html.includes('&lt;script&gt;'));assert.ok(!letter.html.includes('<script>'));assert.ok(!letter.html.includes('&nbsp;&nbsp;'));assert.ok(letter.text.includes('123456'));
 const purposes={signup:'qeydiyyat səhifəsində',recovery:'şifrə bərpası səhifəsində',email_change:'«Profil» bölməsində',staff_login:'giriş səhifəsində'};
 for(const [purpose,destination] of Object.entries(purposes)){
  const mail=verificationLetter(purpose,'<Aysel>','123456');
  for(const format of [mail.html,mail.text]){assert.ok(format.includes(destination));assert.ok(format.includes('10 dəqiqə'));assert.ok(format.includes('123456'));assert.ok(format.includes('heç kimlə paylaşmayın'));assert.ok(format.includes('avtomatik göndərilib'));assert.ok(format.includes('komandası.'));}
  assert.ok(mail.subject.endsWith('— kirayeal.az'));assert.ok(!mail.html.includes('<Aysel>'));assert.ok(!/display:none[^>]*>[^<]*123456/.test(mail.html),'Inbox preview must describe the operation without exposing the code');
 }
 const notice=noticeLetter({heading:'Yeni mesaj',name:'Aysel',intro:'Yeni mesajınız var.',rows:[{label:'Elan',value:'<b>Mənzil</b>'}],button:{text:'Mesajı oxuyun',href:'/messages'}});assert.ok(notice.html.includes('&lt;b&gt;'));assert.ok(notice.text.includes('/messages'));
 const prose=noticeLetter({heading:'Məlumat yeniləndi',intro:'Məlumatlarınız yadda saxlanıldı',note:'Əlavə məlumat üçün şəxsi kabinetə keçin.',rows:[{label:'Elan',value:'Mənzil — № 123'}]});for(const output of [prose.html,prose.text]){assert.ok(output.includes('Məlumatlarınız yadda saxlanıldı.'));assert.ok(output.includes('Əlavə məlumat üçün şəxsi kabinetə keçin.'));assert.ok(!output.includes('keçin..'));assert.ok(output.includes('Mənzil — № 123'));}
 console.log('PASS fail-closed settings, reconnect recovery, leader permissions, bounded sample pages, email escaping and fallback links');
})().catch(e=>{console.error(e);process.exitCode=1});
