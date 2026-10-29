"use client";
import { ArrowUp, ChevronLeft, Crown, Gem, Megaphone, RotateCcw, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
const packages = [
  { title: "Elanı bərpa et", icon: RotateCcw, kind: "restore", description: "Müddəti bitmiş və ya arxivə keçmiş elan yenidən yayımlanacaq.", plans: ["Elanı yenidən 30 gün yayımla"] },
  { title: "İrəli çək", icon: ArrowUp, kind: "bump", description: "Elan seçdiyin sayda, hər 8 saatdan bir irəli çəkiləcək.", plans: ["3 dəfə (8 saatdan bir) — 1,50 AZN", "9 dəfə (8 saatdan bir) — 2 AZN", "15 dəfə (8 saatdan bir) — 3 AZN", "30 dəfə (8 saatdan bir) — 5 AZN"] },
  { title: "VIP", icon: Gem, kind: "vip", description: "Xüsusi VIP bölməsində, öz kateqoriyasının VIP elanları arasında növbəli göstərilmə və hər gün irəli çəkmə.", plans: ["1 gün — 3 AZN", "5 gün — 6 AZN", "15 gün — 15 AZN", "30 gün — 25 AZN"] },
  { title: "Premium", icon: Crown, kind: "premium", description: "VIP üstünlükləri, hər gün irəli çəkmə və xidmət müddətində əsas səhifənin Premium bölməsində göstərilmə.", plans: ["1 gün — 5 AZN", "5 gün — 15 AZN", "15 gün — 30 AZN", "30 gün — 50 AZN"] },
];
export default function PromotionOptions({ eligible = true, kind, label }: { eligible?: boolean; kind?: string; label?: string }) {
  const id = useId();
  const root = useRef<HTMLDetailsElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLElement>(null);
  const [opened, setOpened] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const TriggerIcon = packages.find(pack => pack.kind === kind)?.icon ?? Megaphone;
  function close() { if (root.current) root.current.open = false; }
  useEffect(() => {
    if (!opened) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if(panel.current){panel.current.scrollTop=0;panel.current.focus();}
    return () => { document.body.style.overflow = previous; trigger.current?.focus(); };
  }, [opened]);
  return <details ref={root} className="promotionOptions" aria-label="Elanın irəlilədilməsi"
    onToggle={(event) => { setOpened(event.currentTarget.open); if (!event.currentTarget.open) setSelected(null); }}>
    <summary ref={trigger} className={`promotionTrigger${kind ? " " + kind : ""}`}><TriggerIcon aria-hidden="true" size={16} strokeWidth={2} />{label ?? "Elanı reklam et"}</summary>
    <div className="promotionShade" aria-hidden="true" onClick={close} />
    <div ref={panel} className={`promotionPanel${kind?" kindOnly":""}`} role="dialog" aria-modal="true" aria-label="Elanın reklam paketləri" tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === "Escape") { event.preventDefault(); close(); }
        if (event.key !== "Tab") return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button,input,summary,a[href]")).filter(element => element.getClientRects().length > 0 && !element.hasAttribute("disabled"));
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}>
      <div className="promotionModalHeader"><h3>{kind ? (packages.find(pack => pack.kind === kind)?.title ?? "Reklam") : "Reklam paketləri"}</h3><button type="button" aria-label="Reklam pəncərəsini bağla" onClick={close}><X aria-hidden="true" size={20} strokeWidth={2} /></button></div>
      <p>Ödəniş sistemi müvəqqəti işləmir. Paketlərlə tanış ola bilərsən; pul tutulmur və elanın sıralaması dəyişmir.</p>
      {selected && <button type="button" className="textButton" onClick={() => setSelected(null)}><ChevronLeft className="kzI kzIL" aria-hidden="true" size={16} strokeWidth={2.25} />Başqa xidmət seç</button>}
      {packages.filter(pack => kind ? pack.kind === kind : (pack.kind !== "restore" && (!selected || pack.kind === selected))).map(pack => <details key={pack.kind} className="promotionPackage" open={selected === pack.kind || kind === pack.kind}
        onToggle={(event) => {
          if (event.currentTarget.open) { setSelected(pack.kind); if (panel.current) panel.current.scrollTop = 0; }
          else if (selected === pack.kind) setSelected(null);
        }}>
        <summary>
          <span className={`promotionIcon ${pack.kind}`} aria-hidden="true"><pack.icon size={22} strokeWidth={1.75} /></span>
          <span className="promotionHeading"><strong>{pack.title}</strong><small>Paket seç</small></span>
        </summary>
        <p>{pack.description}</p>
        <fieldset className="paymentChoices"><legend>Xidmətin müddəti</legend>
          {pack.plans.map((plan, index) => <label key={plan}>
            <input type="radio" name={`${id}-${pack.kind}-plan`} value={plan} defaultChecked={index === 0} />
            <span>{plan}</span>
          </label>)}
        </fieldset>
        <fieldset className="paymentChoices"><legend>Ödəniş üsulu</legend>
          <label><input type="radio" name={`${id}-${pack.kind}-method`} value="card" defaultChecked /><span>Bank kartı</span></label>
          <label><input type="radio" name={`${id}-${pack.kind}-method`} value="balance" /><span>Şəxsi hesab (0,00 AZN)</span></label>
        </fieldset>
        <button type="button" className="payButton" disabled aria-disabled="true">Ödə</button>
        <p className="payNote" role="status">Ödəniş sistemi müvəqqəti işləmir. Hesabından pul tutulmur.</p>
      </details>)}
      {!eligible && <p>İrəlilətmə yalnız yayımlanmış elanlar üçün mümkün olacaq.</p>}
    </div>
  </details>;
}
