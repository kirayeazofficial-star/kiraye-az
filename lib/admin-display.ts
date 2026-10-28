export function adminDate(value:string|null|undefined) {
 if(!value || !Number.isFinite(Date.parse(value)))return "Qeyd edilməyib";
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Baku',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value));
 const part=(type:string)=>parts.find(item=>item.type===type)?.value || '';
 return `${part('day')}.${part('month')}.${part('year')} · ${part('hour')}:${part('minute')}:${part('second')} — Bakı vaxtı`;
}
export const staffRoleName=(role:string)=>role==='leader'?'Rəhbər':role==='moderator'?'Admin':'İstifadəçi';

export function adminLoadError(error:unknown){
 const code=(error&&typeof error==='object'&&'code' in error)?String(error.code):'';
 if(['PGRST202','42883','42P01','42703'].includes(code))return 'Bu bölmənin baza yeniləməsi hələ tətbiq edilməyib. Ödəniş tələb olunmur; serverdə admin yeniləməsi tamamlanmalıdır.';
 if(code==='42501')return 'Bu əməliyyat üçün admin səlahiyyəti təsdiqlənmədi. Hesabına yenidən daxil ol.';
 return 'Məlumat yüklənmədi. Bağlantını yoxlayıb yenidən cəhd et. Bu xəta tarixçənin boş olması demək deyil.';
}
