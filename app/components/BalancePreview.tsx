"use client";
import NavigationIcon from "./NavigationIcon";
// Payments are not connected yet, so the balance is shown read-only with a short note.
export default function BalancePreview({compact=false}:{compact?:boolean}={}){
 return <section className={`kzBalance${compact?" compact":""}`} id="balance" aria-label="Şəxsi hesabın balansı">
  <span className="kzBalanceIcon" aria-hidden="true"><NavigationIcon name="wallet"/></span>
  <div>
   <small>Şəxsi hesab</small>
   <strong>0,00 ₼</strong>
  </div>
  <span className="kzBalanceSoon">Tezliklə</span>
  {!compact&&<p>Balans artırma ödəniş sistemi qoşulandan sonra aktiv olacaq.</p>}
 </section>;
}
