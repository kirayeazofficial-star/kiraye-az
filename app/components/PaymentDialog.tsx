"use client";
import { CreditCard, TriangleAlert, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { manat } from "../../lib/limit-rules";
import { PAYMENT_DOWN } from "../../lib/payment-status";
import { toast } from "../../lib/toast";

// A paid step (restore / listing over the free limit). With a price it offers "Ödə"; until the payment provider
// is connected, paying shows the temporary-problem notice and nothing is charged.
export default function PaymentDialog({ title, text, price, onClose }: { title: string; text: string; price?: number; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [down, setDown] = useState(false);
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  const pay = () => { setDown(true); toast("Ödəniş hazırda mümkün deyil", { kind: "error" }); };
  return <dialog ref={dialog} className="kzPayDialog" aria-labelledby="kz-pay-title"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="kzPayBody" tabIndex={-1} autoFocus>
      <button type="button" className="kzPayClose" aria-label="Bağla" onClick={onClose}><X aria-hidden="true" size={18} strokeWidth={2.25} /></button>
      <span className="kzPayIcon" aria-hidden="true"><CreditCard size={26} strokeWidth={1.9} /></span>
      <h2 id="kz-pay-title">{title}</h2>
      <p>{text}</p>
      {price !== undefined && <p className="kzPayPrice"><span>Məbləğ</span><b>{manat(price)}</b></p>}
      {down && <p className="kzPayNote kzPayDown" role="alert"><TriangleAlert aria-hidden="true" size={16} strokeWidth={2.2} />{PAYMENT_DOWN}</p>}
      {price !== undefined
        ? <button type="button" className="kzButton" onClick={pay}>Ödə · {manat(price)}</button>
        : <button type="button" className="kzButton" onClick={onClose}>Başa düşdüm</button>}
    </div>
  </dialog>;
}
