"use client";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

type AskOptions = { title: string; text?: string; input?: string; label?: string; minLength?: number; ok?: string; cancel?: string; danger?: boolean };

function AskDialog({ title, text, input, label, minLength = 0, ok = "Təsdiq et", cancel = "Ləğv et", danger, done }: AskOptions & { done: (value: string | null) => void }) {
  const [value, setValue] = useState(input ?? "");
  const field = useRef<HTMLTextAreaElement>(null), okButton = useRef<HTMLButtonElement>(null);
  const withInput = input !== undefined, short = withInput && value.trim().length < minLength;
  useEffect(() => {
    if (withInput) { field.current?.focus(); field.current?.select(); } else okButton.current?.focus();
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") done(null); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [done, withInput]);
  return <div className="kzAskLayer" onMouseDown={event => { if (event.target === event.currentTarget) done(null); }}>
    <form className="kzAsk" role="dialog" aria-modal="true" aria-labelledby="kzAskTitle" onSubmit={event => { event.preventDefault(); if (!short) done(withInput ? value.trim() : ""); }}>
      <strong id="kzAskTitle">{title}</strong>
      {text && <p>{text}</p>}
      {withInput && <label className="kzAskField">{label && <span>{label}</span>}<textarea ref={field} rows={3} maxLength={300} value={value} onChange={event => setValue(event.target.value)} /></label>}
      {withInput && minLength > 0 && short && <small className="kzAskHint">Ən azı {minLength} simvol yazın.</small>}
      <div className="kzAskActions">
        <button type="button" className="kzAskCancel" onClick={() => done(null)}>{cancel}</button>
        <button ref={okButton} type="submit" className={`kzAskOk${danger ? " danger" : ""}`} disabled={short}>{ok}</button>
      </div>
    </form>
  </div>;
}

// Site-styled replacement for window.confirm / window.prompt.
// Resolves to the typed text (or "" without an input) on confirm, null on cancel.
export function ask(options: AskOptions): Promise<string | null> {
  return new Promise(resolve => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    const done = (value: string | null) => { root.unmount(); host.remove(); resolve(value); };
    root.render(<AskDialog {...options} done={done} />);
  });
}
