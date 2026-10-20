"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import "../login/style.css";
export default function ResetPassword() {
  const [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [done, setDone] = useState(false);
  useEffect(() => {
    if (!supabase) {
      setNotice("Giriş xidməti hazır deyil.");
      return;
    }
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else setNotice("E-poçtuna gələn yeniləmə linkindən istifadə et.");
    });
    return () => data.subscription.unsubscribe();
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || busy || !ready) return;
    const form = new FormData(e.currentTarget);
    if (form.get("password") !== form.get("confirm")) {
      setNotice("Şifrələr eyni olmalıdır.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: String(form.get("password")),
      });
      if (error) throw error;
      setDone(true);
      setNotice("Şifrən yeniləndi.");
    } catch {
      setNotice("Şifrə yenilənmədi. Yeni link istəyərək təkrar cəhd et.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="loginPage">
      <Link className="logo" href="/">
        kiraye<span>.az</span>
      </Link>
      <section>
        <h1>Yeni şifrə</h1>
        {!done && ready && (
          <form onSubmit={submit}>
            <label>
              Yeni şifrə
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
              />
            </label>
            <label>
              Şifrəni təkrarla
              <input
                name="confirm"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
              />
            </label>
            <button disabled={busy}>
              {busy ? "Yenilənir..." : "Şifrəni saxla"}
            </button>
          </form>
        )}
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
        <Link className="authBack" href={done ? "/profile" : "/login"}>
          {done ? "Kabinetə keç" : "Girişə qayıt"}
        </Link>
      </section>
    </main>
  );
}
