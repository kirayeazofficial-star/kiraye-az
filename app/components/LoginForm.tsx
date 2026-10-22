"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  authErrorMessage,
  safeLoginDestination,
} from "../../lib/auth-messages";
import { finishWithin } from "../../lib/auth-return";
import { authCallbackUrl } from "../../lib/auth-flow";
import { getAuthCapabilities, supabase } from "../../lib/supabase";
import { rateLimitSeconds } from "../../lib/auth-throttle";
import GoogleLogin from "../components/GoogleLogin";
import PhoneLogin from "../components/PhoneLogin";
import "../login/style.css";
type Verification = "signup" | "recovery";
const pendingKey = "kiraye:pending-confirmation";
export default function Login({
  initialMode = "login",
  next = "/profile",
}: {
  initialMode?: "login" | "signup" | "reset";
  next?: string;
}) {
  const [phoneEnabled, setPhoneEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const emailInput = useRef<HTMLInputElement>(null);
  const [loginFailed, setLoginFailed] = useState(false);
  useEffect(() => {
    let active = true;
    getAuthCapabilities()
      .then((value) => {
        if (active) setPhoneEnabled(value.phone);
      })
      .catch(() => {});
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
    [useCode, setUseCode] = useState(false),
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
  function pending(type: Verification, email: string) {
    setVerification(type);
    setUseCode(type === "recovery");
    setCooldown(60);
    setNotice("");
    try {
      sessionStorage.setItem(
        pendingKey,
        JSON.stringify({
          type,
          email,
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
          sessionStorage.getItem("kiraye:login-email") ||
          "",
      );
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
        (initialMode === "login" ||
          (initialMode === "signup" && saved.type === "signup") ||
          (initialMode === "reset" && saved.type === "recovery")) &&
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
        setUseCode(saved.type === "recovery");
        setCooldown(
          Math.max(0, Math.ceil((saved.retryAt - Date.now()) / 1000)),
        );
      } else sessionStorage.removeItem(pendingKey);
    } catch {}
    setReady(true);
    if (!supabase) return;
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (
          active &&
          data.session &&
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
    e.preventDefault();
    if (!ready || busy || submitBlocked) return;
    if (!supabase) {
      setNotice(
        "Giriş xidməti hələ aktivləşdirilməyib. Bir az sonra yenidən yoxlayın.",
      );
      return;
    }
    const form = new FormData(e.currentTarget),
      email = String(form.get("email")).trim(),
      password = String(form.get("password") || "");
    setEmailAddress(email);
    setBusy(true);
    setNotice("");
    setUnconfirmed(false);
    try {
      if (mode === "reset") {
        const { error } = await finishWithin(supabase.auth.resetPasswordForEmail(email, {
          redirectTo: authCallbackUrl(window.location.origin, true),
        }));
        if (error) throw error;
        pending("recovery", email);
      } else if (mode === "signup") {
        const { data, error } = await finishWithin(supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: authCallbackUrl(window.location.origin) },
        }));
        if (error) throw error;
        if (data.session) {
          goToAccount();
          return;
        }
        if (data.user?.identities && data.user.identities.length === 0) {
          setMode("login");
          setNotice(
            "Bu e-poçtla artıq qeydiyyatdan keçmisən. Daxil ol və ya şifrəni yenilə.",
          );
          return;
        }
        pending("signup", email);
      } else {
        const { error } = await finishWithin(supabase.auth.signInWithPassword({
          email,
          password,
        }));
        if (error) {
          if (
            error.code === "email_not_confirmed" ||
            /email not confirmed/i.test(error.message)
          )
            setUnconfirmed(true);
          throw error;
        }
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
    if (!supabase || !verification || busy || verifyBlocked) return;
    const token = String(
      new FormData(e.currentTarget).get("code") || "",
    ).trim();
    if (!(verification === "recovery" ? /^\d{6}$/ : /^\d{6,10}$/).test(token)) {
      setNotice(
        verification === "recovery"
          ? "E-poçtuna gələn 6 rəqəmli kodu yaz."
          : "Məktubdakı 6–10 rəqəmli kodu yaz.",
      );
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: emailAddress,
        token,
        type: verification,
      });
      if (error) throw error;
      if (!data.session) throw new Error("Kod təsdiqlənmədi. Yenidən cəhd et.");
      clearPending();
      if (verification === "recovery") window.location.href = "/reset-password";
      else goToAccount();
    } catch (error) {
      handleAuthError(error, "verify");
    } finally {
      setBusy(false);
    }
  }
  async function resend() {
    if (!supabase || !emailAddress || busy || cooldown > 0 || mailBlocked)
      return;
    setBusy(true);
    setNotice("");
    try {
      const { error } =
        verification === "recovery"
          ? await supabase.auth.resetPasswordForEmail(emailAddress, {
              redirectTo: authCallbackUrl(window.location.origin, true),
            })
          : await supabase.auth.resend({
              type: "signup",
              email: emailAddress,
              options: {
                emailRedirectTo: authCallbackUrl(window.location.origin),
              },
            });
      if (error) throw error;
      pending(
        verification === "recovery" ? "recovery" : "signup",
        emailAddress,
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
    setUseCode(false);
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
            pattern={verification === "recovery" ? "[0-9]{6}" : "[0-9]{6,10}"}
            minLength={6}
            maxLength={verification === "recovery" ? 6 : 10}
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
        <Link className="logo" href="/">
          kirayeal<span>.az</span>
        </Link>
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
          {method === "phone" ? (
            <PhoneLogin
              onSuccess={goToAccount}
              onEmail={() => setMethod("email")}
            />
          ) : (
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
                      field.name === "email"
                        ? "Düzgün e-poçt ünvanı yaz."
                        : mode === "signup"
                          ? "Ən azı 8 simvoldan ibarət şifrə yaz."
                          : "Şifrəni yaz.",
                    );
                  }}
                >
                  <fieldset className="authFields" disabled={busy}>
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
                            {showPassword ? "Gizlət" : "Göstər"}
                          </button>
                        </div>
                        {mode === "signup" && (
                          <small className="passwordHint" id="password-hint">
                            Ən azı 8 simvoldan ibarət şifrə yaz.
                          </small>
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
                            : "Daxil ol →"}
                    </button>
                  </fieldset>
                </form>
              ) : (
                <div className="confirmationPanel">
                  <p className="authLead">
                    {verification === "recovery"
                      ? "Sorğu qəbul edildi. Bərpa məktubu yalnız qeydiyyatdan keçmiş hesabın e-poçtuna göndərilir."
                      : "Təsdiq məktubu üçün sorğu qəbul edildi."}
                  </p>
                  <div className="confirmationEmail">{emailAddress}</div>
                  <p className="confirmationInstruction">
                    {verification === "recovery"
                      ? "Bu e-poçtla hesabın varsa, gələn 6 rəqəmli kodu yaz. Bu sorğu yeni hesab yaratmır."
                      : "Məktubdakı hesabı təsdiqlə linkini aç."}
                  </p>
                  <p className="mailHelp">
                    Məktub gəlməyib? Spam qovluğunu da yoxla.
                    {verification === "recovery" &&
                      " Məktubda kod əvəzinə bərpa linki varsa, həmin linki aç — yeni şifrə səhifəsinə keçəcəksən."}
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
                  {verification !== "recovery" && (
                    <button
                      className="codeDisclosure"
                      type="button"
                      disabled={busy}
                      aria-expanded={useCode}
                      onClick={() => {
                        setUseCode(!useCode);
                        setNotice("");
                      }}
                    >
                      {useCode
                        ? "Kod girişini bağla"
                        : "Məktubda rəqəmli kod var"}
                    </button>
                  )}
                  {verification !== "recovery" && useCode && codeForm()}
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
                      Şifrəni yenilə →
                    </button>
                  )}
                  {!supabase && (
                    <a
                      className="authBack"
                      href="https://kiraye-az.vercel.app/login"
                    >
                      Əsas saytda daxil ol →
                    </a>
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
          ← Elanlara qayıt
        </Link>
      </div>
    </main>
  );
}
