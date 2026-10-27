"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { authErrorMessage } from "../../lib/auth-messages";
import "../login/style.css";
export default function ResetPassword() {
  const [ready, setReady] = useState(false),
    [checking, setChecking] = useState(true),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [done, setDone] = useState(false);
  const recovery = useRef<{email:string;code:string}|null>(null);
  useEffect(() => {
    try{const saved=JSON.parse(sessionStorage.getItem('kiraye:recovery')||'null');if(saved?.email&&/^\d{6}$/.test(saved.code)&&saved.expiresAt>Date.now()){recovery.current=saved;setReady(true);}else setNotice('Bərpa kodunun vaxtı bitib. Yeni kod istə.');}catch{setNotice('Bərpa kodu tapılmadı. Yeni kod istə.');}finally{setChecking(false);}
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || !ready || !recovery.current) return;
    const form = new FormData(e.currentTarget);
    if (form.get("password") !== form.get("confirm")) {
      setNotice("Şifrələr eyni olmalıdır.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const response=await fetch('/api/auth/host',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'reset_password',email:recovery.current.email,code:recovery.current.code,password:String(form.get('password'))})});
      const data=await response.json();if(!response.ok)throw new Error(data.error||'Şifrə yenilənmədi.');
      try {
        sessionStorage.removeItem("kiraye:pending-confirmation");
        sessionStorage.removeItem("kiraye:auth-retry-at");
        sessionStorage.removeItem("kiraye:recovery");
      } catch {}
      setDone(true);
      setNotice("Şifrən yeniləndi. İndi hesabından istifadə edə bilərsən.");
    } catch (error) {
      setNotice(authErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="loginPage">
      <div className="authHeader">
        <Link className="logo" href="/">
          kirayeal<span>.az</span>
        </Link>
        <Link href="/help">Kömək</Link>
      </div>
      <div className="authShell">
        <section>
          <h1>{done ? "Şifrən yeniləndi" : "Yeni şifrə"}</h1>
          {checking ? (
            <p className="notice" role="status">
              Bərpa linki yoxlanılır...
            </p>
          ) : !done && ready ? (
            <>
              <p className="authLead">
                Bu sayt üçün yeni şifrə seç. Ən azı 8 simvol istifadə et.
              </p>
              <form onSubmit={submit}>
                <fieldset className="authFields" disabled={busy}>
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
                  <button className="authSubmit" disabled={busy}>
                    {busy ? "Yenilənir..." : "Şifrəni saxla"}
                  </button>
                </fieldset>
              </form>
            </>
          ) : null}
          {notice && (
            <p className="notice" role="status">
              {notice}
            </p>
          )}
          <Link
            className={done ? "authSubmit authBack" : "authBack"}
            href={done ? "/profile" : "/login"}
          >
            {done ? "Kabinetə keç" : "Girişə qayıt / Yeni bərpa linki istə"}
          </Link>
        </section>
      </div>
    </main>
  );
}
