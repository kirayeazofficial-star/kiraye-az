"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { getAuthCapabilities, supabase } from "../../lib/supabase";
import { normalizeMobile } from "../../lib/phone-auth";
import { authErrorMessage } from "../../lib/auth-messages";

export default function PhoneLogin({
  onSuccess,
  onEmail,
}: {
  onSuccess: () => void;
  onEmail: () => void;
}) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [settingsError, setSettingsError] = useState(false);
  const [phone, setPhone] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [retryAt, setRetryAt] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  async function loadSettings() {
    setSettingsError(false);
    setEnabled(null);
    try {
      setEnabled((await getAuthCapabilities()).phone);
    } catch {
      setSettingsError(true);
    }
  }
  useEffect(() => {
    void loadSettings();
  }, []);
  useEffect(() => {
    const update = () =>
      setCooldown(Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)));
    update();
    if (!retryAt) return;
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [retryAt]);
  async function send(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    if (!supabase || enabled !== true || busy || retryAt > Date.now()) return;
    const normalized = sentTo || normalizeMobile(phone);
    if (!normalized) {
      setNotice("Düzgün mobil nömrə yaz: məsələn, 050 123 45 67.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: normalized,
        options: { channel: "sms", shouldCreateUser: true },
      });
      if (error) throw error;
      setSentTo(normalized);
      setToken("");
      setRetryAt(Date.now() + 60000);
    } catch (error) {
      setNotice(authErrorMessage(error));
      if ((error as { status?: number })?.status === 429)
        setRetryAt(Date.now() + 60000);
    } finally {
      setBusy(false);
    }
  }
  async function verify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !sentTo || busy) return;
    if (!/^\d{6,10}$/.test(token)) {
      setNotice("SMS-dəki 6–10 rəqəmli kodu yaz.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: sentTo,
        token,
        type: "sms",
      });
      if (error) throw error;
      if (!data.session) throw new Error("Session unavailable");
      onSuccess();
    } catch (error) {
      setNotice(authErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="phoneLogin">
      <p className="authLead">
        {sentTo
          ? `${sentTo} nömrəsinə gələn SMS kodunu daxil et.`
          : "Mobil nömrənlə daxil ol və ya yeni hesab yarat. Şifrə lazım deyil."}
      </p>
      {settingsError ? (
        <div className="notice" role="status">
          Giriş xidmətini yoxlamaq mümkün olmadı.{" "}
          <button className="link" onClick={loadSettings}>
            Yenidən yoxla
          </button>
        </div>
      ) : enabled === null ? (
        <p role="status">Giriş xidməti yoxlanılır...</p>
      ) : enabled === false ? (
        <div className="smsUnavailable" role="status">
          <strong>SMS ilə giriş hələ aktiv deyil</strong>
          <p>Hazırda e-poçtla davam edə bilərsən.</p>
          <button type="button" className="link" onClick={onEmail}>
            E-poçtla daxil ol →
          </button>
        </div>
      ) : null}
      {!sentTo ? (
        <form onSubmit={send}>
          <label>
            Mobil nömrə
            <div className="phoneField">
              <span aria-hidden="true">+994</span>
              <input
                aria-label="Mobil nömrə"
                name="phone"
                type="tel"
                autoComplete="tel-national"
                inputMode="tel"
                placeholder="50 123 45 67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={24}
                required
                disabled={busy}
              />
            </div>
          </label>
          <button
            className="authSubmit"
            disabled={busy || enabled !== true || cooldown > 0}
          >
            {busy
              ? "Sorğu göndərilir..."
              : cooldown > 0
                ? `Yenidən göndər (${cooldown} san)`
                : "SMS kodu al"}
          </button>
          <p className="authConsent">
            Davam etməklə <Link href="/rules">qaydaları</Link> və{" "}
            <Link href="/privacy">məxfilik siyasətini</Link> qəbul edirsən.
          </p>
        </form>
      ) : (
        <>
          <form onSubmit={verify}>
            <label>
              SMS kodu
              <input
                name="sms-code"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6,10}"
                minLength={6}
                maxLength={10}
                placeholder="000000"
                required
                disabled={busy}
                autoFocus
              />
            </label>
            <button className="authSubmit" disabled={busy}>
              {busy ? "Yoxlanılır..." : "Təsdiqlə və daxil ol"}
            </button>
          </form>
          <div className="confirmationActions">
            <button
              className="link"
              disabled={busy || cooldown > 0}
              onClick={() => send()}
            >
              {cooldown > 0 ? `Yeni kod (${cooldown} san)` : "Yeni kod göndər"}
            </button>
            <button
              className="link"
              disabled={busy}
              onClick={() => {
                setSentTo("");
                setToken("");
                setNotice("");
              }}
            >
              Nömrəni dəyiş
            </button>
          </div>
        </>
      )}
      {notice && (
        <p className="notice" role="alert">
          {notice}
        </p>
      )}
    </div>
  );
}
