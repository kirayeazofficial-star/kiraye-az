"use client";
import { ChevronLeft, Eye, EyeOff, House, KeyRound, Lock, LogIn, Mail, ShieldX, UserPlus } from "lucide-react";
import Header from "./Header";
import StatusCard from "./StatusCard";
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
import PhoneInput from "./PhoneInput";
import "../login/style.css";
type Verification = "signup" | "recovery" | "staff";
const pendingKey = "kiraye:pending-confirmation";
// 0 empty, 1 short, 2 weak, 3 good, 4 strong.
function passwordStrength(value: string) {
  if (!value) return 0;
  if (value.length < 8) return 1;
  const kinds = [/[a-zəğıöüşç]/, /[A-ZƏĞIÖÜŞÇİ]/, /\d/, /[^\p{L}\d]/u].filter(test => test.test(value)).length;
  return value.length >= 12 && kinds >= 3 ? 4 : kinds >= 2 ? 3 : 2;
}
async function hostAuth(action:string,payload:Record<string,unknown>={}){
  const response=await fetch('/api/auth/host',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...payload})});
  const data=await response.json();
  if(!response.ok){const error=new Error(data.error||'SERVICE_UNAVAILABLE') as Error&{code?:string;status?:number};error.code=data.error;error.status=response.status;(error as Error&{reason?:string}).reason=data.reason;throw error;}
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
  const firstInvalid = useRef(false);
  const [mode, setMode] = useState<"login" | "signup" | "reset">(initialMode),
    [notice, setNotice] = useState(""),
    [fieldErrors, setFieldErrors] = useState<Record<string, string>>({}),
    [passwordScore, setPasswordScore] = useState(0),
    [blocked, setBlocked] = useState<false | string>(false),
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
    const value = error as { code?: string; message?: string; reason?: string };
    if (value?.code === "ACCOUNT_BLOCKED") setBlocked(value.reason || "");
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
        if(fullName.length>100 || fullName.split(' ').length<2 || !fullName.split(' ').every(part=>/\p{L}/u.test(part))){setNotice('Ad və soyadınızı yazın.');return;}
        if(!contactPhone){setNotice('Düzgün Azərbaycan telefon nömrəsi yaz.');return;}
        await hostAuth('signup',{email,password,name:fullName,phone:contactPhone});
        pending("signup", email);
      } else {
        let result:{verification?:string}={};
        try{result=await hostAuth('login',{email,password,remember});}
        catch(error){if((error as {code?:string}).code==='EMAIL_NOT_CONFIRMED')setUnconfirmed(true);throw error;}
        // Leader / admin on a new device: confirm with the e-mailed code first.
        if(result.verification==='staff_login'){pending("staff",email);return;}
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
          ? "E-poçtunuza gələn 6 rəqəmli kodu yazın."
          : "Məktubdakı 6 rəqəmli kodu yazın.",
      );
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      if(verification==='staff')await hostAuth('verify_staff',{email:emailAddress,code:token,remember});
      else await hostAuth('verify',{email:emailAddress,code:token,purpose:verification,remember});
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
      await hostAuth(verification==='recovery'?'request_recovery':verification==='staff'?'resend_staff':'resend_signup',{email:emailAddress});
      pending(
        verification === "recovery" ? "recovery" : verification === "staff" ? "staff" : "signup",
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
          {busy ? "Yoxlanılır…" : "Kodu təsdiqlə"}
        </button>
      </form>
    );
  }
  // A blocked account gets a clear explanation instead of a short error line under the form.
  if (blocked !== false) return <main className="loginPage">
    <div className="authHeader"><a className="logo" href="/">kirayeal<span>.az</span></a><Link href="/help">Kömək</Link></div>
    <div className="kzScPage">
      <StatusCard tone="danger" icon={ShieldX} badge="Hesab bloklanıb" title="Hesabınız bloklanıb"
        lead="Hesabınız sayt qaydalarının pozulmasına görə məhdudlaşdırılıb. Bu səbəbdən hesaba daxil olmaq, elan yerləşdirmək və mesaj göndərmək mümkün deyil."
        list={{ title: "Nə etmək olar", items: [<>Sayt <Link key="rules" href="/rules">qaydaları</Link> ilə tanış olun.</>, "Bloklanmanın səhvən baş verdiyini düşünürsünüzsə, hesabınızın e-poçt ünvanından bizə yazın.", "Müraciətlər iş günləri ərzində cavablandırılır."] }}
        note={blocked ? <><strong>Bloklanma səbəbi:</strong> {blocked}</> : undefined}
        actions={[{ href: "mailto:kirayeal.az@gmail.com?subject=Hesab%20bloku%20haqq%C4%B1nda%20m%C3%BCraci%C9%99t", label: "Müraciət göndər", icon: Mail, primary: true, external: true }, { href: "/", label: "Ana səhifə", icon: House }]} />
    </div>
  </main>;
  return (
    <main className="loginPage">
      <Header />
      <div className="authShell">
        <section aria-labelledby="auth-title">
          <noscript>
            <p className="notice">
              Qeydiyyat və giriş üçün brauzerdə JavaScript-i aktiv edin.
            </p>
          </noscript>
          {!ready && (
            // Shown only if the form is still not ready after a few seconds (see .authSlowNote), so a normal load never flashes it.
            <div className="authSlowNote"><p className="notice" role="status">
              Forma yüklənir. Düymələr işləmirsə,{" "}
              <a href={`/login?mode=${initialMode}&next=${encodeURIComponent(next)}&reload=1`}>
                səhifəni yeniləyin
              </a>.
            </p></div>
          )}
          <span className={`authBadge${verification ? " mail" : ""}`} aria-hidden="true">{verification ? <Mail size={26} strokeWidth={2}/> : mode === "signup" ? <UserPlus size={26} strokeWidth={2}/> : mode === "reset" ? <KeyRound size={26} strokeWidth={2}/> : <LogIn size={26} strokeWidth={2}/>}</span>
          <h1 id="auth-title">
            {method === "phone"
              ? "Hesabınıza daxil olun"
              : verification
                ? verification === "staff"
                  ? "Yeni cihazı təsdiqləyin"
                  : verification === "recovery"
                  ? "Kodu daxil edin"
                  : "E-poçtunuzu yoxlayın"
                : mode === "signup"
                  ? "Hesab yaradın"
                  : mode === "reset"
                    ? "Şifrənizi yeniləyin"
                    : "Xoş gəlmisiniz"}
          </h1>
          {!verification && method === "email" && (
                <p className="authLead">
                  {mode === "signup"
                    ? "Pulsuz qeydiyyat, bir dəqiqəyə hazır"
                    : mode === "reset"
                      ? "Hesabınıza bağlı e-poçt ünvanını yazın. Həmin ünvana 6 rəqəmli bərpa kodu göndəriləcək."
                      : "Elanlarınız və mesajlarınız sizi gözləyir"}
                </p>
              )}
          {mode !== "reset" && !verification && <nav className="authModeLinks" aria-label="Hesab seçimi">
            <a href={`/login?next=${encodeURIComponent(next)}`} aria-current={mode === "login" ? "page" : undefined}>Daxil ol</a>
            <a href={`/login?mode=signup&next=${encodeURIComponent(next)}`} aria-current={mode === "signup" ? "page" : undefined}>Qeydiyyat</a>
          </nav>}
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
              {!verification ? (<>
                <form
                  onSubmit={submit}
                  method="post"
                  action="/login"
                  onInvalid={(event) => {
                    const field = event.target as HTMLInputElement;
                    event.preventDefault();
                    // Login with the password still empty: no warning, the cursor simply moves to the password field.
                    if (mode === "login" && field.type === "password" && !field.value) { setNotice(""); if (!firstInvalid.current) { firstInvalid.current = true; field.focus(); } return; }
                    const key = field.name === "full_name" ? "full_name" : field.type === "tel" ? "contact_phone" : field.name === "email" ? "email" : "password";
                    const text = key === "full_name" ? "Ad və soyadınızı yazın." : key === "contact_phone" ? "+994-dən sonra 0 olmadan 9 rəqəm yazın (məsələn: 50 123 45 67)." : key === "email"
                        ? "Düzgün e-poçt ünvanı yazın."
                        : mode === "signup"
                          ? "Ən azı 8 simvoldan ibarət şifrə yazın."
                          : "Şifrənizi yazın.";
                    setNotice("");
                    setFieldErrors(current => ({ ...current, [key]: text }));
                    if (!firstInvalid.current) { firstInvalid.current = true; field.focus(); }
                    window.setTimeout(() => { firstInvalid.current = false; }, 0);
                  }}
                  onInput={(event) => {
                    const field = event.target as HTMLInputElement;
                    const key = field.name === "full_name" ? "full_name" : field.type === "tel" ? "contact_phone" : field.name === "email" ? "email" : field.name === "password" ? "password" : "";
                    if (key && fieldErrors[key]) setFieldErrors(current => { const next = { ...current }; delete next[key]; return next; });
                  }}
                >
                  <fieldset className="authFields" disabled={busy}>
                    {mode === "signup" && <>
                      <label className={`authFloat${fieldErrors.full_name ? " authInvalid" : ""}`}><span className="authTag">Ad və soyad</span><input name="full_name" aria-label="Ad və soyad" autoComplete="name" required minLength={3} maxLength={100} placeholder="Məsələn: Elvin Məmmədov" aria-invalid={!!fieldErrors.full_name} /></label>
                      {fieldErrors.full_name && <small className="authFieldError" role="alert">{fieldErrors.full_name}</small>}
                      <label className={`authFloat${fieldErrors.contact_phone ? " authInvalid" : ""}`}><span className="authTag">Telefon</span><PhoneInput name="contact_phone" label="Telefon nömrəsi" required /></label>
                      {fieldErrors.contact_phone && <small className="authFieldError" role="alert">{fieldErrors.contact_phone}</small>}
                    </>}
                    <label className={`authFloat${fieldErrors.email ? " authInvalid" : ""}`}>
                      <span className="authTag">E-poçt</span>
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
                        placeholder="ad@gmail.com"
                        aria-invalid={!!fieldErrors.email}
                      />
                    </label>
                    {fieldErrors.email && <small className="authFieldError" role="alert">{fieldErrors.email}</small>}
                    {emailAddress.includes("@") && !emailAddress.split("@")[1]?.includes(".") && (
                      <div className="emailSuggestions" aria-label="E-poçt ünvanını tamamlayın">
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
                        <div className={`passwordField authFloat${fieldErrors.password ? " authInvalid" : ""}`}>
                        <label className="authTag" htmlFor="auth-password">Şifrə</label>
                          <input
                            ref={passwordInput}
                            id="auth-password"
                            aria-describedby={mode === "signup" ? "password-hint" : undefined}
                            aria-label="Şifrə"
                            aria-invalid={!!fieldErrors.password}
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
                              mode === "signup" ? "Ən azı 8 simvol" : "Şifrəniz"
                            }
                            onInput={(event) => setPasswordScore(passwordStrength(event.currentTarget.value))}
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
                        {fieldErrors.password && <small className="authFieldError" role="alert">{fieldErrors.password}</small>}
                        {mode === "signup" && (
                          <>
                            <div className="authMeter" aria-hidden="true">{[1, 2, 3, 4].map(step => <i key={step} className={passwordScore >= step ? `on s${passwordScore}` : undefined} />)}</div>
                            <div className="authPasswordRow">
                              <small className="passwordHint" id="password-hint">{passwordScore >= 4 ? "Güclü şifrə" : passwordScore === 3 ? "Yaxşı şifrə" : passwordScore >= 1 ? "Zəif şifrə" : "Ən azı 8 simvol"}</small>
                              <button type="button" className="textButton" onClick={() => {
                              try {
                                if (passwordInput.current) {
                                  passwordInput.current.value = createStrongPassword();
                                  setPasswordScore(4);
                                  setShowPassword(true);
                                  passwordInput.current.focus();
                                }
                              } catch { setNotice("Avtomatik şifrə yaratmaq mümkün olmadı. Şifrəni özünüz yaza bilərsiniz."); }
                            }}>Güclü şifrə yarat</button>
                            </div>
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
                    {mode==="login"&&<label className="rememberLogin"><input type="checkbox" checked={remember} onChange={event=>setRemember(event.target.checked)}/>Məni yadda saxla</label>}
                    {mode === "signup" && <p className="authCodeNote"><Mail aria-hidden="true" size={18} strokeWidth={2}/><span>{emailAddress.includes("@") ? <>Təsdiq kodu <b>{emailAddress}</b> ünvanına göndəriləcək</> : "E-poçtunuza 6 rəqəmli təsdiq kodu göndəriləcək"}</span></p>}
                    <button
                      className="authSubmit"
                      disabled={!ready || busy || submitBlocked}
                    >
                      {busy
                        ? "Gözləyin…"
                        : mode === "signup"
                          ? "Hesab yarat"
                          : mode === "reset"
                            ? "6 rəqəmli kod göndər"
                            : "Daxil ol"}
                    </button>
                    {mode === "login" && <p className="kzAuthTerms">Davam etməklə <Link href="/terms">İstifadəçi razılaşması</Link> və <Link href="/privacy">Məxfilik siyasəti</Link> ilə razılaşırsınız</p>}
                    {mode === "signup" && <p className="kzAuthTerms">Davam etməklə <Link href="/terms">İstifadəçi razılaşması</Link> və <Link href="/rules">Elan qaydalarını</Link> qəbul edirsiniz</p>}
                  </fieldset>
                </form>
                {mode !== "reset" && <GoogleLogin />}
              </>) : (
                <div className="confirmationPanel">
                  <p className="authLead">
                    {verification === "staff"
                      ? "Təhlükəsizlik məqsədilə idarəetmə panelinə yeni cihazdan giriş e-poçt kodu ilə təsdiqlənir. Təsdiqdən sonra bu cihaz 3 gün ərzində yadda saxlanılacaq. Kod bu ünvana göndərildi:"
                      : verification === "recovery"
                      ? "Şifrə bərpası üçün 6 rəqəmli kod bu ünvana göndərildi:"
                      : "Qeydiyyatı tamamlamaq üçün 6 rəqəmli təsdiq kodu bu ünvana göndərildi:"}
                  </p>
                  <div className="confirmationEmail">{emailAddress}</div>
                  <p className="confirmationInstruction">
                    {verification === "recovery" || verification === "staff"
                      ? "Məktubdakı kodu aşağıdakı xanaya yazın. Kod 10 dəqiqə ərzində etibarlıdır."
                      : "Məktubdakı kodu aşağıdakı xanaya yazın. Kod 10 dəqiqə ərzində etibarlıdır."}
                  </p>
                  {codeForm()}
                  {!busy && <div className="confirmationActions kzCodeHelp">
                    <p className="mailHelp">Kod gəlmədi? «Spam» qovluğunu da yoxlayın.</p>
                    <button
                      className="link"
                      type="button"
                      disabled={cooldown > 0 || mailBlocked}
                      onClick={resend}
                    >
                      {cooldown > 0 ? `Yenidən göndər (${cooldown} san)` : "Kodu yenidən göndər"}
                    </button>
                    <button
                      type="button"
                      className="link"
                      onClick={() =>
                        changeMode(
                          verification === "recovery" ? "reset" : verification === "staff" ? "login" : "signup",
                        )
                      }
                    >
                      {verification === "staff" ? "Geri qayıt" : "E-poçtu dəyiş"}
                    </button>
                  </div>}
                </div>
              )}
              {unconfirmed && (
                <button
                  className="link"
                  disabled={busy || cooldown > 0 || mailBlocked}
                  onClick={resend}
                >
                  Təsdiq kodunu yenidən göndər
                </button>
              )}
              {(submitBlocked ||
                (verification && (mailBlocked || verifyBlocked)) ||
                (unconfirmed && mailBlocked)) && (
                <p className="notice" role="status">
                  Təkrar cəhd üçün {requestCooldown} saniyə gözləyin. Bu müddətdə
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
              {!verification && mode === "reset" && <div className="authFooter">
                <a
                  className="link"
                  href={`/login?next=${encodeURIComponent(next)}`}
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
                  Daxil olmağa qayıt
                </a>
              </div>}
            </>
          )}
        </section>
        {!verification && <p className="authSafe"><Lock aria-hidden="true" size={14} strokeWidth={2}/>Məlumatlarınız qorunur və heç kimə verilmir</p>}
        {!verification && <Link className="authBack" href="/">
          <ChevronLeft className="kzI kzIL" aria-hidden="true" size={16} strokeWidth={2.25} />Elanlara qayıt
        </Link>}
      </div>
    </main>
  );
}
