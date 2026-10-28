"use client";
import {useEffect,useState} from "react";
export default function BalancePreview({compact=false}:{compact?:boolean}={}){
 const[notice,setNotice]=useState(false);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(false),5000);return()=>clearTimeout(timer);},[notice]);
 return <section className={`balancePreview${compact?" compactBalance":""}`} id="balance" aria-label="Şəxsi hesabın balansı">
  <div className="balanceTop"><div><h2>Şəxsi hesab</h2><strong>0,00 ₼</strong></div><button type="button" className="secondary balanceTopUp" onClick={()=>setNotice(true)}>Artır</button></div>
  {notice&&<div className="balanceNotice" role="status"><span>Ödəniş sistemi müvəqqəti aktiv deyil.</span><button type="button" aria-label="Bildirişi bağla" onClick={()=>setNotice(false)}>×</button></div>}
  {!compact&&!notice&&<p className="balanceDesc">Balans artırma funksiyası aktivləşdirildikdə bank kartı ilə ödəniş edə biləcəksən.</p>}
 </section>;
}
