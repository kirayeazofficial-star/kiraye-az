"use client";
import {useEffect,useState} from 'react';
import {supabase} from '../../lib/supabase';
import {money} from '../../lib/marketplace';
import {adminDate} from '../../lib/admin-display';
type Entry={id:number;amount:number;kind:string;memo:string|null;created_at:string};
export function WalletActivity(){const [entries,setEntries]=useState<Entry[]>([]),[cursor,setCursor]=useState<string|null>(null),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function load(before:string|null=null){if(!supabase||busy)return;setBusy(true);setError('');try{const r=await supabase.rpc('own_wallet_activity',{p_before:before}).abortSignal(AbortSignal.timeout(5000));if(r.error||!Array.isArray(r.data?.entries))throw new Error();setEntries(previous=>before?[...previous,...r.data.entries]:r.data.entries);setCursor(r.data.next);setLoaded(true);}catch{setError('Əməliyyat tarixçəsi yüklənmədi. Yenidən yoxla. Ödənişlər hazırda aktiv deyil.');}finally{setBusy(false);}}
 useEffect(()=>{void load();},[]);
 return <section className="walletPanel"><h2>Əməliyyat tarixçəsi</h2><p>Balans yükləmə və saytdaxili ödənişlər hazırda aktiv deyil.</p>{error&&<p role="alert">{error} <button className="textButton" onClick={()=>load()}>Yenidən yoxla</button></p>}{busy&&<p role="status">Yüklənir...</p>}{loaded&&!entries.length&&<p>Hələ əməliyyat yoxdur.</p>}<ul className="walletEntries">{entries.map(entry=><li key={entry.id}><strong>{entry.amount>0?'+':''}{money(entry.amount)} AZN</strong><span>{entry.memo||({topup:'Balans artırılması',promotion:'Reklam ödənişi',refund:'Geri ödəniş'}[entry.kind]||'Əməliyyat')}</span><small>{adminDate(entry.created_at)}</small></li>)}</ul>{cursor&&<button type="button" className="secondary" disabled={busy} onClick={()=>load(cursor)}>Daha çox göstər</button>}</section>;
}
export function SavedCards(){return <section className="walletPanel"><h2>Mənim kartlarım</h2><p>Kart əlavə etmə və ödəniş xidməti hələ aktiv deyil. Texniki işlər aparılır.</p><p>Hazırda bu bölmədə kart məlumatı qəbul edilmir.</p></section>;}
