"use client";
import { CreditCard, X } from "lucide-react";
import { useEffect, useRef } from "react";

// Shown where a paid step would start (restore / send over the free limit) while payments are not connected.
export default function PaymentDialog({ title, text, onClose }: { title: string; text: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  return <dialog ref={dialog} className="kzPayDialog" aria-labelledby="kz-pay-title"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="kzPayBody" tabIndex={-1} autoFocus>
      <button type="button" className="kzPayClose" aria-label="Bağla" onClick={onClose}><X aria-hidden="true" size={18} strokeWidth={2.25} /></button>
      <span className="kzPayIcon" aria-hidden="true"><CreditCard size={26} strokeWidth={1.9} /></span>
      <h2 id="kz-pay-title">{title}</h2>
      <p>{text}</p>
      <p className="kzPayNote">Ödəniş sistemi hələ qoşulmayıb. Qoşulan kimi bu düymə ilə ödəyə biləcəksiniz.</p>
      <button type="button" className="kzButton" onClick={onClose}>Başa düşdüm</button>
    </div>
  </dialog>;
}
