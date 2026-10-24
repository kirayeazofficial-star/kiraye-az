const aliases: Record<string,string> = {
 motosklet:'motosiklet',motosikl:'motosiklet',motorcycle:'motosiklet',motocycle:'motosiklet',
 skuter:'skuter',scooter:'skuter',suziki:'Suzuki',suzuki:'Suzuki',reno:'Renault',renault:'Renault',
 sevrolet:'Chevrolet',sevroled:'Chevrolet',chevrolet:'Chevrolet',canqan:'Changan',changan:'Changan',
 kiraye:'kirayə',kirayesi:'kirayəsi',menzil:'mənzil',velosbet:'velosiped',velosiped:'velosiped',
};
export const foldSearch=(value:string)=>value.toLocaleLowerCase('az').replace(/[ə]/g,'e').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ç/g,'c').replace(/ğ/g,'g');
export function searchVariants(value:string):string[]{
 const clean=value.replace(/[(),.%_"\\]/g,' ').trim().replace(/\s+/g,' ').slice(0,120);
 if(!clean)return [];
 const canonical=clean.split(' ').map(word=>aliases[foldSearch(word)]||word).join(' ');
 return Array.from(new Set([clean,canonical])).slice(0,2);
}
export function matchesSearch(text:string,query:string){
 const haystack=foldSearch(text);
 return !query.trim()||searchVariants(query).some(value=>value.split(/\s+/).every(word=>haystack.includes(foldSearch(word))));
}
