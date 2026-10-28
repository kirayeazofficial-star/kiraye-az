export default function BalancePreview({compact=false}:{compact?:boolean}={}){
 return <section className={`balancePreview${compact?" compactBalance":""}`} id="balance" aria-label="Şəxsi hesabın balansı"><div><h2>Şəxsi hesab</h2><strong>0,00 ₼</strong><p>Ödəniş sistemi müvəqqəti işləmir.</p></div><button type="button" className="secondary balanceTopUp" disabled aria-disabled="true">Artır</button></section>;
}
