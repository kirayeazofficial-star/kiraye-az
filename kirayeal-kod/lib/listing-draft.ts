export type ListingDraft={version:1;updatedAt:number;category:string;step:number;fields:Record<string,string[]>;files:File[];photosMissing?:boolean;photoSignature?:string};
const prefix='kirayeal:draft:';
const photoSignature=(files:File[])=>JSON.stringify(files.map(file=>[file.name,file.size,file.type,file.lastModified]));
let queue:Promise<unknown>=Promise.resolve();
function database():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const request=indexedDB.open('kirayeal-drafts',1);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('drafts'))request.result.createObjectStore('drafts');};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
async function transact(owner:string,mode:'read'|'write'|'delete',value?:ListingDraft):Promise<ListingDraft|undefined>{
 const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('drafts',mode==='read'?'readonly':'readwrite');const store=tx.objectStore('drafts');const req=mode==='read'?store.get(owner):mode==='delete'?store.delete(owner):store.put(value,owner);let result:ListingDraft|undefined;req.onsuccess=()=>{result=req.result;};tx.oncomplete=()=>{db.close();resolve(result);};tx.onerror=()=>{db.close();reject(tx.error);};tx.onabort=()=>{db.close();reject(tx.error);};});
}
export async function readListingDraft(owner:string):Promise<ListingDraft|null>{
 let local:ListingDraft|null=null,stored:ListingDraft|undefined;
 try{local=JSON.parse(localStorage.getItem(prefix+owner)||'null');}catch{}
 try{stored=await transact(owner,'read');}catch{}
 let draft=stored&&(!local||stored.updatedAt>=local.updatedAt)?stored:local;
 if(draft===local && local?.photosMissing && stored?.files?.length && local.photoSignature===photoSignature(stored.files))draft={...local,files:stored.files,photosMissing:false};
 if(!draft||draft.version!==1||typeof draft.category!=='string'||!draft.fields||Object.keys(draft.fields).length>200||!Object.values(draft.fields).every(values=>Array.isArray(values)&&values.length<=30&&values.every(value=>typeof value==='string'&&value.length<=5000))||!Array.isArray(draft.files)||!Number.isFinite(draft.updatedAt)||Date.now()-draft.updatedAt>7*864e5)return null;
 return draft;
}
export function saveListingDraft(owner:string,draft:ListingDraft):Promise<'photos'|'text'> {
 let localSaved=false;try{localStorage.setItem(prefix+owner,JSON.stringify({...draft,files:[],photosMissing:draft.files.length>0,photoSignature:photoSignature(draft.files)}));localSaved=true;}catch{}
 const operation=queue.catch(()=>{}).then(async()=>{try{await transact(owner,'write',draft);return 'photos' as const;}catch{if(localSaved)return 'text' as const;throw new Error('storage unavailable');}});
 queue=operation;return operation;
}
export function clearListingDraft(owner:string){try{localStorage.removeItem(prefix+owner);}catch{}const operation=queue.catch(()=>{}).then(()=>transact(owner,'delete')).catch(()=>{});queue=operation;return operation;}
