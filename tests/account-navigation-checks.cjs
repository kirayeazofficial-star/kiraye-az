// Operator transaction only. All temporary accounts/role events are rolled back.
const crypto=require('node:crypto');
module.exports=async c=>{
 const passed=[];let serial=0;const check=(v,name)=>{if(!v)throw Object.assign(Error('assertion_failed'),{test:name});passed.push(name);};
 async function as(id){await c.query('RESET ROLE');await c.query("SELECT set_config('request.jwt.claims',$1,true)",[JSON.stringify(id?{sub:id,role:'authenticated'}:{})]);if(id)await c.query('SET LOCAL ROLE authenticated');}
 async function denied(sql,args,codes,name){const save='navigation_deny_'+(++serial);await c.query('SAVEPOINT '+save);let hit=false;try{await c.query(sql,args);}catch(e){hit=codes.includes(e.code);}await c.query('ROLLBACK TO SAVEPOINT '+save);await c.query('RELEASE SAVEPOINT '+save);check(hit,name);}
 await c.query('SAVEPOINT navigation_fixtures');await as(null);const leader=(await c.query("SELECT user_id FROM public.staff_members WHERE staff_role='leader'")).rows[0]?.user_id;if(!leader)throw Error('leader_missing');
 const ids=[crypto.randomUUID(),crypto.randomUUID()];
 for(let i=0;i<2;i++)await c.query("INSERT INTO auth.users(id,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data) VALUES($1,$2,CASE WHEN $3 THEN now() ELSE NULL END,'{\"provider\":\"email\"}','{\"full_name\":\"Codex Navigation\",\"contact_phone\":\"+994500000007\"}')",[ids[i],'codex-nav-'+ids[i]+'@example.invalid',i===0]);
 const numbers=(await c.query('SELECT id,profile_no FROM public.profiles WHERE id=ANY($1::uuid[])',[ids])).rows;const number=id=>numbers.find(n=>n.id===id).profile_no;
 await as(leader);const found=(await c.query('SELECT public.leader_find_account($1) AS value',[String(number(ids[0]))])).rows[0].value;check(found.id===ids[0]&&String(found.profile_no)===String(number(ids[0])),'leader finds exact immutable numeric ID');
 for(const invalid of ['codex@example.invalid','+994500000007',ids[0]])await denied('SELECT public.leader_find_account($1)',[invalid],['22023'],'lookup rejects non-account-number format '+(++serial));
 await denied('SELECT public.leader_set_moderator($1,true)',[ids[0]],['42501'],'old UUID assignment endpoint is not callable');
 await denied('SELECT public.leader_set_moderator_by_number($1,true)',[number(ids[1])],['P0001','42501'],'unconfirmed account cannot be appointed');
 await c.query('SELECT public.leader_set_moderator_by_number($1,true)',[number(ids[0])]);
 await as(null);check((await c.query("SELECT role='admin' AS yes FROM public.profiles WHERE id=$1",[ids[0]])).rows[0].yes,'numeric assignment reaches intended account');check((await c.query("SELECT count(*)::int AS n FROM public.staff_events WHERE target_id=$1 AND action='moderator_granted'",[ids[0]])).rows[0].n===1,'assignment writes real audit record');
 await as(ids[0]);await denied('SELECT public.leader_find_account($1)',[String(number(ids[1]))],['42501'],'moderator cannot search assignment directory');
 await as(leader);const directory=(await c.query('SELECT public.leader_staff_directory() AS value')).rows[0].value;check(directory.members.some(m=>m.id===ids[0]&&String(m.profile_no)===String(number(ids[0]))),'staff directory includes numeric ID for revoke');
 const leaderNumber=(await c.query('SELECT profile_no FROM public.profiles WHERE id=$1',[leader])).rows[0].profile_no;await denied('SELECT public.leader_set_moderator_by_number($1,false)',[leaderNumber],['42501'],'leader cannot accidentally revoke own role');
 await c.query('SELECT public.leader_set_moderator_by_number($1,false)',[number(ids[0])]);await as(ids[0]);await denied('SELECT public.leader_staff_directory()',[],['42501'],'revoked moderator cannot read staff directory');
 const limits=(await c.query('SELECT public.own_listing_limits() AS value')).rows[0].value;check(limits.length>0&&limits.every(x=>Number(x.active_used)===0&&Number(x.period_used)===0&&x.exempt===false),'new account sees only own real zero usage');
 await as(null);await c.query('SET LOCAL ROLE anon');await denied('SELECT public.own_listing_limits()',[],['42501'],'anonymous cannot read account limits');
 await as(null);await c.query('ROLLBACK TO SAVEPOINT navigation_fixtures');await c.query('RELEASE SAVEPOINT navigation_fixtures');return passed;
};
