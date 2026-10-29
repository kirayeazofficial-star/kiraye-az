"use client";
import { useState } from "react";

// Azerbaijani mobile number: "+994" is fixed, the user types only the 9 digits after it.
// Stored values may arrive as +994XXXXXXXXX; the field itself shows exactly what the user typed (digits only).
const digitsOf = (value: string) => { const d = value.replace(/\D/g, ""); return (d.startsWith("994") && d.length > 9 ? d.slice(3) : d).slice(0, 9); };
export default function PhoneInput({ name, label, value, onChange, required }: { name?: string; label: string; value?: string; onChange?: (full: string) => void; required?: boolean }) {
  const [local, setLocal] = useState("");
  const digits = value !== undefined ? digitsOf(value) : local;
  return <span className="kzPhoneInput">
    <span className="kzPhonePrefix" aria-hidden="true">+994</span>
    <input name={name} aria-label={label} type="tel" inputMode="numeric" autoComplete="tel-national" required={required} placeholder="501234567"
      pattern="[1-9][0-9]{8}" title="+994-dən sonra 0 olmadan 9 rəqəm yazın, məsələn: 501234567" maxLength={9}
      value={digits} onChange={event => { const next = digitsOf(event.target.value); setLocal(next); onChange?.(next ? `+994${next}` : ""); }} />
  </span>;
}
