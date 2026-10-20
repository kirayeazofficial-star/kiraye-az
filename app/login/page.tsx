"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  authErrorMessage,
  safeLoginDestination,
} from "../../lib/auth-messages";
import { authCallbackUrl } from "../../lib/auth-flow";
import { getAuthCapabilities, supabase } from "../../lib/supabase";
import { rateLimitSeconds } from "../../lib/auth-throttle";
import GoogleLogin from "../components/GoogleLogin";
import PhoneLogin from "../components/PhoneLogin";
import "./style.css";
type Verification = "signup" | "recovery";
const pendingKey = "kiraye:pending-confirmation";
export default function Login() {
  const [phoneEnabled, setPhoneEnabled] = useState(false);
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
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login"),
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
    setUseCode(false);
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
        ["signup", "recovery"].includes(saved.type) &&
        typeof saved.email === "string" &&
        saved.email.length <= 254 &&
        Number.isFinite(saved.retryAt) &&
        saved.expiresAt > Date.now()
      ) {
        setMethod("email");
        setEmailAddress(saved.email);
        setVerification(saved.type);
        setCooldown(
          Math.max(0, Math.ceil((saved.retryAt - Date.now()) / 1000)),
        );
      } else sessionStorage.removeItem(pendingKey);
    } catch {}
    if (!supabase) return;
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active && data.session) {
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
    if (busy || submitBlocked) return;
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
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: authCallbackUrl(window.location.origin, true),
        });
        if (error) throw error;
        pending("recovery", email);
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: authCallbackUrl(window.location.origin) },
        });
        if (error) throw error;
        if (data.session) {
          goToAccount();
          return;
        }
        if (data.user?.identities && data.user.identities.length === 0) {
          setMode("login");
          setNotice(
            "Bu ünvanla artıq hesabın varsa, daxil ol və ya şifrəni yenilə. Qeydiyyatı təkrar etmək lazım deyil.",
          );
          return;
        }
        pending("signup", email);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
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
    if (!/^\d{6,10}$/.test(token)) {
      setNotice("Məktubdakı 6–10 rəqəmli kodu yaz.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: emailAddress,
        token,
        type: verification,
      });
      if (error) throw error;
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
  return (
    <main className="loginPage">
      <div className="authHeader">
        <Link className="logo" href="/">
          kiraye<span>.az</span>
        </Link>
        <Link href="/help">Kömək</Link>
      </div>
      <div className="authShell">
        <section aria-labelledby="auth-title">
          <h1 id="auth-title">
            {method === "phone"
              ? "Hesaba giriş"
              : verification
                ? "E-poçtunu yoxla"
                : mode === "signup"
                  ? "Hesab yarat"
                  : mode === "reset"
                    ? "Şifrəni yenilə"
                    : "Hesaba giriş"}
          </h1>
          {!verification && method === "email" && <GoogleLogin />}
          {phoneEnabled && (
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
                <form onSubmit={submit}>
                  <fieldset className="authFields" disabled={busy}>
                    <label>
                      E-poçt
                      <input
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        required
                        maxLength={254}
                        placeholder="ad@example.com"
                      />
                    </label>
                    {mode !== "reset" && (
                      <label>
                        Şifrə
                        <div className="passwordField">
                          <input
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
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? "Gizlət" : "Göstər"}
                          </button>
                        </div>
                      </label>
                    )}
                    {mode === "login" && (
                      <button
                        type="button"
                        className="forgotPassword"
                        onClick={() => changeMode("reset")}
                      >
                        Şifrəni unutmusunuz?
                      </button>
                    )}
                    <button
                      className="authSubmit"
                      disabled={busy || submitBlocked}
                    >
                      {busy
                        ? "Gözləyin..."
                        : mode === "signup"
                          ? "Hesab yarat"
                          : mode === "reset"
                            ? "Yeniləmə linki göndər"
                            : "Daxil ol →"}
                    </button>
                  </fieldset>
                </form>
              ) : (
                <div className="confirmationPanel">
                  <p className="authLead">
                    {verification === "recovery"
                      ? "Bu ünvanla hesab varsa, şifrəni yeniləmə məktubu üçün sorğu qəbul edildi."
                      : "Təsdiq məktubu üçün sorğu qəbul edildi."}
                  </p>
                  <div className="confirmationEmail">{emailAddress}</div>
                  <p className="confirmationInstruction">
                    Məktubdakı{" "}
                    <strong>
                      {verification === "recovery"
                        ? "şifrəni yenilə"
                        : "hesabı təsdiqlə"}
                    </strong>{" "}
                    linkini aç. Standart təsdiq məktubunda rəqəmli kod olmaya
                    bilər.
                  </p>
                  <p className="mailHelp">
                    Məktub görünmür? Spam və Promosyonlar qovluqlarını yoxla.
                    Çatdırılma bir neçə dəqiqə çəkə bilər.
                  </p>
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
                  {useCode && (
                    <form className="verificationForm" onSubmit={verifyCode}>
                      <label>
                        Təsdiq kodu
                        <input
                          name="code"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          pattern="[0-9]{6,10}"
                          minLength={6}
                          maxLength={10}
                          required
                          placeholder="000000"
                        />
                      </label>
                      <button
                        className="authSubmit"
                        disabled={busy || verifyBlocked}
                      >
                        {busy ? "Yoxlanılır..." : "Kodu təsdiqlə"}
                      </button>
                    </form>
                  )}
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
                <button
                  className="link"
                  disabled={busy}
                  onClick={() =>
                    changeMode(
                      mode === "login" && !verification ? "signup" : "login",
                    )
                  }
                >
                  {mode === "login" && !verification
                    ? "Hesabın yoxdur? Qeydiyyatdan keç"
                    : "Hesabın var? Daxil ol"}
                </button>
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
