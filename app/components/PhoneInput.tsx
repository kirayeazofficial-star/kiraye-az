"use client";
import { useState } from "react";

// Azerbaijani mobile number: "+994" is fixed, the user types only the 9 digits after it.
// Stored values may arrive as +994XXXXXXXXX; the field itself shows exactly what the user typed (digits only).
// Pasted or typed "+994 50…", "994 50…" or "050…" all become "50…": the country code and the leading 0 are dropped.
const digitsOf = (value: string) => { let d = value.replace(/\D/g, ""); if (d.startsWith("994") && d.length > 9) d = d.slice(3); return d.replace(/^0+/, "").slice(0, 9); };
// Shown as "50 123 45 67"; the form still receives the plain 9 digits (hidden field).
const spaced = (d: string) => [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
export default function PhoneInput({ name, label, value, onChange, required }: { name?: string; label: string; value?: string; onChange?: (full: string) => void; required?: boolean }) {
  const [local, setLocal] = useState("");
  // A value from the parent is always "+994…" (or empty): only its prefix is removed, so a half-typed or
  // half-deleted number such as "+9945" shows as "5" and never brings back "994".
  const digits = value !== undefined ? (value.startsWith("+994") ? value.slice(4).replace(/\D/g, "").slice(0, 9) : digitsOf(value)) : local;
  return <span className="kzPhoneInput">
    <span className="kzPhonePrefix" aria-hidden="true">+994</span>
    {name && <input type="hidden" name={name} value={digits} />}
    <input aria-label={label} type="tel" inputMode="numeric" autoComplete="tel-national" required={required} placeholder="50 123 45 67"
      pattern="[1-9][0-9] [0-9]{3} [0-9]{2} [0-9]{2}" title="+994-dən sonra 0 olmadan 9 rəqəm yazın, məsələn: 50 123 45 67"
      value={spaced(digits)} onChange={event => { const next = digitsOf(event.target.value); setLocal(next); onChange?.(next ? `+994${next}` : ""); }} />
  </span>;
}
