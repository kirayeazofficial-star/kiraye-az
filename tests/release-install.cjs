// Run the real installer only against disposable fixtures. Network and database are not used.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const {spawnSync}=require('node:child_process');
(async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'kiraye-release-'));
 try{
  const source=path.join(root,'release'),app=path.join(root,'app'),backups=path.join(root,'.kirayeal-backups');
  for(const name of ['.next/standalone/.next/static','.next/standalone/public'])await fs.mkdir(path.join(source,name),{recursive:true});
  await fs.writeFile(path.join(source,'.next/standalone/server.js'),'// fixture');
  await fs.writeFile(path.join(source,'.next/BUILD_ID'),'new-build');
  await fs.writeFile(path.join(source,'RELEASE.json'),JSON.stringify({commit:'fixture',buildId:'new-build'}));
  await fs.writeFile(path.join(source,'app.js'),'// stable entrypoint');
  await fs.mkdir(path.join(app,'.next'),{recursive:true});
  await fs.writeFile(path.join(app,'.next/BUILD_ID'),'old-build');
  await fs.writeFile(path.join(app,'app.js'),'// stable entrypoint');
  await fs.writeFile(path.join(app,'.env.production.local'),'FIXTURE_SENTINEL=preserved\n');
  await fs.mkdir(path.join(app,'uploads'));await fs.writeFile(path.join(app,'uploads','keep.jpg'),'original-photo');
  await fs.mkdir(backups);await fs.writeFile(path.join(backups,'database.sql'),'database-backup');
  for(const name of ['2020-01-01-previous-build','2021-01-01-previous-build'])await fs.mkdir(path.join(backups,name));
  const mock=path.join(root,'mock-fetch.mjs');await fs.writeFile(mock,'globalThis.fetch=async()=>({ok:true,json:async()=>({status:"ok",buildId:"new-build"})});');
  const run=()=>spawnSync(process.execPath,['--import',mock,path.resolve('scripts/install-release.mjs'),app],{cwd:source,encoding:'utf8',timeout:20000});
  const result=run();assert.equal(result.status,0,result.stderr);assert.ok(result.stdout.includes('HTTP verified'));
  const old=(await fs.readdir(backups)).filter(n=>n.endsWith('-previous-build'));assert.equal(old.length,1);assert.equal(await fs.readFile(path.join(backups,old[0],'BUILD_ID'),'utf8'),'old-build');
  assert.equal(await fs.readFile(path.join(app,'.next/BUILD_ID'),'utf8'),'new-build');
  assert.equal(await fs.readFile(path.join(app,'.env.production.local'),'utf8'),'FIXTURE_SENTINEL=preserved\n');assert.equal(await fs.readFile(path.join(app,'uploads/keep.jpg'),'utf8'),'original-photo');assert.equal(await fs.readFile(path.join(backups,'database.sql'),'utf8'),'database-backup');
  console.log('PASS successful install keeps one previous build and preserves settings, original photos and database backups');
  // A failure after swapping the build must restore the version that was live.
  await fs.rm(path.join(app,'DEPLOYED-RELEASE.json'));await fs.mkdir(path.join(app,'DEPLOYED-RELEASE.json'));
  const failed=run();assert.equal(failed.status,1);assert.ok(failed.stderr.includes('Previous build restored'));
  assert.equal(await fs.readFile(path.join(app,'.next/BUILD_ID'),'utf8'),'new-build');
  console.log('PASS interrupted install restores the previous live build');
 }finally{await fs.rm(root,{recursive:true,force:true})}
})().catch(error=>{console.error(error);process.exitCode=1});
