"use client";
import {useEffect,useState} from "react";
import {supabase} from "../../lib/supabase";
import {categoryName} from "../../lib/marketplace";
import {publicDate} from "../../lib/public-date";
type Limit={category:string;active_limit:number;period_limit:number;active_used:number;period_used:number;active_remaining:number;period_remaining:number;next_release_at:string|null;exempt:boolean};
export default function AccountLimits(){const [rows,setRows]=useState<Limit[]|null>(null),[error,setError]=useState(false);
 useEffect(()=>{if(!supabase){setError(true);return;}let active=true;supabase.rpc('own_listing_limits').then(({data,error})=>{if(!active)return;if(error||!Array.isArray(data)){setError(true);return;}setRows(data);});return()=>{active=false;};},[]);
 return <section><h2>Limitlər</h2><p>Hər kateqoriyanın aktiv elan və son 30 günlük yerləşdirmə haqqı ayrıdır. Redaktə və təkrar təsdiq yeni haqq sərf etmir. Elanı silmək/arxivləmək istifadəni sıfırlamır.</p>{error?<p role="alert">Limit məlumatı yüklənmədi. Bağlantını yoxlayıb səhifəni yeniləyin.</p>:!rows?<p>Limitlər yüklənir…</p>:<div className="accountLimits">{rows.map(l=><article key={l.category}><h3>{categoryName(l.category)}</h3>{l.exempt?<p>Öz elanlarınız üçün admin istisnası var. Başqa istifadəçinin elanı həmin istifadəçinin limitinə tabedir.</p>:<><p>Aktiv: {l.active_used} / {l.active_limit} · Qalan: {l.active_remaining}</p><p>Son 30 gündə: {l.period_used} / {l.period_limit} · Qalan: {l.period_remaining}</p>{l.next_release_at&&<p>Ən yaxın istifadə haqqının açılması: {publicDate(l.next_release_at)}</p>}</>}</article>)}</div>}</section>;
}
