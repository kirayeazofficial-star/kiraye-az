export default function PromotionOptions({
  eligible = true,
}: {
  eligible?: boolean;
}) {
  return (
    <section className="promotionOptions" aria-label="Elanın irəlilədilməsi">
      <h3>Elanını daha çox insana göstər</h3>
      <div className="promotionButtons">
        <button type="button" className="secondary" disabled>
          ★ VIP et
        </button>
        <button type="button" className="secondary" disabled>
          ↑ İrəli çək
        </button>
      </div>
      <p>
        Bu xidmətlər hələ aktiv deyil. Ödəniş sistemi qoşulduqdan sonra
        istifadəyə veriləcək.
      </p>
      {!eligible && (
        <small>İrəlilətmə yalnız yayımlanmış elanlar üçün mümkün olacaq.</small>
      )}
    </section>
  );
}
