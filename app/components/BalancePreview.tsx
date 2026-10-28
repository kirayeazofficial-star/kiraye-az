"use client";
import { useState } from "react";
export default function BalancePreview({compact=false}:{compact?:boolean}={}){
 const [open,setOpen]=useState(false);
 return <section className={`balancePreview${compact?" compactBalance":""}`} id="balance" aria-label="Şəxsi hesabın balansı"><div><h2>Şəxsi hesab</h2><strong>0,00 ₼</strong></div><button type="button" className="secondary balanceTopUp" onClick={()=>setOpen(true)}>Artır</button>{open&&<div className="miniDialogShade" onClick={()=>setOpen(false)}><div className="miniDialog" role="dialog" aria-modal="true" onClick={e=>e.stopPropagation()}><button type="button" className="miniDialogClose" aria-label="Bağla" onClick={()=>setOpen(false)}>×</button><p>Ödəniş sistemi müvəqqəti işləmir.</p></div></div>}</section>;
}
