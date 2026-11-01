"use client";
import { PAYMENT_DOWN } from "../../lib/payment-status";
import { ArrowUp, ChevronLeft, ChevronRight, Crown, Gem, Megaphone, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { paidVisible, useSiteFlags } from "../../lib/use-site-flags";
import { toast } from "../../lib/toast";

type Kind = "bump" | "vip" | "premium";
type Plan = { label: string; price: string; extra?: string };
type Pack = { kind: Kind; title: string; action: string; icon: LucideIcon; from: string; description: string; bonus?: { before: string; now: string }; plans: Plan[] };

// Prices and wording of the paid services (payments are not connected yet: "Ödə" only explains that).
export const packs: Pack[] = [
  { kind: "bump", title: "İrəli çək", action: "Elanı irəli çək", icon: ArrowUp, from: "1,50",
    description: "Elan seçdiyin sayda, hər 8 saatdan bir öz kateqoriyasının axtarış nəticələrində birinci yerə qalxacaq.",
    plans: [{ label: "3 dəfə (8 saatdan bir)", price: "1,50" }, { label: "9 dəfə (8 saatdan bir)", price: "2,00" }, { label: "15 dəfə (8 saatdan bir)", price: "3,00" }, { label: "30 dəfə (8 saatdan bir)", price: "5,00" }] },
  { kind: "vip", title: "VIP", action: "VIP et", icon: Gem, from: "3",
    description: "Elan VIP bölməsində və öz kateqoriyasının axtarış nəticələrində təsadüfi qaydada göstəriləcək.",
    bonus: { before: "1 dəfə irəli çək", now: "Hər gün irəli çək" },
    plans: [{ label: "1 gün", price: "3,00", extra: "1 irəli çək" }, { label: "5 gün", price: "6,00" }, { label: "15 gün", price: "15,00" }, { label: "30 gün", price: "25,00" }] },
  { kind: "premium", title: "Premium", action: "Premium et", icon: Crown, from: "5",
    description: "Elan əsas səhifənin Premium bölməsində göstəriləcək və xidmət müddətinin sonunadək orada qalacaq.",
    bonus: { before: "1 dəfə irəli çək + VIP", now: "Hər gün irəli çək + VIP" },
    plans: [{ label: "1 gün", price: "5,00", extra: "1 irəli çək + VIP" }, { label: "5 gün", price: "15,00" }, { label: "15 gün", price: "30,00" }, { label: "30 gün", price: "50,00" }] },
];

// Trigger + dialog for paid promotion. With `kind` it opens that service directly; without it the
// dialog first lets the owner choose a service. `card` renders the trigger as a small price card.
export default function PromotionOptions({ eligible = true, kind, label, card = false, listingId }: { eligible?: boolean; kind?: Kind; label?: string; card?: boolean; listingId?: string }) {
  const id = useId();
  const flags = useSiteFlags();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<Kind | null>(kind ?? null);
  const [plan, setPlan] = useState(0), [method, setMethod] = useState("card"), [notice, setNotice] = useState(false);
  // The leader uses every service for free: "Ödə" becomes "Pulsuz aktivləşdir".
  const [staff, setStaff] = useState(false), [busy, setBusy] = useState(false), [done, setDone] = useState(""), [failed, setFailed] = useState("");
  // Store owners have free bumps in their package (per month).
  const [storeBumps, setStoreBumps] = useState<{ left: number; total: number } | null>(null);
  useEffect(() => { if (!open) return; fetch("/api/auth/host", { cache: "no-store" }).then(r => r.json()).then(d => setStaff(!!d.leader)).catch(() => {});
    fetch("/api/stores?mine=1", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(d => setStoreBumps(d?.terms?.free_bumps ? { left: d.terms.bumps_left, total: d.terms.free_bumps } : null)).catch(() => {}); }, [open]);
  async function storeBump() {
    if (!listingId || busy) return;
    setBusy(true); setFailed("");
    try {
      const response = await fetch("/api/listings/promote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: listingId, kind: "store_bump" }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error === "NO_FREE_BUMPS" ? "Bu ay üçün pulsuz irəli çəkmələr bitib." : "İrəli çəkmək alınmadı. Yenidən cəhd edin.");
      toast("Elan pulsuz irəli çəkildi.", { afterReload: true });
      setDone("ok"); window.location.reload();
    } catch (problem) { setFailed(problem instanceof Error ? problem.message : "İrəli çəkmək alınmadı."); }
    finally { setBusy(false); }
  }
  async function activate(kindToUse: Kind) {
    if (!listingId || busy) return;
    setBusy(true); setFailed("");
    try {
      const response = await fetch("/api/listings/promote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: listingId, kind: kindToUse, plan }) });
      if (!response.ok) throw new Error();
      // The dialog closes at once; the green message (with ✕) appears after the page refreshes.
      const title = packs.find(item => item.kind === kindToUse)?.title;
      toast(kindToUse === "bump" ? "Elan irəli çəkildi." : `Elan ${title} edildi.`, { afterReload: true });
      setDone("ok"); window.location.reload();
    } catch { setFailed("Aktivləşdirmək alınmadı. Yenidən cəhd edin."); }
    finally { setBusy(false); }
  }
  const own = packs.find(item => item.kind === kind);
  const pack = packs.find(item => item.kind === chosen);
  useEffect(() => {
    const node = dialog.current;
    if (!open || !node) return;
    node.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { node.close(); document.body.style.overflow = previous; };
  }, [open]);
  const close = () => { setOpen(false); setChosen(kind ?? null); setPlan(0); setNotice(false); setDone(""); setFailed(""); };
  const Icon = own?.icon ?? Megaphone;
  // Paid services switched off by the leader: no button at all (the leader still sees it).
  if (!paidVisible(flags)) return null;
  return <>
    <button type="button" className={`promotionTrigger${kind ? " " + kind : ""}${card ? " kzPromoCard" : ""}`} disabled={!eligible} onClick={() => setOpen(true)}>
      {card && own ? <><span className="kzPromoCardText"><strong>{label ?? own.title}</strong><small>{own.from} AZN-dən</small></span><Icon aria-hidden="true" size={18} strokeWidth={2} /></>
        : <><Icon aria-hidden="true" size={16} strokeWidth={2} />{label ?? "Elanı reklam et"}</>}
    </button>
    {/* Rendered at the end of <body> so no card or list styling of the trigger's parent reaches it. */}
    {open && createPortal(<dialog ref={dialog} className="kzPromoDlg" aria-labelledby={`${id}-title`}
      onCancel={event => { event.preventDefault(); close(); }}
      onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <div className="kzPromoBody" tabIndex={-1} autoFocus>
        <header className="kzPromoHead">
          {!kind && pack && <button type="button" className="kzPromoIconBtn" aria-label="Xidmətlərə qayıt" onClick={() => { setChosen(null); setPlan(0); setNotice(false); }}><ChevronLeft aria-hidden="true" size={20} strokeWidth={2} /></button>}
          <h2 id={`${id}-title`}>{pack ? <><pack.icon className={`kzPromoKind ${pack.kind}`} aria-hidden="true" size={20} strokeWidth={2.25} />{pack.action}</> : "Elanı reklam et"}</h2>
          <button type="button" className="kzPromoIconBtn" aria-label="Bağla" onClick={close}><X aria-hidden="true" size={20} strokeWidth={2} /></button>
        </header>
        {!pack ? <div className="kzPromoChoose">
          {packs.map(item => <button key={item.kind} type="button" className="kzPromoOption" onClick={() => setChosen(item.kind)}>
            <span className={`kzPromoOptionIcon ${item.kind}`}><item.icon aria-hidden="true" size={20} strokeWidth={2} /></span>
            <span className="kzPromoOptionText"><strong>{item.title}</strong><small>{item.description}</small></span>
            <span className="kzPromoOptionPrice">{item.from} AZN-dən<ChevronRight aria-hidden="true" size={16} strokeWidth={2} /></span>
          </button>)}
        </div> : <>
          <p className="kzPromoDesc">{pack.description}</p>
          {pack.kind === "bump" && !staff && storeBumps && listingId && <div className="kzPromoStore">
            <div><strong>Mağaza paketi</strong><small>Bu ay {storeBumps.left} / {storeBumps.total} pulsuz irəli çək qalıb</small></div>
            <button type="button" className="kzPromoPay" disabled={busy || !!done || storeBumps.left < 1} onClick={() => void storeBump()}>{busy || done ? "Gözləyin…" : "Pulsuz irəli çək"}</button>
            {failed && <p className="kzPromoNotice" role="alert">{failed}</p>}
          </div>}
          {pack.bonus && <div className="kzPromoBonus">
            <span className="kzPromoBonusTag">BONUS</span>
            <div><small>Əvvəl</small><s>{pack.bonus.before}</s></div>
            <div><small>İndi</small><b><ArrowUp aria-hidden="true" size={14} strokeWidth={2.5} />{pack.bonus.now}</b></div>
          </div>}
          <p className="kzPromoSection">Xidmətin müddətini seçin</p>
          <div className="kzPromoList" role="radiogroup" aria-label="Xidmətin müddəti">
            {pack.plans.map((item, index) => <label key={item.label} className={plan === index ? "on" : ""}>
              <input type="radio" name={`${id}-plan`} checked={plan === index} onChange={() => setPlan(index)} />
              <span className="kzPromoRadio" aria-hidden="true" />
              <span className="kzPromoPlan">{item.label} / {item.price} AZN</span>
              {item.extra && <span className="kzPromoExtra">{item.extra}</span>}
            </label>)}
          </div>
          {!staff && <><p className="kzPromoSection">Ödəniş üsulunu seçin</p>
          <div className="kzPromoList" role="radiogroup" aria-label="Ödəniş üsulu">
            {[["card", "Bank kartı"], ["balance", "Şəxsi hesab (0,00 AZN)"]].map(([value, text]) => <label key={value} className={method === value ? "on" : ""}>
              <input type="radio" name={`${id}-method`} checked={method === value} onChange={() => setMethod(value)} />
              <span className="kzPromoRadio" aria-hidden="true" />
              <span className="kzPromoPlan">{text}</span>
            </label>)}
          </div></>}
          <footer className="kzPromoFoot">
            {staff ? <>
              <p className="kzPromoStaff">Rəhbər üçün bütün xidmətlər pulsuzdur.</p>
              {failed && <p className="kzPromoNotice" role="alert">{failed}</p>}
              <button type="button" className="kzPromoPay" disabled={busy || !!done || !listingId} onClick={() => void activate(pack.kind)}>{busy || done ? "Gözləyin…" : "Pulsuz aktivləşdir"}</button>
            </> : <>
              {notice && <p className="kzPromoNotice" role="alert">{PAYMENT_DOWN}</p>}
              <button type="button" className="kzPromoPay" onClick={() => setNotice(true)}>Ödə · {pack.plans[plan].price} AZN</button>
            </>}
            {!staff && <p className="kzPromoLegal">«Ödə» düyməsini sıxmaqla kirayeal.az-ın <Link href="/terms">İstifadəçi razılaşmasını</Link> qəbul etmiş olursunuz.</p>}
          </footer>
        </>}
      </div>
    </dialog>, document.body)}
  </>;
}
