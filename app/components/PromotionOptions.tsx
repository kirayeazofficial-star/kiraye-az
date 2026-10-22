const packages = [
  { title: "↑ İrəli çək", description: "Elan hər 8 saatdan bir axtarış nəticələrində irəli çəkiləcək.", plans: ["3 dəfə — 1,50 AZN", "9 dəfə — 2 AZN", "15 dəfə — 3 AZN", "30 dəfə — 5 AZN"] },
  { title: "★ VIP", description: "Xüsusi VIP bölməsində və öz kateqoriyasının VIP elanları arasında növbəli göstərilmə, hər gün irəli çəkmə.", plans: ["1 gün — 3 AZN", "5 gün — 6 AZN", "15 gün — 15 AZN", "30 gün — 25 AZN"] },
  { title: "◇ Premium", description: "VIP üstünlükləri, hər gün irəli çəkmə və xidmət müddətində əsas səhifənin Premium bölməsində göstərilmə.", plans: ["1 gün — 5 AZN", "5 gün — 15 AZN", "15 gün — 30 AZN", "30 gün — 50 AZN"] },
];
export default function PromotionOptions({ eligible = true }: { eligible?: boolean }) {
  return <section className="promotionOptions" aria-label="Elanın irəlilədilməsi">
    <h3>Elanı reklam et</h3>
    <p>Hazırda bu xidmətlər aktiv deyil. Ödəniş qəbul edilmir. Aşağıdakılar planlaşdırılan paketlərdir.</p>
    {packages.map(pack => <details key={pack.title} className="promotionPackage">
      <summary>{pack.title} — paketlərə bax</summary>
      <p>{pack.description}</p>
      <ul>{pack.plans.map(plan => <li key={plan}>{plan}</li>)}</ul>
      <button type="button" className="secondary" disabled>Hazırda aktiv deyil</button>
    </details>)}
    <small>VIP və Premium nişanları xidmət aktivləşdiriləndən sonra elanda görünəcək.</small>
    {!eligible && <p>İrəlilətmə yalnız yayımlanmış elanlar üçün mümkün olacaq.</p>}
  </section>;
}
