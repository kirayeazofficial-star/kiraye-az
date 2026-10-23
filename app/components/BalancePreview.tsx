export default function BalancePreview() {
  return <section className="balancePreview" id="balance" aria-label="Şəxsi hesabın balansı">
    <div><h2>Şəxsi hesab</h2><strong>0,00 AZN</strong><p>Balans əməliyyatları hələ aktiv deyil.</p></div>
    <details className="inactivePayment">
      <summary>Balans yüklə</summary>
      <p role="status">Hazırda balans yükləmək və ödəniş etmək mümkün deyil. Texniki işlər aparılır. Heç bir məbləğ tutulmadı.</p>
    </details>
  </section>;
}
