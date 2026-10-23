// Reuse Next's maintained compatibility bundle, also for older module browsers.
// Next normally serves it only to browsers without ES modules.
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const source = await readFile(require.resolve('next/dist/build/polyfills/polyfill-nomodule.js'), 'utf8');
await mkdir(new URL('../public/', import.meta.url), { recursive: true });
await writeFile(new URL('../public/browser-compat.js', import.meta.url),
  '/* Next.js compatibility bundle (MIT), generated from the installed Next.js version. */\n' + source + `\n(function () {
 if (typeof AbortSignal !== 'undefined' && !AbortSignal.timeout && typeof AbortController !== 'undefined') {
  AbortSignal.timeout = function (ms) { var c = new AbortController(); setTimeout(function () { c.abort(); }, ms); return c.signal; };
 }
 if (typeof crypto !== 'undefined' && !crypto.randomUUID && crypto.getRandomValues) {
  crypto.randomUUID = function () { var a = new Uint8Array(16); crypto.getRandomValues(a); a[6]=(a[6]&15)|64; a[8]=(a[8]&63)|128; var s=''; for(var i=0;i<16;i++){ if(i===4||i===6||i===8||i===10)s+='-'; s+=('0'+a[i].toString(16)).slice(-2); } return s; };
 }
})();\n`);
