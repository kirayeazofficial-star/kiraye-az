"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  authErrorMessage,
  safeLoginDestination,
} from "../../lib/auth-messages";
import { authCallbackUrl } from "../../lib/auth-flow";
import { supabase } from "../../lib/supabase";
import "./style.css";
export default function Login() {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login"),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [emailAddress, setEmailAddress] = useState(""),
    [verification, setVerification] = useState<"signup" | "recovery" | null>(
      null,
    ),
    [unconfirmed, setUnconfirmed] = useState(false),
    [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active && data.session)
          window.location.replace(
            safeLoginDestination(
              new URLSearchParams(window.location.search).get("next"),
            ),
          );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    if (!supabase) {
      setNotice(
        "Giriş xidməti hələ aktivləşdirilməyib. Bir az sonra yenidən yoxlayın.",
      );
      return;
    }
    const form = new FormData(e.currentTarget),
      email = String(form.get("email")).trim(),
      password = String(form.get("password") ?? "");
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
        setVerification("recovery");
        setNotice(
          "Bu e-poçtla hesab varsa, şifrəni yeniləmə linki göndəriləcək.",
        );
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: authCallbackUrl(window.location.origin) },
        });
        if (error) throw error;
        if (data.session) window.location.href = "/profile";
        else {
          setVerification("signup");
          setNotice(
            "E-poçtuna təsdiq göndərildi. Linki aç və ya məktubda kod varsa, aşağıda yaz.",
          );
        }
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
        const next = new URLSearchParams(window.location.search).get("next");
        window.location.href = safeLoginDestination(next);
      }
    } catch (error) {
      setNotice(authErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function verifyCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !verification || busy) return;
    const token = String(
      new FormData(e.currentTarget).get("code") ?? "",
    ).trim();
    if (!/^\d{6,10}$/.test(token)) {
      setNotice("Məktubdakı 6–10 rəqəmli kodu yazın.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: emailAddress,
        token,
        type: verification,
      });
      if (error) throw error;
      window.location.href =
        verification === "recovery" ? "/reset-password" : "/profile";
    } catch {
      setNotice("Kod səhvdir və ya vaxtı bitib. Yeni kod istəyin.");
    } finally {
      setBusy(false);
    }
  }
  async function resend() {
    if (!supabase || !emailAddress || busy) return;
    setBusy(true);
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
      setVerification(verification === "recovery" ? "recovery" : "signup");
      setNotice(
        "Yeni təsdiq məktubu göndərildi. Ən son məktubdan istifadə edin.",
      );
      setUnconfirmed(false);
    } catch {
      setNotice("Məktub göndərilmədi. Bir az gözləyib yenidən yoxlayın.");
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
        <div className="authEmblem">⌂</div>
        <p className="eyebrow">KİRAYƏ ÜÇÜN BİR ÜNVAN</p>
        <h1>
          {mode === "signup"
            ? "Aramıza xoş gəldin"
            : mode === "reset"
              ? "Şifrəni yenilə"
              : "Xoş gəldin!"}
        </h1>
        <p className="authLead">
          {mode === "signup"
            ? "Hesab yarat, elan yerləşdir və kirayə verməyə başla."
            : mode === "reset"
              ? "Hesabının e-poçt ünvanını yaz."
              : "Elanlarını idarə etmək üçün hesabına daxil ol."}
        </p>
        {!verification && (
          <form onSubmit={submit}>
            <fieldset className="authFields" disabled={busy}>
              <label>
                E-poçt
                <input
                  autoComplete="email"
                  name="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  type="email"
                  required
                  placeholder="ad@example.com"
                  maxLength={254}
                />
              </label>
              {mode !== "reset" && (
                <label>
                  Şifrə
                  <input
                    autoComplete={
                      mode === "signup" ? "new-password" : "current-password"
                    }
                    aria-label="Şifrə"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    minLength={mode === "signup" ? 8 : 1}
                    required
                    placeholder={
                      mode === "signup"
                        ? "Ən azı 8 simvol"
                        : "Hesabının şifrəsi"
                    }
                    maxLength={128}
                  />
                  <button
                    className="passwordToggle"
                    type="button"
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Şifrəni gizlət" : "Şifrəni göstər"}
                  </button>
                </label>
              )}
              <button disabled={busy}>
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
        )}
        {verification && (
          <form onSubmit={verifyCode} className="verificationForm">
            <p className="authLead">
              {emailAddress} ünvanına gələn ən son məktubu yoxla. Məktubda
              rəqəmli kod varsa, onu burada təsdiqləyə bilərsən.
            </p>
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
                placeholder="E-poçtdakı kod"
              />
            </label>
            <button disabled={busy}>
              {busy ? "Yoxlanılır..." : "Kodu təsdiqlə"}
            </button>
            <button
              type="button"
              className="resendButton"
              disabled={busy}
              onClick={resend}
            >
              Yeni məktub göndər
            </button>
          </form>
        )}
        {unconfirmed && (
          <button className="link" disabled={busy} onClick={resend}>
            E-poçtu təsdiqlə / Yeni məktub göndər
          </button>
        )}
        {notice && (
          <div className="notice" role="status">
            {notice}
            {!supabase && (
              <a className="authBack" href="https://kiraye-az.vercel.app/login">
                Əsas saytda daxil ol →
              </a>
            )}
          </div>
        )}
        {mode === "login" && (
          <button
            className="link"
            disabled={busy}
            onClick={() => {
              setMode("reset");
              setVerification(null);
              setNotice("");
            }}
          >
            Şifrəni unutmusunuz?
          </button>
        )}
        <button
          className="link"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setVerification(null);
            setNotice("");
          }}
        >
          {mode === "login"
            ? "Hesabın yoxdur? Qeydiyyatdan keç"
            : "Hesabın var? Daxil ol"}
        </button>
        <Link className="authBack" href="/">
          ← Elanlara qayıt
        </Link>
      </section>
    </main>
  );
}
