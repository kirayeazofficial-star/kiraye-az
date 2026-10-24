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

// Category words express intent; they need not appear in an advert's title.
export function rentalSearchIntent(value: string) {
 const variants = searchVariants(value);
 const words = (variants[variants.length - 1] || "").split(/\s+/).filter(Boolean).slice(0, 12);
 const groups: Record<string, string[]> = {
  masin: ["car"], masinlar: ["car"], avtomobil: ["car"], avtomobiller: ["car"],
  motosiklet: ["motorcycle"], motosikletler: ["motorcycle"],
  ev: ["property", "villa"], evler: ["property", "villa"], menzil: ["property"], menziller: ["property"],
  villa: ["villa"], villalar: ["villa"], velosiped: ["bicycle", "electric"], skuter: ["electric"],
 };
 const ignored = new Set(["kiraye", "kirayesi", "kirayeye", "icare", "icareye", "axtariram", "isteyirem"]);
 const cityWords: Record<string,string> = {baki:"Bakı", bakida:"Bakı", xirdalan:"Xırdalan", xirdalanda:"Xırdalan", sumqayit:"Sumqayıt", sumqayitda:"Sumqayıt", gence:"Gəncə", gencede:"Gəncə"};
 let categories: string[] = [], city = "";
 const remaining: string[] = [];
 for (const word of words) {
  const key = foldSearch(word);
  if (groups[key]) categories = categories.length ? categories.filter(c=>groups[key].includes(c)) : groups[key];
  else if (cityWords[key]) city = cityWords[key];
  else if (!ignored.has(key)) remaining.push(word);
 }
 return {categories, city, query: remaining.join(" ")};
}
