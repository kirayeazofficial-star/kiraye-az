"use client";
import { useEffect, useId, useRef, useState } from "react";
import { PROMOTION_PLANS, formatAzn } from "../../lib/promotions";
const packages = [
  { title: "İrəli çək", icon: "⬆️", kind: "bump", description: "Elan seçdiyin sayda, hər 8 saatdan bir irəli çəkiləcək." },
  { title: "VIP", icon: "💎", kind: "vip", description: "Öz kateqoriyasında adi elanlardan yuxarıda, VIP nişanı ilə göstərilir." },
  { title: "Premium", icon: "👑", kind: "premium", description: "Bütün elanların ən yuxarısında, Premium nişanı ilə göstərilir." },
];
export default function PromotionOptions({ eligible = true, listingId = "" }: { eligible?: boolean; listingId?: string }) {
  const id = useId();
  const root = useRef<HTMLDetailsElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLElement>(null);
  const [opened, setOpened] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [plan, setPlan] = useState<Record<string, string>>({});
  const [balance, setBalance] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!opened) return; fetch("/api/wallet", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(d => { if (d) setBalance(d.balance); }).catch(() => {}); }, [opened]);
  async function buy(kind: string) {
    const planId = plan[kind] || PROMOTION_PLANS.find(p => p.kind === kind)!.id;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/wallet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listingId, planId }) }), data = await response.json();
      if (response.ok) { setBalance(data.balance); setMessage("Xidmət aktivləşdirildi. Elan sıralamada irəli çıxacaq."); }
      else setMessage(data.error === "INSUFFICIENT_BALANCE" ? "Balansda kifayət qədər vəsait yoxdur. Balansı artırmaq üçün idarəçi ilə əlaqə saxla." : data.error === "LISTING_NOT_ELIGIBLE" ? "Yalnız yayımlanmış elanlar üçün mümkündür." : "Əməliyyat tamamlanmadı. Bir az sonra yenidən yoxla.");
    } catch { setMessage("Əməliyyat tamamlanmadı. Bir az sonra yenidən yoxla."); } finally { setBusy(false); }
  }
  function close() { if (root.current) root.current.open = false; }
  useEffect(() => {
    if (!opened) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => { document.body.style.overflow = previous; trigger.current?.focus(); };
  }, [opened]);
  return <details ref={root} className="promotionOptions" aria-label="Elanın irəlilədilməsi"
    onToggle={(event) => { setOpened(event.currentTarget.open); if (!event.currentTarget.open) setSelected(null); }}>
    <summary ref={trigger} className="promotionTrigger"><span aria-hidden="true">📣</span> Elanı reklam et</summary>
    <div className="promotionShade" aria-hidden="true" onClick={close} />
    <div ref={panel} className="promotionPanel" role="dialog" aria-modal="true" aria-label="Elanın reklam paketləri" tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === "Escape") { event.preventDefault(); close(); }
        if (event.key !== "Tab") return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button,input,summary,a[href]")).filter(element => element.getClientRects().length > 0 && !element.hasAttribute("disabled"));
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}>
      <div className="promotionModalHeader"><h3>Reklam paketləri</h3><button type="button" aria-label="Reklam pəncərəsini bağla" onClick={close}>×</button></div>
      <p>Xidmət şəxsi hesabın balansından ödənilir{balance !== null ? <> · Balans: <strong>{formatAzn(balance)}</strong></> : null}.</p>{message && <p role="status">{message}</p>}
      {selected && <button type="button" className="textButton" onClick={() => setSelected(null)}>← Başqa xidmət seç</button>}
      {packages.filter(pack => !selected || pack.kind === selected).map(pack => <details key={pack.kind} className="promotionPackage" open={selected === pack.kind}
        onToggle={(event) => {
          if (event.currentTarget.open) { setSelected(pack.kind); if (panel.current) panel.current.scrollTop = 0; }
          else if (selected === pack.kind) setSelected(null);
        }}>
        <summary>
          <span className={`promotionIcon ${pack.kind}`} aria-hidden="true">{pack.icon}</span>
          <span className="promotionHeading"><strong>{pack.title}</strong><small>Paket seç</small></span>
        </summary>
        <p>{pack.description}</p>
        <fieldset className="paymentChoices"><legend>Xidmətin müddəti</legend>
          {PROMOTION_PLANS.filter(p => p.kind === pack.kind).map((p, index) => <label key={p.id}>
            <input type="radio" name={`${id}-${pack.kind}-plan`} value={p.id} checked={(plan[pack.kind] || (index === 0 ? p.id : "")) === p.id} onChange={() => setPlan(current => ({ ...current, [pack.kind]: p.id }))} />
            <span>{p.label} — {formatAzn(p.price)}</span>
          </label>)}
        </fieldset>
        <button type="button" className="add" disabled={busy || !eligible || !listingId} onClick={() => buy(pack.kind)}>{busy ? "Gözlə…" : "Balansdan ödə"}</button>
      </details>)}
      {!eligible && <p>İrəlilətmə yalnız yayımlanmış elanlar üçün mümkün olacaq.</p>}
    </div>
  </details>;
}
