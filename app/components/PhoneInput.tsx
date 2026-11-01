"use client";
import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";

// Azerbaijani mobile number: "+994" is fixed, the user types only the 9 digits after it.
// Stored values may arrive as +994XXXXXXXXX; the field shows the digits as "50 123 45 67".
// Pasted or typed "+994 50…", "994 50…" or "050…" all become "50…": the country code and the leading 0 are dropped.
const digitsOf = (value: string) => { let d = value.replace(/\D/g, ""); if (d.startsWith("994") && d.length > 9) d = d.slice(3); return d.replace(/^0+/, "").slice(0, 9); };
const spaced = (d: string) => [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
// Caret position in the spaced text right after the n-th digit.
const caretAfter = (text: string, n: number) => { if (n <= 0) return 0; let seen = 0; for (let i = 0; i < text.length; i++) if (/\d/.test(text[i]) && ++seen === n) return i + 1; return text.length; };

export default function PhoneInput({ name, label, value, onChange, required }: { name?: string; label: string; value?: string; onChange?: (full: string) => void; required?: boolean }) {
  const [local, setLocal] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null); // digits before the caret, restored after re-formatting
  // A value from the parent is always "+994…" (or empty): only its prefix is removed, so a half-typed or
  // half-deleted number such as "+9945" shows as "5" and never brings back "994".
  const digits = value !== undefined ? (value.startsWith("+994") ? value.slice(4).replace(/\D/g, "").slice(0, 9) : digitsOf(value)) : local;
  const shown = spaced(digits);
  // Keep the caret where the person was typing (otherwise it jumps to the end after every change).
  useLayoutEffect(() => {
    const field = input.current;
    if (caret.current === null || !field || document.activeElement !== field) return;
    const at = caretAfter(shown, caret.current);
    field.setSelectionRange(at, at);
    caret.current = null;
  }, [shown]);
  const commit = (next: string, digitsBeforeCaret: number) => {
    caret.current = Math.min(digitsBeforeCaret, next.length);
    setLocal(next);
    onChange?.(next ? `+994${next}` : "");
  };
  // Backspace right after a space deletes the digit before it (the space alone would come straight back).
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const field = event.currentTarget, at = field.selectionStart ?? 0;
    if (event.key !== "Backspace" || at !== field.selectionEnd || at === 0 || field.value[at - 1] !== " ") return;
    event.preventDefault();
    const before = field.value.slice(0, at - 1).replace(/\D/g, "");
    commit(before.slice(0, -1) + digits.slice(before.length), before.length - 1);
  };
  return <span className="kzPhoneInput">
    <span className="kzPhonePrefix" aria-hidden="true">+994</span>
    {name && <input type="hidden" name={name} value={digits} />}
    <input ref={input} aria-label={label} type="tel" inputMode="numeric" autoComplete="tel-national" required={required} placeholder="50 123 45 67"
      pattern="[1-9][0-9] [0-9]{3} [0-9]{2} [0-9]{2}" title="+994-dən sonra 0 olmadan 9 rəqəm yazın, məsələn: 50 123 45 67"
      value={shown} onKeyDown={onKeyDown}
      onChange={event => {
        const raw = event.target.value, at = event.target.selectionStart ?? raw.length;
        const next = digitsOf(raw);
        // Digits before the caret, minus any dropped country code / leading zero.
        const dropped = raw.replace(/\D/g, "").length - next.length;
        commit(next, Math.max(0, raw.slice(0, at).replace(/\D/g, "").length - Math.max(0, dropped)));
      }} />
  </span>;
}
