"use client";
import { useEffect, useState } from "react";
import { formatAzn } from "../../lib/promotions";
export default function BalancePreview({compact=false}:{compact?:boolean}={}){
 const [balance,setBalance]=useState<number|null>(null);
 useEffect(()=>{let active=true;fetch("/api/wallet",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(d=>{if(active&&d)setBalance(d.balance);}).catch(()=>{});return()=>{active=false;};},[]);
 return <section className={`balancePreview${compact?" compactBalance":""}`} id="balance" aria-label="Şəxsi hesabın balansı"><div><h2>Şəxsi hesab</h2><strong>{balance===null?"…":formatAzn(balance)}</strong><p>Balansdan VIP, Premium və “İrəli çək” xidmətləri üçün istifadə olunur.</p></div><details className="inactivePayment"><summary>Artır</summary><p role="status">Bank kartı ilə onlayn ödəniş hələ qoşulmayıb. Balansı artırmaq üçün sayt idarəçisi ilə əlaqə saxla; ödəniş təsdiqlənəndən sonra məbləğ hesabına əlavə olunur.</p></details></section>;
}
