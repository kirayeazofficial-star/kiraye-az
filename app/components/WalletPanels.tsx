"use client";
import { useEffect, useState } from "react";
import { formatAzn } from "../../lib/promotions";
type Entry={id:string;amount:string;kind:string;memo:string|null;created_at:string};
const kindName:Record<string,string>={topup:"Balans artımı",promotion:"Reklam xidməti",refund:"Geri qaytarma"};
export function WalletActivity(){
 const [entries,setEntries]=useState<Entry[]|null>(null);
 useEffect(()=>{let active=true;fetch("/api/wallet",{cache:"no-store"}).then(r=>r.ok?r.json():{entries:[]}).then(d=>{if(active)setEntries(d.entries||[]);}).catch(()=>{if(active)setEntries([]);});return()=>{active=false;};},[]);
 return <section className="walletPanel"><h2>Əməliyyat tarixçəsi</h2>{entries===null?<p role="status">Yüklənir…</p>:!entries.length?<p>Hələ əməliyyat yoxdur.</p>:<ul>{entries.map(e=><li key={e.id}><strong>{kindName[e.kind]||e.kind}</strong> · {formatAzn(e.amount)} · {new Date(e.created_at).toLocaleString("az-AZ")}{e.memo?` · ${e.memo}`:""}</li>)}</ul>}</section>;
}
export function SavedCards(){return <section className="walletPanel"><h2>Mənim kartlarım</h2><p>Kart əlavə etmə və onlayn ödəniş hələ aktiv deyil. Bu bölmədə kart məlumatı qəbul edilmir.</p></section>;}
