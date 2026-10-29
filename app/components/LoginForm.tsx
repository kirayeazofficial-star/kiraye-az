"use client";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { normalizePhone } from "../../lib/rental-details";
import { createStrongPassword } from "../../lib/strong-password";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  authErrorMessage,
  safeLoginDestination,
} from "../../lib/auth-messages";
import {rememberLogin,setRememberLogin} from '../../lib/auth-storage';
import { rateLimitSeconds } from "../../lib/auth-throttle";
import GoogleLogin from "../components/GoogleLogin";
import "../login/style.css";
type Verification = "signup" | "recovery";
const pendingKey = "kiraye:pending-confirmation";
async function hostAuth(action:string,payload:Record<string,unknown>={}){
  const response=await fetch('/api/auth/host',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...payload})});
  const data=await response.json();
  if(!response.ok){const error=new Error(data.error||'SERVICE_UNAVAILABLE') as Error&{code?:string;status?:number};error.code=data.error;error.status=response.status;throw error;}
  return data;
}
export default function Login({
  initialMode = "login",
  next = "/profile",
}: {
  initialMode?: "login" | "signup" | "reset";
  next?: string;
}) {
  const [phoneEnabled, setPhoneEnabled] = useState(false);
  const [remember,setRemember]=useState(true);
  useEffect(()=>setRemember(rememberLogin()),[]);
  const [ready, setReady] = useState(false);
  const emailInput = useRef<HTMLInputElement>(null);
  const passwordInput = useRef<HTMLInputElement>(null);
  const [loginFailed, setLoginFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setPhoneEnabled(false);
    return () => {
      active = false;
    };
  }, []);
  const [method, setMethod] = useState<"phone" | "email">("email");
  const [mode, setMode] = useState<"login" | "signup" | "reset">(initialMode),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [emailAddress, setEmailAddress] = useState(""),
    [verification, setVerification] = useState<Verification | null>(null),
    [unconfirmed, setUnconfirmed] = useState(false),
    [showPassword, setShowPassword] = useState(false),
    [cooldown, setCooldown] = useState(0),
    [requestCooldown, setRequestCooldown] = useState(0),
    [requestScope, setRequestScope] = useState("mail");
  const mailBlocked = requestCooldown > 0 && requestScope === "mail";
  const verifyBlocked = requestCooldown > 0 && requestScope === "verify";
  const submitBlocked =
    requestCooldown > 0 &&
    requestScope === (mode === "login" ? "login" : "mail");
  function handleAuthError(error: unknown, scope: "mail" | "login" | "verify") {
    setNotice(authErrorMessage(error));
    const value = error as { code?: string; message?: string };
    setLoginFailed(
      scope === "login" &&
        (value?.code === "invalid_credentials" ||
          /invalid login credentials/i.test(value?.message || "")),
    );
    const seconds = rateLimitSeconds(error);
    if (seconds) {
      setRequestScope(scope);
      setRequestCooldown(seconds);
      try {
        sessionStorage.setItem(
          "kiraye:auth-retry-at",
          JSON.stringify({ retryAt: Date.now() + seconds * 1000, scope }),
        );
      } catch {}
    }
  }
  function clearPending() {
    try {
      sessionStorage.removeItem(pendingKey);
    } catch {}
  }
  function pending(type: Verification, email: string, checked = false) {
    setVerification(type);
    setCooldown(60);
    setNotice("");
    try {
      sessionStorage.setItem(
        pendingKey,
        JSON.stringify({
          type,
          email,
          checked,
          retryAt: Date.now() + 60000,
          expiresAt: Date.now() + 1800000,
        }),
      );
    } catch {}
  }
  function goToAccount() {
    clearPending();
    window.location.href = safeLoginDestination(
      new URLSearchParams(window.location.search).get("next"),
    );
  }
  useEffect(() => {
    let recoveryPending = false;
    try {
      // Preserve text/autofill entered before the client scripts finished loading.
      setEmailAddress(
        emailInput.current?.value ||
          (initialMode === "reset" ? sessionStorage.getItem("kiraye:login-email") : "") ||
          "",
      );
      sessionStorage.removeItem("kiraye:login-email");
      if (initialMode === "login") sessionStorage.removeItem(pendingKey);
    } catch {}
    try {
      const stored = JSON.parse(
        sessionStorage.getItem("kiraye:auth-retry-at") || "null",
      );
      const retryAt = stored?.retryAt;
      if (
        ["mail", "login", "verify"].includes(stored?.scope) &&
        retryAt > Date.now() &&
        retryAt < Date.now() + 3600001
      ) {
        setRequestScope(stored.scope);
        setRequestCooldown(Math.ceil((retryAt - Date.now()) / 1000));
      }
      const saved = JSON.parse(sessionStorage.getItem(pendingKey) || "null");
      if (
        saved &&
        ((initialMode === "signup" && saved.type === "signup") ||
          (initialMode === "reset" && saved.type === "recovery" && saved.checked === true)) &&
        ["signup", "recovery"].includes(saved.type) &&
        typeof saved.email === "string" &&
        saved.email.length <= 254 &&
        Number.isFinite(saved.retryAt) &&
        saved.expiresAt > Date.now()
      ) {
        recoveryPending = saved.type === "recovery";
        setMethod("email");
        setEmailAddress(saved.email);
        setVerification(saved.type);
        setCooldown(
          Math.max(0, Math.ceil((saved.retryAt - Date.now()) / 1000)),
        );
      } else sessionStorage.removeItem(pendingKey);
    } catch {}
    setReady(true);
    let active = true;
    fetch('/api/auth/host',{cache:'no-store'})
      .then(response=>response.json())
      .then((data) => {
        if (
          active &&
          data.user &&
          !recoveryPending &&
          initialMode === "login"
        ) {
          clearPending();
          window.location.replace(
            safeLoginDestination(
              new URLSearchParams(window.location.search).get("next"),
            ),
          );
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [cooldown]);
  useEffect(() => {
    if (requestCooldown <= 0) return;
    const timer = setTimeout(
      () => setRequestCooldown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [requestCooldown]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    setRememberLogin(remember);
    e.preventDefault();
    if (!ready || busy || submitBlocked) return;
    const form = new FormData(e.currentTarget),
      email = String(form.get("email")).trim(),
      password = String(form.get("password") || "");
    setEmailAddress(email);
    setBusy(true);
    setNotice("");
    setUnconfirmed(false);
    try {
      if (mode === "reset") {
        await hostAuth('request_recovery',{email});
        pending("recovery", email, true);
      } else if (mode === "signup") {
        const fullName=String(form.get('full_name')||'').trim().replace(/\s+/g,' ');
        const contactPhone=normalizePhone(String(form.get('contact_phone')||''));
        if(fullName.length>100 || fullName.split(' ').length<2 || !fullName.split(' ').every(part=>/\p{L}/u.test(part))){setNotice('Ad və soyadını yaz.');return;}
        if(!contactPhone){setNotice('Düzgün Azərbaycan telefon nömrəsi yaz.');return;}
        await hostAuth('signup',{email,password,name:fullName,phone:contactPhone});
        pending("signup", email);
      } else {
        try{await hostAuth('login',{email,password,remember});}
        catch(error){if((error as {code?:string}).code==='EMAIL_NOT_CONFIRMED')setUnconfirmed(true);throw error;}
        goToAccount();
      }
    } catch (error) {
      handleAuthError(error, mode === "login" ? "login" : "mail");
    } finally {
      setBusy(false);
    }
  }
  async function verifyCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!verification || busy || verifyBlocked) return;
    const token = String(
      new FormData(e.currentTarget).get("code") || "",
    ).trim();
    if (!/^\d{6}$/.test(token)) {
      setNotice(
        verification === "recovery"
          ? "E-poçtuna gələn 6 rəqəmli kodu yaz."
          : "Məktubdakı 6 rəqəmli kodu yaz.",
      );
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      await hostAuth('verify',{email:emailAddress,code:token,purpose:verification,remember});
      clearPending();
      if (verification === "recovery") {sessionStorage.setItem('kiraye:recovery',JSON.stringify({email:emailAddress,code:token,expiresAt:Date.now()+600000}));window.location.href = "/reset-password";}
      else goToAccount();
    } catch (error) {
      handleAuthError(error, "verify");
    } finally {
      setBusy(false);
    }
  }
  async function resend() {
    if (!emailAddress || busy || cooldown > 0 || mailBlocked)
      return;
    setBusy(true);
    setNotice("");
    try {
      await hostAuth(verification==='recovery'?'request_recovery':'resend_signup',{email:emailAddress});
      pending(
        verification === "recovery" ? "recovery" : "signup",
        emailAddress,
        verification === "recovery",
      );
      setUnconfirmed(false);
    } catch (error) {
      handleAuthError(error, "mail");
      if ((error as { status?: number })?.status === 429) setCooldown(60);
    } finally {
      setBusy(false);
    }
  }
  function changeMode(next: "login" | "signup" | "reset") {
    clearPending();
    setVerification(null);
    setMode(next);
    setLoginFailed(false);
    setNotice("");
    setUnconfirmed(false);
  }
  function codeForm() {
    return (
      <form
        className="verificationForm"
        onSubmit={verifyCode}
        method="post"
        action="/login"
      >
        <label>
          {verification === "recovery" ? "6 rəqəmli kod" : "Təsdiq kodu"}
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            minLength={6}
            maxLength={6}
            required
            placeholder="000000"
          />
        </label>
        <button className="authSubmit" disabled={busy || verifyBlocked}>
          {busy ? "Yoxlanılır..." : "Kodu təsdiqlə"}
        </button>
      </form>
    );
  }
  return (
    <main className="loginPage">
      <div className="authHeader">
        <a className="logo" href="/" onClick={() => { clearPending(); try { sessionStorage.removeItem("kiraye:login-email"); } catch {} }}>
          kirayeal<span>.az</span>
        </a>
        <Link href="/help">Kömək</Link>
      </div>
      <div className="authShell">
        <section aria-labelledby="auth-title">
          <noscript>
            <p className="notice">
              Qeydiyyat və giriş üçün brauzerdə JavaScript-i aktiv et.
            </p>
          </noscript>
          <nav className="authModeLinks" aria-label="Hesab seçimi">
            <a href={`/login?next=${encodeURIComponent(next)}`} aria-current={mode === "login" ? "page" : undefined}>Daxil ol</a>
            <a href={`/login?mode=signup&next=${encodeURIComponent(next)}`} aria-current={mode === "signup" ? "page" : undefined}>Qeydiyyatdan keç</a>
          </nav>
          {!ready && (
            <p className="notice" role="status">
              Forma hazırlanır. Düymələr açılmırsa, {" "}
              <a href={`/login?mode=${initialMode}&next=${encodeURIComponent(next)}&reload=1`}>
                səhifəni yenidən aç
              </a>.
            </p>
          )}
          <h1 id="auth-title">
            {method === "phone"
              ? "Hesaba giriş"
              : verification
                ? verification === "recovery"
                  ? "Kodu daxil et"
                  : "E-poçtunu yoxla"
                : mode === "signup"
                  ? "Hesab yarat"
                  : mode === "reset"
                    ? "Şifrəni yenilə"
                    : "Hesaba giriş"}
          </h1>
          {!verification && mode !== "reset" && method === "email" && (
            <GoogleLogin />
          )}
          {phoneEnabled && !verification && mode === "login" && (
            <div className="authMethods" aria-label="Giriş üsulu">
              <button
                type="button"
                aria-pressed={method === "phone"}
                onClick={() => {
                  setMethod("phone");
                  setNotice("");
                }}
              >
                Telefonla
              </button>
              <button
                type="button"
                aria-pressed={method === "email"}
                onClick={() => setMethod("email")}
              >
                E-poçtla
              </button>
            </div>
          )}
          {method === "email" && (
            <>
              {!verification && (
                <p className="authLead">
                  {mode === "signup"
                    ? "Elan yerləşdirmək üçün qeydiyyatdan keç."
                    : mode === "reset"
                      ? "Hesabına bağlı e-poçt ünvanını yaz."
                      : "Saytda qeydiyyatdan keçdiyin məlumatlarla daxil ol."}
                </p>
              )}
              {!verification ? (
                <form
                  onSubmit={submit}
                  method="post"
                  action="/login"
                  onInvalid={(event) => {
                    const field = event.target as HTMLInputElement;
                    setNotice(
                      field.name === "full_name" ? "Ad və soyadını yaz." : field.name === "contact_phone" ? "Düzgün Azərbaycan telefon nömrəsi yaz." : field.name === "email"
                        ? "Düzgün e-poçt ünvanı yaz."
                        : mode === "signup"
                          ? "Ən azı 8 simvoldan ibarət şifrə yaz."
                          : "Şifrəni yaz.",
                    );
                  }}
                >
                  <fieldset className="authFields" disabled={busy}>
                    {mode === "signup" && <>
                      <label>Ad və soyad<input name="full_name" aria-label="Ad və soyad" autoComplete="name" required minLength={3} maxLength={100} placeholder="Adın və soyadın" /></label>
                      <label>Telefon nömrəsi<input name="contact_phone" aria-label="Telefon nömrəsi" type="tel" autoComplete="tel" required maxLength={25} placeholder="050 123 45 67" /></label>
                    </>}
                    <label>
                      E-poçt
                      <input
                        ref={emailInput}
                        name="email"
                        type="email"
                        autoCapitalize="none"
                        spellCheck={false}
                        autoComplete="email"
                        value={emailAddress}
                        onInput={(e) => setEmailAddress(e.currentTarget.value)}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        required
                        maxLength={254}
                        placeholder="E-poçt ünvanını yaz"
                      />
                    </label>
                    {emailAddress.includes("@") && !emailAddress.split("@")[1]?.includes(".") && (
                      <div className="emailSuggestions" aria-label="E-poçt ünvanını tamamla">
                        {["gmail.com", "mail.ru", "outlook.com", "icloud.com"].filter(domain => domain.startsWith(emailAddress.split("@")[1] || "")).map(domain => (
                          <button type="button" key={domain} onClick={() => {
                            setEmailAddress(`${emailAddress.split("@")[0]}@${domain}`);
                            emailInput.current?.focus();
                          }}>@{domain}</button>
                        ))}
                      </div>
                    )}
                    {mode !== "reset" && (
                      <div className="authPasswordGroup">
                        <label htmlFor="auth-password">Şifrə</label>
                        <div className="passwordField">
                          <input
                            ref={passwordInput}
                            id="auth-password"
                            aria-describedby={mode === "signup" ? "password-hint" : undefined}
                            aria-label="Şifrə"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete={
                              mode === "signup"
                                ? "new-password"
                                : "current-password"
                            }
                            minLength={mode === "signup" ? 8 : 1}
                            maxLength={128}
                            required
                            placeholder={
                              mode === "signup" ? "Ən azı 8 simvol" : "Şifrən"
                            }
                          />
                          <button
                            type="button"
                            className="passwordToggle"
                            aria-label={
                              showPassword ? "Şifrəni gizlət" : "Şifrəni göstər"
                            }
                            aria-pressed={showPassword}
                            onClick={() => setShowPassword(value => !value)}
                          >
                            {showPassword ? <EyeOff aria-hidden="true" size={20} strokeWidth={1.9} /> : <Eye aria-hidden="true" size={20} strokeWidth={1.9} />}
                          </button>
                        </div>
                        {mode === "signup" && (
                          <>
                            <button type="button" className="textButton" onClick={() => {
                              try {
                                if (passwordInput.current) {
                                  passwordInput.current.value = createStrongPassword();
                                  setShowPassword(true);
                                  passwordInput.current.focus();
                                }
                              } catch { setNotice("Avtomatik şifrə yaratmaq mümkün olmadı. Şifrəni özün yaza bilərsən."); }
                            }}>Güclü şifrə yarat</button>
                            <small className="passwordHint" id="password-hint">Ən azı 8 simvoldan ibarət şifrə yaz. Yaradılan şifrəni parol menecerində saxla.</small>
                          </>
                        )}
                      </div>
                    )}
                    {mode === "login" && (
                      <a
                        href={`/login?mode=reset&next=${encodeURIComponent(next)}`}
                        className="forgotPassword"
                        onClick={(event) => {
                          if (busy) {
                            event.preventDefault();
                            return;
                          }
                          try {
                            sessionStorage.setItem(
                              "kiraye:login-email",
                              emailAddress,
                            );
                            clearPending();
                          } catch {}
                        }}
                      >
                        Şifrəni unutmusunuz?
                      </a>
                    )}
                    {mode!=="reset"&&<label className="rememberLogin"><input type="checkbox" checked={remember} onChange={event=>setRemember(event.target.checked)}/>Məni yadda saxla</label>}
                    <button
                      className="authSubmit"
                      disabled={!ready || busy || submitBlocked}
                    >
                      {busy
                        ? "Gözləyin..."
                        : mode === "signup"
                          ? "Hesab yarat"
                          : mode === "reset"
                            ? "6 rəqəmli kod göndər"
                            : "Daxil ol"}
                    </button>
                  </fieldset>
                </form>
              ) : (
                <div className="confirmationPanel">
                  <p className="authLead">
                    {verification === "recovery"
                      ? "Bərpa kodu üçün göndəriş sorğusu qəbul edildi."
                      : "Təsdiq məktubu üçün sorğu qəbul edildi."}
                  </p>
                  <div className="confirmationEmail">{emailAddress}</div>
                  <p className="confirmationInstruction">
                    {verification === "recovery"
                      ? "E-poçtuna gələn 6 rəqəmli kodu daxil et."
                      : "Məktubdakı 6 rəqəmli təsdiq kodunu daxil et."}
                  </p>
                  <p className="mailHelp">
                    Məktub gəlməyib? Spam qovluğunu da yoxla.
                  </p>
                  {verification === "recovery" && codeForm()}
                  <div className="confirmationActions">
                    <button
                      className="authSubmit"
                      type="button"
                      disabled={busy || cooldown > 0 || mailBlocked}
                      onClick={resend}
                    >
                      {busy
                        ? "Sorğu göndərilir..."
                        : cooldown > 0
                          ? `Yenidən göndər (${cooldown} san)`
                          : "Yenidən göndər"}
                    </button>
                    <button
                      type="button"
                      className="link"
                      disabled={busy}
                      onClick={() =>
                        changeMode(
                          verification === "recovery" ? "reset" : "signup",
                        )
                      }
                    >
                      E-poçtu dəyiş
                    </button>
                  </div>
                  {verification !== "recovery" && codeForm()}
                </div>
              )}
              {unconfirmed && (
                <button
                  className="link"
                  disabled={busy || cooldown > 0 || mailBlocked}
                  onClick={resend}
                >
                  E-poçtu təsdiqlə / Yeni məktub göndər
                </button>
              )}
              {(submitBlocked ||
                (verification && (mailBlocked || verifyBlocked)) ||
                (unconfirmed && mailBlocked)) && (
                <p className="notice" role="status">
                  Təkrar cəhd üçün {requestCooldown} saniyə gözlə. Bu müddətdə
                  yeni sorğu göndərilmir.
                </p>
              )}
              {notice && (
                <div className="notice" role="status">
                  {notice}
                  {loginFailed && (
                    <button
                      type="button"
                      className="recoveryAction"
                      onClick={() => changeMode("reset")}
                    >
                      Şifrəni yenilə
                    </button>
                  )}
                </div>
              )}
              <div className="authFooter">
                <a
                  className="link"
                  href={
                    mode === "login" && !verification
                      ? `/login?mode=signup&next=${encodeURIComponent(next)}`
                      : `/login?next=${encodeURIComponent(next)}`
                  }
                  aria-disabled={busy}
                  onClick={(event) => {
                    if (busy) {
                      event.preventDefault();
                      return;
                    }
                    try {
                      sessionStorage.setItem(
                        "kiraye:login-email",
                        emailAddress,
                      );
                      clearPending();
                    } catch {}
                  }}
                >
                  {mode === "login" && !verification
                    ? "Hesabın yoxdur? Qeydiyyatdan keç"
                    : "Hesabın var? Daxil ol"}
                </a>
              </div>
            </>
          )}
        </section>
        <Link className="authBack" href="/">
          <ChevronLeft className="kzI kzIL" aria-hidden="true" size={16} strokeWidth={2.25} />Elanlara qayıt
        </Link>
      </div>
    </main>
  );
}
