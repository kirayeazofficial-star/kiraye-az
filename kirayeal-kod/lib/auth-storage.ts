// Only auth session tokens use this adapter. Passwords are never stored.
const choiceKey='kiraye:remember-login';
const memory=new Map<string,string>();
export function rememberLogin(){if(typeof window==='undefined')return true;try{return window.localStorage.getItem(choiceKey)!=='false';}catch{return true;}}
export function setRememberLogin(value:boolean){if(typeof window==='undefined')return;try{window.localStorage.setItem(choiceKey,String(value));}catch{/* A blocked browser store never causes a fake persistent-session promise. */}}
export const authStorage={
 getItem(key:string){if(typeof window==='undefined')return null;try{const value=window.localStorage.getItem(key);if(value!==null)return value;}catch{}try{const value=window.sessionStorage.getItem(key);if(value!==null)return value;}catch{}return memory.get(key)||null;},
 setItem(key:string,value:string){if(typeof window==='undefined')return;memory.set(key,value);try{if(rememberLogin()){window.localStorage.setItem(key,value);window.sessionStorage.removeItem(key);}else{window.sessionStorage.setItem(key,value);window.localStorage.removeItem(key);}memory.delete(key);}catch{/* Private/blocked storage stays scoped to this page. */}},
 removeItem(key:string){memory.delete(key);if(typeof window==='undefined')return;try{window.localStorage.removeItem(key);}catch{}try{window.sessionStorage.removeItem(key);}catch{}}
};
