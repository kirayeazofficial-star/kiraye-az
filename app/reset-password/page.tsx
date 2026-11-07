"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { authErrorMessage } from "../../lib/auth-messages";
import "../login/style.css";
import Header from "../components/Header";
import { CircleCheck, Eye, EyeOff, KeyRound, Lock } from "lucide-react";
export default function ResetPassword() {
  const [ready, setReady] = useState(false),
    [checking, setChecking] = useState(true),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [done, setDone] = useState(false),
    [failed, setFailed] = useState(false),
    [show, setShow] = useState(false),
    [errors, setErrors] = useState<Record<string, string>>({});
  const recovery = useRef<{email:string;code:string}|null>(null);
  useEffect(() => {
    try{const saved=JSON.parse(sessionStorage.getItem('kiraye:recovery')||'null');if(saved?.email&&/^\d{6}$/.test(saved.code)&&saved.expiresAt>Date.now()){recovery.current=saved;setReady(true);}else setNotice('Bərpa kodunun vaxtı bitib. Yeni kod istəyin.');}catch{setNotice('Bərpa kodu tapılmadı. Yeni kod istəyin.');}finally{setChecking(false);}
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || !ready || !recovery.current) return;
    const form = new FormData(e.currentTarget);
    if (form.get("password") !== form.get("confirm")) {
      setErrors({ confirm: "Şifrələr eyni deyil. Eyni şifrəni təkrar yazın." });
      (e.currentTarget.elements.namedItem("confirm") as HTMLInputElement | null)?.focus();
      return;
    }
    setErrors({});
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
      setNotice("Şifrəniz yeniləndi. İndi hesabınızdan istifadə edə bilərsiniz.");
    } catch (error) {
      setFailed(true);
      setNotice(authErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  const clear = (name: string) => { if (errors[name]) setErrors(current => { const next = { ...current }; delete next[name]; return next; }); };
  return (
    <main className="loginPage">
      <Header />
      <div className="authShell">
        <section aria-labelledby="auth-title">
          <span className="authBadge" aria-hidden="true">{done ? <CircleCheck size={26} strokeWidth={2}/> : <KeyRound size={26} strokeWidth={2}/>}</span>
          <h1 id="auth-title">{done ? "Şifrəniz yeniləndi" : "Yeni şifrə təyin edin"}</h1>
          <p className="authLead">{done ? "Artıq yeni şifrə ilə daxil ola bilərsiniz" : checking ? "Bərpa kodu yoxlanılır" : "Ən azı 8 simvoldan ibarət şifrə yazın"}</p>
          {!checking && !done && ready && (
            <form onSubmit={submit} noValidate={false}
              onInvalid={(event) => { const field = event.target as HTMLInputElement; event.preventDefault(); setErrors(current => ({ ...current, [field.name]: field.value ? "Şifrə ən azı 8 simvoldan ibarət olmalıdır." : field.name === "confirm" ? "Şifrəni təkrar yazın." : "Yeni şifrəni yazın." })); }}
              onInput={(event) => clear((event.target as HTMLInputElement).name)}>
              <fieldset className="authFields" disabled={busy}>
                <div className="authPasswordGroup">
                  <div className={`passwordField authFloat${errors.password ? " authInvalid" : ""}`}>
                    <label className="authTag" htmlFor="new-password">Yeni şifrə</label>
                    <input id="new-password" name="password" type={show ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={128} required placeholder="Ən azı 8 simvol" aria-invalid={!!errors.password} />
                    <button type="button" className="passwordToggle" aria-label={show ? "Şifrəni gizlət" : "Şifrəni göstər"} aria-pressed={show} onClick={() => setShow(value => !value)}>{show ? <EyeOff aria-hidden="true" size={20} strokeWidth={1.9}/> : <Eye aria-hidden="true" size={20} strokeWidth={1.9}/>}</button>
                  </div>
                  {errors.password && <small className="authFieldError" role="alert">{errors.password}</small>}
                </div>
                <div className="authPasswordGroup">
                  <div className={`passwordField authFloat${errors.confirm ? " authInvalid" : ""}`}>
                    <label className="authTag" htmlFor="confirm-password">Şifrəni təkrar yazın</label>
                    <input id="confirm-password" name="confirm" type={show ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={128} required placeholder="Eyni şifrə" aria-invalid={!!errors.confirm} />
                  </div>
                  {errors.confirm && <small className="authFieldError" role="alert">{errors.confirm}</small>}
                </div>
                {notice && <div className="notice authFormNotice" role="alert">{notice}</div>}
                <button className="authSubmit" disabled={busy}>{busy ? "Yenilənir…" : "Şifrəni saxla"}</button>
              </fieldset>
            </form>
          )}
          {(checking || done || !ready) && notice && <div className={`notice authFormNotice${done ? " ok" : ""}`} role="status">{notice}</div>}
          {done
            ? <Link className="authSubmit kzAuthDone" href="/profile">Kabinetə keçin</Link>
            : (!ready && !checking) || failed ? <div className="kzAuthLinks"><Link href="/login?mode=reset">Yeni bərpa kodu istəyin</Link><Link href="/login">Girişə qayıdın</Link></div> : null}
        </section>
        <p className="authSafe"><Lock aria-hidden="true" size={14} strokeWidth={2}/>Məlumatlarınız qorunur və heç kimə verilmir</p>
      </div>
    </main>
  );
}
