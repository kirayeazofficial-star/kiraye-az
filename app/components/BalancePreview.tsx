export default function BalancePreview({compact=false}:{compact?:boolean}={}){
 return <section className={`balancePreview${compact?" compactBalance":""}`} id="balance" aria-label="Şəxsi hesabın balansı"><div><h2>Şəxsi hesab</h2><strong>0,00 ₼</strong><p>Balans və ödəniş xidmətləri hələ aktiv deyil.</p></div><details className="inactivePayment"><summary>Artır</summary><p role="status">Hazırda balans yükləmək və ödəniş etmək mümkün deyil. Heç bir məbləğ tutulmayacaq.</p></details></section>;
}
