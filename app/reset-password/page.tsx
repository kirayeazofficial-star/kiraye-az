"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { authErrorMessage } from "../../lib/auth-messages";
import "../login/style.css";
import Feedback from "../components/Feedback";
import AuthLayout from "../components/AuthLayout";
export default function ResetPassword() {
  const [ready, setReady] = useState(false),
    [checking, setChecking] = useState(true),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [done, setDone] = useState(false),
    [failed, setFailed] = useState(false);
  const recovery = useRef<{email:string;code:string}|null>(null);
  useEffect(() => {
    try{const saved=JSON.parse(sessionStorage.getItem('kiraye:recovery')||'null');if(saved?.email&&/^\d{6}$/.test(saved.code)&&saved.expiresAt>Date.now()){recovery.current=saved;setReady(true);}else setNotice('Bərpa kodunun vaxtı bitib. Yeni kod istəyin.');}catch{setNotice('Bərpa kodu tapılmadı. Yeni kod istəyin.');}finally{setChecking(false);}
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
      const data=await response.json();if(!response.ok)throw Object.assign(new Error(data.error||'Şifrə yenilənmədi.'),{code:data.error,status:response.status});
      try {
        sessionStorage.removeItem("kiraye:pending-confirmation");
        sessionStorage.removeItem("kiraye:auth-retry-at");
        sessionStorage.removeItem("kiraye:recovery");
      } catch {}
      setDone(true);
      setNotice("Şifrəniz yeniləndi. İndi hesabınızdan istifadə edə bilərsiniz.");
    } catch (error) {
      setFailed(true);
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
        <AuthLayout><section>
          <h1>{done ? "Şifrəniz yeniləndi" : "Yeni şifrə"}</h1>
          {checking ? (
            <p className="notice" role="status">
              Bərpa məlumatları yoxlanılır…
            </p>
          ) : !done && ready ? (
            <>
              <p className="authLead">
                Ən azı 8 simvoldan ibarət yeni şifrə seçin.
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
                  {notice && <Feedback>{notice}</Feedback>}
                  <button className="authSubmit" disabled={busy}>
                    {busy ? "Yenilənir…" : "Şifrəni saxla"}
                  </button>
                </fieldset>
              </form>
            </>
          ) : null}
          {notice && (!ready || done) && <Feedback tone={done ? "success" : "error"}>{notice}</Feedback>}
          {done
            ? <Link className="kzButton kzAuthDone" href="/profile">Kabinetə keç</Link>
            : (!ready && !checking) || failed ? <div className="kzAuthLinks"><Link href="/login?mode=reset">Yeni bərpa kodu istəyin</Link><Link href="/login">Girişə qayıt</Link></div> : null}
        </section></AuthLayout>
      </div>
    </main>
  );
}
