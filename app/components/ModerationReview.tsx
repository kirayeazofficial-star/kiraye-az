"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { statusName } from "../../lib/marketplace";
import { moderationActions, moderationFields, type ModerationContext, type ModerationEvent } from "../../lib/moderation";
const date = (value:string) => new Date(value).toLocaleString("az-AZ");
function EventList({events,onInspect}:{events:ModerationEvent[];onInspect?:(id:string)=>void}) {
 return <ol className="moderationTimeline">{events.map(event=><li key={event.id}>
  <strong>{moderationActions[event.action] || event.action}</strong>
  <p>{date(event.created_at)} · {event.actor_name || (event.actor_kind==='system'?"Sistem":event.actor_kind==='admin'?"İdarəçi":"Elan sahibi")}{event.actor_id && <small> · ID: {event.actor_id}</small>}</p>
  <p>{event.old_status ? statusName(event.old_status)+" → " : ""}{event.new_status ? statusName(event.new_status) : "Silinib"}</p>
  {event.reason && <p>Qərarın səbəbi: {event.reason}</p>}
  {onInspect && <button type="button" className="textButton" onClick={()=>onInspect(event.listing_id)}>Elanı yoxla</button>}
  {!!event.changed_fields.length && event.before_values && event.after_values && <details><summary>Dəyişən məlumatlar ({event.changed_fields.length})</summary><div className="moderationChanges">{event.changed_fields.map(key=><div key={key}><strong>{moderationFields[key] || key}</strong><div><p><b>Əvvəl:</b> {renderValue(event.before_values?.[key])}</p><p><b>İndi:</b> {renderValue(event.after_values?.[key])}</p></div></div>)}</div></details>}
 </li>)}</ol>;
}
function renderValue(value:unknown) {return value === null || value === undefined || value === "" ? "Qeyd edilməyib" : typeof value === 'object' ? JSON.stringify(value) : String(value);}
const unavailable = "Yoxlama məlumatları yüklənmədi. Server yeniləməsi və admin icazəsi yoxlanmalıdır. Bu, tarixçənin boş olması demək deyil.";
export function ModerationReview({listingId,onInspect}:{listingId:string;onInspect:(id:string)=>void}) {
 const [data,setData]=useState<ModerationContext|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState("");
 async function load(){if(loading || data || !supabase)return;setLoading(true);setError("");try{const result=await supabase.rpc('admin_listing_context',{p_listing_id:listingId}).abortSignal(AbortSignal.timeout(8000));if(result.error || !result.data?.owner)throw new Error();setData(result.data as ModerationContext);}catch{setError(unavailable);}finally{setLoading(false);}}
 return <details className="moderationReview" onToggle={event=>{if(event.currentTarget.open)void load();}}><summary>Uyğunluqlar, istifadəçi və dəyişiklik tarixçəsi</summary>
 {loading && <p role="status">Yoxlama məlumatları yüklənir...</p>}
 {error && <p role="alert">{error} <button className="secondary" type="button" onClick={load}>Yenidən yoxla</button></p>}
 {data && <>
  <section><h4>Oxşarlıq xəbərdarlıqları</h4><p className="muted">Son 180 gündəki ən yeni 500 elanla müqayisə edilir; ən çox 8 uyğunluq göstərilir. Eyni nömrə və ya oxşarlıq qayda pozuntusunun sübutu deyil. Şəkil yoxlaması eyni fayl ünvanını aşkarlayır, yenidən yüklənmiş şəkli tanımır.</p>
  {!data.signals.length ? <p>Yoxlanılan elanlar arasında uyğunluq tapılmadı.</p> : <ul className="moderationSignals">{data.signals.map(signal=><li key={signal.id}><button type="button" className="textButton" onClick={()=>onInspect(signal.id)}>{signal.title}</button><p>{[signal.same_phone&&"Eyni əlaqə nömrəsi",signal.same_image&&"Eyni şəkil faylı",signal.similar_text&&"Oxşar elan mətni"].filter(Boolean).join(" · ")}</p><small>{signal.owner_id===data.owner.id?"Eyni hesab":"Başqa hesab"} · {statusName(signal.status)}</small></li>)}</ul>}</section>
  <section><h4>Elan sahibinin tarixçəsi</h4><p>{data.owner.name || "Ad qeyd edilməyib"} · Hesab: {date(data.owner.joined_at)}</p><p className="moderationOwnerId">ID: {data.owner.id}</p><p>Şikayətlər: {data.reports.open} açıq, {data.reports.resolved} baxılıb. Şikayət özlüyündə qayda pozuntusunu təsdiqləmir.</p><p className="muted">Son 20 elan:</p><ul>{data.owner_listings.map(ad=><li key={ad.id}><button type="button" className="textButton" onClick={()=>onInspect(ad.id)}>{ad.title}</button> · {statusName(ad.status)}{ad.rejection_reason && <p>Rədd səbəbi: {ad.rejection_reason}</p>}</li>)}</ul></section>
  <section><h4>Elanın son 10 əməliyyatı</h4>{data.events.length ? <EventList events={data.events}/> : <p>Qeyd yoxdur. Köhnə əməliyyatlar geriyə tarixlə yaradılmır.</p>}</section>
 </>}
 </details>;
}
export function ModerationHistory({revision,onInspect}:{revision:number;onInspect:(id:string)=>void}) {
 const [events,setEvents]=useState<ModerationEvent[]|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState(""),[loadedRevision,setLoadedRevision]=useState(-1);
 async function load(){if(loading || !supabase)return;setLoading(true);setError("");try{const result=await supabase.rpc('admin_moderation_history').abortSignal(AbortSignal.timeout(8000));if(result.error || !Array.isArray(result.data))throw new Error();setEvents(result.data);setLoadedRevision(revision);}catch{setError(unavailable);}finally{setLoading(false);}}
 return <section id="moderation-history"><h2>Əməliyyat tarixçəsi</h2><p className="muted">Serverdə qeydə alınmış son 50 əməliyyat. Qeydiyyat server yeniləməsindən başlayır.</p><button type="button" className="secondary" disabled={loading} onClick={load}>{loading?"Yüklənir...":"Tarixçəni yenilə"}</button>{loadedRevision!==revision && events && <p role="status">Yeni qərar verilib. Son əməliyyatları görmək üçün tarixçəni yenilə.</p>}{error && <p role="alert">{error}</p>}{!error&&events&&(events.length?<EventList events={events} onInspect={onInspect}/>:<p>Hələ qeydə alınmış əməliyyat yoxdur.</p>)}</section>;
}
