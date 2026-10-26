// Run only in an operator transaction; all managed fixtures are rolled back.
const crypto=require('node:crypto');
module.exports=async c=>{
 const passed=[];let sequence=0;const check=(v,name)=>{if(!v)throw Object.assign(Error('assertion_failed'),{test:name});passed.push(name);};
 async function as(id,recent=true,role='authenticated'){await c.query('RESET ROLE');const claims=id?{sub:id,role,amr:[{method:'password',timestamp:Math.floor(Date.now()/1000)-(recent?0:3600)}]}:{role};await c.query("SELECT set_config('request.jwt.claims',$1,true)",[JSON.stringify(claims)]);if(role!=='postgres')await c.query('SET LOCAL ROLE '+role);}
 async function denied(sql,args,codes,name){const key='profile_denied_'+(++sequence);await c.query('SAVEPOINT '+key);let hit=false;try{await c.query(sql,args);}catch(e){hit=codes.includes(e.code);}await c.query('ROLLBACK TO SAVEPOINT '+key);await c.query('RELEASE SAVEPOINT '+key);check(hit,name);}
 await c.query('SAVEPOINT profile_contact_fixtures');await as(null,true,'postgres');const ids=[crypto.randomUUID(),crypto.randomUUID()];
 for(const id of ids)await c.query("INSERT INTO auth.users(id,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data) VALUES($1,$2,now(),'{\"provider\":\"email\"}','{\"full_name\":\"Codex Profile\",\"contact_phone\":\"+994500000001\"}')",[id,'codex-profile-'+id+'@example.invalid']);
 await as(ids[0]);let status=(await c.query('SELECT public.own_profile_contact_status() AS value')).rows[0].value;check(status.phone_remaining===3&&status.email_remaining===3,'initial registration consumes no changes');check(status.phone_verified===false,'phone is never marked SMS verified');const profileNo=status.profile_no;
 await c.query('SELECT public.update_own_profile($1,$2)',['Codex Changed Name','050 000 00 01']);status=(await c.query('SELECT public.own_profile_contact_status() AS value')).rows[0].value;check(status.phone_changes===0&&status.name==='Codex Changed Name','name and equivalent formatted phone consume no allowance');
 await as(ids[0],false);await denied('SELECT public.update_own_profile($1,$2)',['Codex Changed Name','+994500000002'],['PRA01'],'stale sign-in cannot change phone');
 await as(ids[0]);await denied('SELECT public.update_own_profile($1,$2)',['Codex Changed Name','+99450BAD0000002'],['22023'],'invalid phone text is rejected');
 for(const phone of ['+994500000002','+994500000003','+994500000004'])await c.query('SELECT public.update_own_profile($1,$2)',['Codex Changed Name',phone]);
 status=(await c.query('SELECT public.own_profile_contact_status() AS value')).rows[0].value;check(status.phone_changes===3&&status.phone_remaining===0,'three successful phone changes counted exactly');
 await c.query('SELECT public.update_own_profile($1,$2)',['Codex Another Name','+994500000004']);await denied('SELECT public.update_own_profile($1,$2)',['Codex Another Name','+994500000005'],['PCL03'],'fourth successful phone change is blocked');
 await denied('UPDATE public.profile_contact_changes SET phone_changes=0 WHERE user_id=$1',[ids[0]],['42501'],'browser cannot reset change counters');
 await as(ids[1]);status=(await c.query('SELECT public.own_profile_contact_status() AS value')).rows[0].value;check(status.phone_remaining===3&&status.email_remaining===3,'another account has its own allowance');
 await denied('SELECT * FROM public.profile_contact_changes WHERE user_id=$1',[ids[0]],['42501'],'private change counters are not enumerable');
 await as(null,true,'postgres');await c.query("UPDATE auth.users SET email_change='pending@example.invalid' WHERE id=$1",[ids[0]]);await c.query("UPDATE auth.users SET email_change='' WHERE id=$1",[ids[0]]);
 await as(ids[0]);status=(await c.query('SELECT public.own_profile_contact_status() AS value')).rows[0].value;check(status.email_changes===0,'pending and cancelled email requests do not count');
 await as(null,true,'postgres');for(let n=1;n<=3;n++)await c.query('UPDATE auth.users SET email=$1 WHERE id=$2',['codex-confirmed-'+n+'-'+ids[0]+'@example.invalid',ids[0]]);
 await as(ids[0]);status=(await c.query('SELECT public.own_profile_contact_status() AS value')).rows[0].value;check(status.email_changes===3&&status.email_remaining===0,'only actual confirmed email changes consume allowance');check(String(status.profile_no)===String(profileNo),'account number preserved across profile changes');
 await as(null,true,'postgres');await denied('UPDATE auth.users SET email=$1 WHERE id=$2',['fourth-'+ids[0]+'@example.invalid',ids[0]],['PCL03'],'fourth confirmed email change is blocked');
 await denied("UPDATE auth.users SET email_change='another@example.invalid' WHERE id=$1",[ids[0]],['PCL03'],'new email request blocked after exhausted allowance');
 await as(ids[0]);const ad=crypto.randomUUID();await c.query("INSERT INTO public.listings(id,owner_id,category,title,city,price,rental_period,status,description,contact,images,attributes) VALUES($1,$2,'equipment','CODEX PRIMARY PHONE','Bakı',25,'daily','pending','Yalnız geri qaytarılan profil sınağı üçün yaradılıb','+994559999999',$3,'{}')",[ad,ids[0],['https://bqvfrcxojlaezlmckjox.supabase.co/storage/v1/object/public/listing-images/'+ids[0]+'/test.jpg']]);
 check((await c.query('SELECT contact FROM public.listings WHERE id=$1',[ad])).rows[0].contact==='+994500000004','new listing uses server primary phone');
 await denied('UPDATE public.listings SET contact=$1 WHERE id=$2',['+994559999998',ad],['42501'],'direct listing update cannot bypass primary phone');
 await denied('SELECT public.allow_profile_change_attempt($1)',[ids[1]],['42501'],'browser cannot reset or call server attempt gate');
 await as(null,true,'service_role');for(let n=1;n<=9;n++)check((await c.query('SELECT public.allow_profile_change_attempt($1) AS value',[ids[0]])).rows[0].value===(n<=8),'server attempt limit '+n);
 await as(null,true,'anon');await denied('SELECT public.own_profile_contact_status()',[],['42501'],'anonymous cannot read a profile');
 await as(null,true,'postgres');await c.query('ROLLBACK TO SAVEPOINT profile_contact_fixtures');await c.query('RELEASE SAVEPOINT profile_contact_fixtures');return passed;
};
