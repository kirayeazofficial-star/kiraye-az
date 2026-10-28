"use client";
import {useEffect,useState} from "react";
import {FREE_LISTING_LIMIT,LIMIT_WINDOW_DAYS} from "../../lib/listing-limit";
import {categories} from "../../lib/marketplace";

type Row={category:string;status:string;created_at:string};
export default function AccountLimits(){
 const [rows,setRows]=useState<Row[]|null>(null),[failed,setFailed]=useState(false);
 useEffect(()=>{let live=true;fetch("/api/listings?scope=mine&limit=200",{cache:"no-store"}).then(r=>r.ok?r.json():Promise.reject()).then(d=>{if(live)setRows(d.items||[]);}).catch(()=>{if(live)setFailed(true);});return()=>{live=false;};},[]);
 const since=Date.now()-LIMIT_WINDOW_DAYS*86400000;
 const used=new Map<string,number>();
 for(const r of rows||[])if(["pending","published","expired"].includes(r.status)&&new Date(r.created_at).getTime()>since)used.set(r.category,(used.get(r.category)||0)+1);
 const list=categories.map(c=>({key:c.id,label:c.name}));
 return <section className="limitsPanel"><h2>Limitlər</h2><p>Hər kateqoriyada {LIMIT_WINDOW_DAYS} gün ərzində {FREE_LISTING_LIMIT} pulsuz elan yerləşdirə bilərsən.</p>{failed?<p role="alert">Limitləri yükləmək mümkün olmadı.</p>:!rows?<p role="status">Yüklənir…</p>:<ul>{list.map(c=><li key={c.key}><span>{c.label}</span><b>{used.get(c.key)||0} / {FREE_LISTING_LIMIT}</b></li>)}</ul>}<p className="muted">Əlavə limit almaq üçün ödəniş sistemi müvəqqəti işləmir.</p></section>;
}
