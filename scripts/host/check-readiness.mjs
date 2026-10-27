import { access } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const required=['KIRAYE_DB_HOST','KIRAYE_DB_NAME','KIRAYE_DB_USER','KIRAYE_DB_PASSWORD','KIRAYE_SESSION_SECRET','KIRAYE_STORAGE_ROOT'];
const missing=required.filter(name=>!process.env[name]?.trim());
if(missing.length){console.error(`Missing server settings: ${missing.join(', ')}`);process.exit(1);}
if((process.env.KIRAYE_SESSION_SECRET||'').length<32){console.error('KIRAYE_SESSION_SECRET must contain at least 32 characters.');process.exit(1);}
await access(process.env.KIRAYE_STORAGE_ROOT);
const args=['--batch','--skip-column-names','--host',process.env.KIRAYE_DB_HOST,'--port',process.env.KIRAYE_DB_PORT||'3306','--user',process.env.KIRAYE_DB_USER,process.env.KIRAYE_DB_NAME,'--execute','SELECT VERSION(), DATABASE(), CURRENT_USER();'];
const env={...process.env,MYSQL_PWD:process.env.KIRAYE_DB_PASSWORD};
const child=spawn('mysql',args,{env,stdio:['ignore','pipe','pipe']});
let output='',error='';child.stdout.on('data',value=>output+=value);child.stderr.on('data',value=>error+=value);
const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve);});
if(code!==0){console.error('MariaDB connection failed. Credentials were not printed.');if(error)console.error(error.trim().split('\n').at(-1));process.exit(1);}
console.log('MariaDB connection verified:',output.trim());
console.log('Storage directory verified. Host-only prerequisites are ready for schema installation.');
