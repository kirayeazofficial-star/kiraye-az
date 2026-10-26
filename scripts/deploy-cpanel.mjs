// Run from the uploaded SOURCE package, outside the live application directory.
// Preserves the existing external database/Auth, secrets and nodevenv. No SQL is run.
import {access,readFile,writeFile,copyFile,cp,mkdir,rename,rm,symlink,lstat,chmod,realpath} from 'node:fs/promises';
import {dirname,resolve,join,relative,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
const source=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const target=resolve(process.argv[2]||'/home/kiraytfg/kirayeal');
const privateRoot=join(dirname(target),'.kirayeal-backups');
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const archive=join(privateRoot,stamp+'.tar.gz');
const lock=join(privateRoot,'deploy.lock');
let locked=false,activated=false,backupReady=false;
function run(command,args,cwd=source,env=process.env){return new Promise((ok,no)=>{const child=spawn(command,args,{cwd,env,stdio:'inherit'});child.on('error',no);child.on('exit',code=>code===0?ok():no(new Error(`${command} failed (${code}).`)));});}
async function exists(path){try{await access(path);return true;}catch{return false;}}
try{
 if(source===target||source.startsWith(target+'/'))throw new Error('Extract the update OUTSIDE the live kirayeal directory.');
 if(Number(process.versions.node.split('.')[0])<22)throw new Error('Activate the cPanel Node.js 22 environment first.');
 const manifest=JSON.parse(await readFile(join(source,'DEPLOY-FILES.json'),'utf8'));
 if(!Array.isArray(manifest.files)||!manifest.commit)throw new Error('Source manifest is missing.');
 for(const path of manifest.files){if(isAbsolute(path)||path.split('/').includes('..')||path.startsWith('.env')&&path!=='.env.example'||path.startsWith('.git/')||path==='node_modules'||path.startsWith('node_modules/'))throw new Error('Unsafe package path.');if(!(await lstat(join(source,path))).isFile())throw new Error('Package contains a non-file source entry.');}
 const current=JSON.parse(await readFile(join(target,'package.json'),'utf8'));
 const next=JSON.parse(await readFile(join(source,'package.json'),'utf8'));
 for(const [name,version] of Object.entries(next.dependencies||{})){if(current.dependencies?.[name]!==version)throw new Error(`Dependency changed (${name}). Separate dependency installation is required; live files were not changed.`);}
 await access(join(target,'app.js'));await access(join(target,'node_modules','next','package.json'));
 await mkdir(privateRoot,{recursive:true,mode:0o700});await chmod(privateRoot,0o700);
 await mkdir(lock);locked=true;
 await chmod(source,0o700);
 // Load only from the account's existing configuration. Never log values.
 const require=createRequire(join(target,'package.json'));
 require('@next/env').loadEnvConfig(target,false, {info(){},error(){}});
 for(const name of ['.env','.env.local','.env.production','.env.production.local'])if(await exists(join(target,name))){await copyFile(join(target,name),join(source,name));await chmod(join(source,name),0o600);}
 const env={...process.env,NEXT_PUBLIC_SITE_URL:process.env.NEXT_PUBLIC_SITE_URL||'https://kirayeal.az',KIRAYE_BUILD_WORKERS:'1',UV_THREADPOOL_SIZE:'1',NODE_OPTIONS:((process.env.NODE_OPTIONS||'')+' --v8-pool-size=1').trim()};
 // Refuse an accidental demo deployment over the user's live site.
 await run(process.execPath,['scripts/check-public-env.mjs'],source,env);
 if(await exists(join(source,'node_modules'))){if(await realpath(join(source,'node_modules'))!==await realpath(join(target,'node_modules')))throw new Error('Update folder has unexpected dependencies.');}
 else await symlink(join(target,'node_modules'),join(source,'node_modules'),'dir');
 console.log('Saving a private application backup (external database is not included)...');
 await run('tar',['-czf',archive,'--exclude=./node_modules','--exclude=./.next/cache','--exclude=./.git','--exclude=./core','--exclude=./core.*','-C',target,'.']);
 await chmod(archive,0o600);backupReady=true;
 await writeFile(join(privateRoot,stamp+'.json'),JSON.stringify({target,commit:manifest.commit,created_at:stamp,archive},null,2),{mode:0o600});
 console.log('Building the update separately with one worker...');
 await run('npm',['run','build','--','--webpack'],source,env);
 for(const path of ['.next/standalone/server.js','.next/BUILD_ID','.next/standalone/.next/BUILD_ID','.next/standalone/public','.next/standalone/.next/static'])await access(join(source,path));
 await run(process.execPath,['-e',`const{createRequire}=require('node:module');const{resolve}=require('node:path');const load=createRequire(resolve('.next/standalone/server.js'));load('next');load('next/dist/server/next-server');load('styled-jsx');`],source,env);
 const buildId=(await readFile(join(source,'.next/BUILD_ID'),'utf8')).trim();
 // Backup is complete and the new build is validated before any live code changes.
 activated=true;
 if(await exists(join(target,'.next')))await rename(join(target,'.next'),join(privateRoot,stamp+'-previous-build'));
 await cp(join(source,'.next'),join(target,'.next'),{recursive:true,filter:path=>!relative(join(source,'.next'),path).startsWith('cache')});
 for(const path of manifest.files){await mkdir(dirname(join(target,path)),{recursive:true});await copyFile(join(source,path),join(target,path));if(path.startsWith('public/'))await chmod(join(target,path),0o644);}
 await writeFile(join(target,'DEPLOYED-RELEASE.json'),JSON.stringify({commit:manifest.commit,buildId,created_at:stamp},null,2));
 await mkdir(join(target,'tmp'),{recursive:true});await writeFile(join(target,'tmp/restart.txt'),stamp);
 console.log('Source and build installed. Restart requested. Backup:',archive);
 console.log('Expected build:',buildId);
 let verified=false;
 for(let attempt=0;attempt<3;attempt++){
  try{const response=await fetch(`https://kirayeal.az/api/health?release=${encodeURIComponent(buildId)}`,{signal:AbortSignal.timeout(5000),cache:'no-store'});const data=await response.json();if(response.ok&&data.status==='ok'&&data.buildId===buildId){verified=true;break;}}catch{}
  if(attempt<2)await new Promise(done=>setTimeout(done,2000));
 }
 console.log(verified?'HTTP verified: the new build is responding.':'HTTP release NOT verified. Use cPanel Node.js Restart and inspect kirayeal.az.');
 console.log('Database migrations, SMTP/Google and host-only data migration are still pending. Payments remain inactive.');
}catch(error){
 console.error(error.message);
 if(activated&&backupReady){console.error('Restoring the application backup...');try{await run('tar',['-xzf',archive,'-C',target]);await mkdir(join(target,'tmp'),{recursive:true});await writeFile(join(target,'tmp/restart.txt'),stamp);console.error('Backup restored; inspect the site and cPanel status.');}catch{console.error('Automatic restore failed. Preserve the backup and inspect before further changes:',archive);}}
 else console.error('Live application files were not changed.');
 process.exitCode=1;
}finally{if(locked)await rm(lock,{recursive:true,force:true});}

