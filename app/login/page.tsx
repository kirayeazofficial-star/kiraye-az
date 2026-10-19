"use client";

import { FormEvent, useState } from "react";
import { supabase } from "../../lib/supabase";
import "./login.css";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) { setMessage("Giriş sistemi hazırlanır. Bir neçə dəqiqə sonra yenidən yoxla."); return; }
    const data = new FormData(event.currentTarget), email = String(data.get("email")), password = String(data.get("password"));
    setBusy(true); setMessage("");
    const result = mode === "login" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    setMessage(result.error ? result.error.message : mode === "login" ? "Giriş uğurludur. Ana səhifəyə qayıda bilərsən." : "Hesab yaradıldı. E-poçtuna gələn təsdiq linkinə bas.");
  }
  return <main className="authPage"><a className="logo" href="/">kiraye<span>.az</span></a><section className="authCard"><p className="eyebrow">KİRAYE.AZ HESABI</p><h1>{mode === "login" ? "Xoş gördük" : "Hesab yarat"}</h1><p className="muted">{mode === "login" ? "Elanlarını və seçilmişlərini idarə et." : "Elan vermək üçün pulsuz hesab yarat."}</p><form onSubmit={submit}><label>E-poçt<input required name="email" type="email" placeholder="ad@example.com" /></label><label>Şifrə<input required name="password" type="password" minLength={6} placeholder="Ən az 6 simvol" /></label><button className="add wide" disabled={busy}>{busy ? "Gözləyin..." : mode === "login" ? "Daxil ol" : "Hesab yarat"}</button></form>{message && <p className="authMessage">{message}</p>}<button className="switchMode" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>{mode === "login" ? "Hesabın yoxdur? Qeydiyyatdan keç" : "Hesabın var? Daxil ol"}</button></section></main>;
}
