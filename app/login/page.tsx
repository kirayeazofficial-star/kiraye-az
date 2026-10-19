"use client";

import { FormEvent, useState } from "react";
import { supabase } from "../../lib/supabase";
import "./style.css";

export default function Login() {
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) { setNotice("Giriş xidməti hazırlanır. Bir az sonra yenidən cəhd et."); return; }
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")), password = String(form.get("password"));
    const response = creating
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
      : await supabase.auth.signInWithPassword({ email, password });
    setNotice(response.error ? response.error.message : creating ? "Hesab yaradıldı. E-poçtuna gələn təsdiq linkinə bas." : "Uğurla daxil oldun.");
  }
  return <main className="loginPage"><a className="logo" href="/">kiraye<span>.az</span></a><section><p>{creating ? "PULSUZ QEYDİYYAT" : "GİRİŞ"}</p><h1>{creating ? "Hesabını yarat" : "Xoş gördük"}</h1><form onSubmit={submit}><label>E-poçt<input name="email" type="email" required placeholder="ad@example.com" /></label><label>Şifrə<input name="password" type="password" minLength={6} required placeholder="Ən az 6 simvol" /></label><button type="submit">{creating ? "Hesab yarat" : "Daxil ol"}</button></form>{notice && <div className="notice">{notice}</div>}<button className="link" onClick={() => {setCreating(!creating);setNotice("");}}>{creating ? "Hesabın var? Daxil ol" : "Hesabın yoxdur? Qeydiyyatdan keç"}</button></section></main>;
}
