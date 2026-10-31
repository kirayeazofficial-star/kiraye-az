"use client";
import { useEffect, useRef, useState } from "react";
import { CircleCheck, TriangleAlert, X } from "lucide-react";

type Toast = { id: number; text: string; kind: "success" | "error" };
// One place for success messages: bottom of the screen on phones, top right on computers.
export default function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  const next = useRef(1);
  useEffect(() => {
    const add = (detail: { text: string; kind?: "success" | "error" }) => {
      const id = next.current++;
      setItems(list => [...list.slice(-2), { id, text: detail.text, kind: detail.kind ?? "success" }]);
      setTimeout(() => setItems(list => list.filter(item => item.id !== id)), 4500);
    };
    try { const saved = sessionStorage.getItem("kz-toast"); if (saved) { sessionStorage.removeItem("kz-toast"); add(JSON.parse(saved)); } } catch { /* private mode */ }
    const listener = (event: Event) => add((event as CustomEvent).detail);
    window.addEventListener("kz-toast", listener);
    return () => window.removeEventListener("kz-toast", listener);
  }, []);
  if (!items.length) return null;
  return <div className="kzToasts" aria-live="polite">
    {items.map(item => <div key={item.id} className={`kzToast ${item.kind}`} role="status">
      {item.kind === "error" ? <TriangleAlert aria-hidden="true" size={20} strokeWidth={2.2} /> : <CircleCheck aria-hidden="true" size={20} strokeWidth={2.2} />}
      <span>{item.text}</span>
      <button type="button" aria-label="Bağla" onClick={() => setItems(list => list.filter(other => other.id !== item.id))}><X aria-hidden="true" size={18} strokeWidth={2.2} /></button>
    </div>)}
  </div>;
}
