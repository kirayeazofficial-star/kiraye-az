const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
let current=null;const exported={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/rules/page.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,{
 exports:exported,AbortSignal,
 require:name=>{
  if(name==='react/jsx-runtime')return require(name);
  if(name.includes('lib/supabase'))return {get publicSupabase(){return current;}};
  if(name.includes('lib/marketplace'))return {categoryName:id=>id==='car'?'Avtomobil':id};
  if(name==='next/link')return {default:props=>React.createElement('a',{href:props.href},props.children)};
  return {default:()=>null};
 }
});
(async()=>{
 let html=renderToStaticMarkup(await exported.default());assert(html.includes('Bu hissə hələ qüvvəyə minməyib.'));
 current={rpc:()=>({abortSignal:async()=>({data:true,error:null})}),from:()=>({select:()=>({abortSignal:async()=>({data:[{category:'car',active_limit:3,period_limit:7}],error:null})})})};
 html=renderToStaticMarkup(await exported.default());assert(!html.includes('Bu hissə hələ qüvvəyə minməyib.'));assert(html.includes('Avtomobil'));assert(html.includes('<td>3</td>'));assert(html.includes('<td>7</td>'));
 current={rpc:()=>({abortSignal:async()=>({data:null,error:{code:'PGRST202'}})})};
 html=renderToStaticMarkup(await exported.default());assert(html.includes('Bu hissə hələ qüvvəyə minməyib.'));
 console.log('PASS rules activate only after server readiness and show configured category limits rather than hardcoded counts');
})().catch(error=>{console.error(error);process.exit(1)});
