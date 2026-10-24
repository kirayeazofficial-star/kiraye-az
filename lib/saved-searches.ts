const key='kirayeal:saved-searches';
const fields=['query','category','city','period','min','max','sort','rooms','area','brand','gearbox','from','until'] as const;
export type SavedSearch={id:string;label:string;values:Record<typeof fields[number],string>&{noDeposit:boolean}};
export function readSavedSearches():SavedSearch[]{
 try{const list=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(list)?list.filter(item=>typeof item?.id==='string'&&typeof item.label==='string'&&item.label.length<=180&&item.values&&fields.every(k=>typeof item.values[k]==='string'&&item.values[k].length<=120)&&typeof item.values.noDeposit==='boolean').slice(0,8):[];}catch{return [];}
}
export function saveSearch(values:SavedSearch['values'],label:string){
 const entry={id:crypto.randomUUID(),label:label.slice(0,180),values};
 const next=[entry,...readSavedSearches().filter(item=>JSON.stringify(item.values)!==JSON.stringify(values))].slice(0,8);
 localStorage.setItem(key,JSON.stringify(next));return next;
}
export function removeSavedSearch(id:string){const next=readSavedSearches().filter(item=>item.id!==id);try{localStorage.setItem(key,JSON.stringify(next));}catch{}return next;}
