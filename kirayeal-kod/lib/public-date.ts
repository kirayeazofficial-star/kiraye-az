export function publicDate(value:string,now=Date.now()){
 const date=new Date(value);if(!Number.isFinite(date.getTime()))return '';
 const parts=(d:Date)=>new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Baku',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d);
 const read=(p:Intl.DateTimeFormatPart[],key:string)=>p.find(v=>v.type===key)?.value||'';
 const key=(p:Intl.DateTimeFormatPart[])=>['year','month','day'].map(k=>read(p,k)).join('-');
 const p=parts(date),day=key(p),today=key(parts(new Date(now))),yesterday=key(parts(new Date(now-864e5)));
 return `${day===today?'Bu gün':day===yesterday?'Dünən':`${read(p,'day')}.${read(p,'month')}.${read(p,'year')}`}, ${read(p,'hour')}:${read(p,'minute')}`;
}

const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"];

export function publicMonthYear(value: string) {
 const date = new Date(value);
 if (!Number.isFinite(date.getTime())) return "";
 // Numeric parts avoid differing Azerbaijani month support in browser ICU data.
 const parts = new Intl.DateTimeFormat("en-GB", {timeZone:"Asia/Baku", year:"numeric", month:"2-digit"}).formatToParts(date);
 const month = Number(parts.find(part => part.type === "month")?.value);
 const year = parts.find(part => part.type === "year")?.value || "";
 return `${months[month - 1]} ${year}`;
}
