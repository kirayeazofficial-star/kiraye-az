"use client";
import { useState } from "react";

// Azerbaijani mobile number: "+994" is fixed, the user types only the 9 digits after it (50 123 45 67).
const digitsOf = (value: string) => { const d = value.replace(/\D/g, "").replace(/^00/, ""); return (d.startsWith("994") ? d.slice(3) : d.startsWith("0") ? d.slice(1) : d).slice(0, 9); };
const pretty = (d: string) => [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
export default function PhoneInput({ name, label, value, onChange, required }: { name?: string; label: string; value?: string; onChange?: (full: string) => void; required?: boolean }) {
  const [local, setLocal] = useState("");
  const digits = value !== undefined ? digitsOf(value) : local;
  return <span className="kzPhoneInput">
    <span className="kzPhonePrefix" aria-hidden="true">+994</span>
    <input name={name} aria-label={label} type="tel" inputMode="numeric" autoComplete="tel-national" required={required} placeholder="50 123 45 67"
      pattern="[0-9 ]{12}" title="Operator kodu ilə 9 rəqəm yazın, məsələn: 50 123 45 67" maxLength={12}
      value={pretty(digits)} onChange={event => { const next = digitsOf(event.target.value); setLocal(next); onChange?.(next ? `+994${next}` : ""); }} />
  </span>;
}
