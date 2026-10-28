export default function BalancePreview({compact=false}:{compact?:boolean}={}){
 return <section className={`balancePreview${compact?" compactBalance":""}`} id="balance" aria-label="Şəxsi hesabın balansı"><div><h2>Şəxsi hesab</h2><strong>0,00 ₼</strong>{!compact&&<p>Balans artırma və ödəniş funksiyası hazırda aktiv deyil. Aktivləşdirildikdə burada bank kartı ilə balans artıra biləcəksən.</p>}</div><button type="button" className="secondary balanceTopUp" disabled title="Ödəniş sistemi aktivləşdirilməyib">Tezliklə</button></section>;
}
