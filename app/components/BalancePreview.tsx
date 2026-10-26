"use client";
import {useEffect,useState} from 'react';
import {supabase} from '../../lib/supabase';
export default function BalancePreview({compact=false}:{compact?:boolean}={}){const [balance,setBalance]=useState<number|null>(null);useEffect(()=>{let active=true;if(supabase)Promise.resolve(supabase.rpc('own_wallet_summary').abortSignal(AbortSignal.timeout(3000))).then(({data,error})=>{if(active&&!error&&typeof data?.balance!=='undefined'&&Number.isFinite(Number(data.balance)))setBalance(Number(data.balance));}).catch(()=>{});return()=>{active=false;};},[]);
 return <section className={`balancePreview${compact?" compactBalance":""}`} id="balance" aria-label="Şəxsi hesabın balansı"><div><h2>Şəxsi hesab</h2><strong>{balance===null?'—':balance.toFixed(2).replace('.',',')+' ₼'}</strong><p>{balance===null?'Balans məlumatı hazır deyil. Ödənişlər aktiv deyil.':'Balans əməliyyatları hələ aktiv deyil.'}</p></div><details className="inactivePayment"><summary>Artır</summary><p role="status">Hazırda balans yükləmək və ödəniş etmək mümkün deyil. Texniki işlər aparılır. Heç bir məbləğ tutulmadı.</p></details></section>;
}
