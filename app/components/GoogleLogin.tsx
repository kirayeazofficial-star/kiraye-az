"use client";
import { useEffect, useId, useState } from "react";
import { getAuthCapabilities, supabase } from "../../lib/supabase";
import { authCallbackUrl } from "../../lib/auth-flow";
import {
  authErrorMessage,
  safeLoginDestination,
} from "../../lib/auth-messages";
export default function GoogleLogin() {
  const statusId = useId();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function check() {
    try {
      setEnabled((await getAuthCapabilities()).google);
    } catch {
      setEnabled(false);
    }
  }
  useEffect(() => {
    void check();
  }, []);
  async function login() {
    if (!supabase || enabled !== true || busy) return;
    setBusy(true);
    setNotice("");
    try {
      const next = safeLoginDestination(
        new URLSearchParams(window.location.search).get("next"),
      );
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: authCallbackUrl(window.location.origin, false, next),
          skipBrowserRedirect: true,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
      if (!data.url || new URL(data.url).protocol !== "https:")
        throw new Error("Invalid authorization URL");
      window.location.assign(data.url);
    } catch (error) {
      setNotice(authErrorMessage(error));
      setBusy(false);
    }
  }
  return (
    <div className="googleLogin">
      <button
        type="button"
        className="googleButton"
        disabled={enabled !== true || busy}
        onClick={login}
        aria-describedby={enabled !== true ? statusId : undefined}
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5h6.6c3.8-3.6 6.1-8.8 6.1-14.9Z"
          />
          <path
            fill="#34A853"
            d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5c-1.8 1.2-4.1 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.2A20.4 20.4 0 0 0 24 44Z"
          />
          <path
            fill="#FBBC05"
            d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.2H5.8a20 20 0 0 0 0 17.6l6.8-5.2Z"
          />
          <path
            fill="#EA4335"
            d="M24 12c3 0 5.6 1 7.7 3l5.8-5.7A19.5 19.5 0 0 0 24 4 20.4 20.4 0 0 0 5.8 15.2l6.8 5.2C14.2 15.6 18.7 12 24 12Z"
          />
        </svg>
        {busy ? "Google-a yönləndirilir..." : "Google ilə davam et"}
      </button>
      {enabled !== true && (
        <p id={statusId} className="mailHelp" role="status">
          Hazırda bu xidmət aktiv deyil.
        </p>
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <div className="authDivider">
        <span>və ya</span>
      </div>
    </div>
  );
}
