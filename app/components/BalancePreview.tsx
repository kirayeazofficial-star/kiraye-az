"use client";
import {useEffect,useState} from "react";
import NavigationIcon from "./NavigationIcon";
export default function BalancePreview({compact=false}:{compact?:boolean}={}){
 const[notice,setNotice]=useState(false);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(false),5000);return()=>clearTimeout(timer);},[notice]);
 return <section className={`balancePreview${compact?" compactBalance":""}`} id="balance" aria-label="Şəxsi hesabın balansı">
  <div className="balanceTop"><div className="balanceIdentity"><span className="balanceIcon" aria-hidden="true"><NavigationIcon name="wallet"/></span><div><h2>Şəxsi hesab</h2><strong>0,00 ₼</strong></div></div><button type="button" className="secondary balanceTopUp" onClick={()=>setNotice(true)}>Artır</button></div>
  {notice&&<div className="balanceNotice" role="status"><svg className="noticeIcon" viewBox="0 0 20 20" width="18" height="18" fill="none"><circle cx="10" cy="10" r="9" stroke="#b08d3e" strokeWidth="1.5"/><path d="M10 6v5" stroke="#b08d3e" strokeWidth="1.5" strokeLinecap="round"/><circle cx="10" cy="14" r="1" fill="#b08d3e"/></svg><span>Ödəniş sistemi müvəqqəti aktiv deyil.</span><button type="button" className="noticeClose" aria-label="Bildirişi bağla" onClick={()=>setNotice(false)}><svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg></button></div>}
  {!compact&&!notice&&<p className="balanceDesc">Balans artırma funksiyası aktivləşdirildikdə bank kartı ilə ödəniş edə biləcəksən.</p>}
 </section>;
}
