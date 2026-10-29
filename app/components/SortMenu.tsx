"use client";
import { ArrowDownUp, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Compact sort control: a small button that opens our own list (the native picker looked out of place on phones).
export default function SortMenu({ value, options, onChange, label }: { value: string; options: { value: string; label: string }[]; onChange: (value: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", close); };
  }, [open]);
  const current = options.find(option => option.value === value) ?? options[0];
  return <div className="kzSortMenu" ref={root}>
    <button type="button" className="kzSortButton" aria-label={`${label}: ${current.label}`} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)}>
      <ArrowDownUp aria-hidden="true" size={15} strokeWidth={2} /><span>{current.label}</span>
    </button>
    {open && <ul className="kzSortList" role="listbox" aria-label={label}>
      {options.map(option => <li key={option.value} role="option" aria-selected={option.value === value}>
        <button type="button" onClick={() => { onChange(option.value); setOpen(false); }}>
          <span>{option.label}</span>{option.value === value && <Check aria-hidden="true" size={16} strokeWidth={2.5} />}
        </button>
      </li>)}
    </ul>}
  </div>;
}
