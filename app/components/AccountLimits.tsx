"use client";
import {useEffect,useState} from "react";
import {FREE_LISTING_LIMIT} from "../../lib/listing-limit";
import {categories} from "../../lib/marketplace";

type State={category:string;limit:number;used:number;pending:number;remaining:number;next_free_at:string|null};
const date=(value:string)=>{const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Baku",day:"2-digit",month:"2-digit",year:"numeric"}).formatToParts(new Date(value));const part=(type:string)=>parts.find(item=>item.type===type)?.value||"";return `${part("day")}.${part("month")}.${part("year")}`;};
export default function AccountLimits(){
 const [unlimited,setUnlimited]=useState(false);
 const [items,setItems]=useState<State[]|null>(null),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{let live=true;setFailed(false);fetch("/api/listings/limits",{cache:"no-store"}).then(r=>r.ok?r.json():Promise.reject()).then(d=>{if(live){setItems(d.items||[]);setUnlimited(!!d.unlimited);}}).catch(()=>{if(live)setFailed(true);});return()=>{live=false;};},[attempt]);
 const byCategory=new Map((items||[]).map(item=>[item.category,item]));
 if(unlimited)return <section className="kzLimits"><h2>Elan limitləri</h2><p className="kzStaffFree">Siz saytın rəhbərisiniz: elan sayına limit yoxdur, irəli çəkmə, VIP, Premium və bərpa sizin üçün pulsuzdur.</p></section>;
 return <section className="kzLimits">
  <h2>Elan limitləri</h2>
  <p className="kzLimitsLead">Hər kateqoriyada ayda {FREE_LISTING_LIMIT} elan pulsuzdur. Limit dolanda da elan yerləşdirə bilərsiniz — elan «Ödəniş gözləyir» bölməsinə düşür. Elanı silmək limiti qaytarmır; rədd edilmiş elan limit sərf etmir.</p>
  {failed?<div className="kzErrorBar" role="alert"><span>Məlumatları yükləmək mümkün olmadı. Yenidən cəhd edin.</span><button type="button" className="kzButtonGhost" onClick={()=>setAttempt(x=>x+1)}>Yenidən cəhd et</button></div>:!items?<p className="kzMuted" role="status">Yüklənir…</p>:
  <div className="kzLimitTable" role="table" aria-label="Elan limitləri">
   <div className="kzLimitRow head" role="row"><span>Kateqoriya</span><span>Limit</span><span>İstifadə</span><span>Qalıb</span><span>Növbəti pulsuz yer</span></div>
   {categories.map(category=>{const state=byCategory.get(category.id);const used=(state?.used||0)+(state?.pending||0),remaining=state?state.remaining:FREE_LISTING_LIMIT;return <div className="kzLimitRow" role="row" key={category.id}>
    <span>{category.name}</span>
    <span data-label="Limit">{FREE_LISTING_LIMIT}</span>
    <span data-label="İstifadə">{used}{state?.pending?<small> ({state.pending} yoxlamada)</small>:null}</span>
    <span data-label="Qalıb" className={remaining?"ok":"none"}>{remaining}</span>
    <span data-label="Növbəti">{remaining?"İndi":state?.next_free_at?date(state.next_free_at):"—"}</span>
   </div>;})}
  </div>}
  <p className="kzLimitsLead">Ödənişli yerləşdirmə pulsuz limitdən ayrıca hesablanır. Ödəniş sistemi hələ qoşulmayıb.</p>
 </section>;
}
