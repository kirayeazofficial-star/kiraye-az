"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { completeEmailAuth } from "../../lib/auth-flow";
import { authReturnHref, finishWithin } from "../../lib/auth-return";
import { authErrorMessage } from "../../lib/auth-messages";
import "../login/style.css";
export default function ResetPassword() {
  const [ready, setReady] = useState(false),
    [checking, setChecking] = useState(true),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [done, setDone] = useState(false),
    [attempt, setAttempt] = useState(0);
  const work = useRef<Promise<string> | null>(null);
  useEffect(() => {
    if (!supabase) {
      setNotice("Giriş xidməti hazır deyil.");
      setChecking(false);
      return;
    }
    let active = true;
    setChecking(true);
    setNotice("");
    work.current ??= finishWithin(
      completeEmailAuth(supabase, authReturnHref(window.location.href)),
    );
    work.current
      .then(() => {
        if (active) {
          window.history.replaceState(null, "", "/reset-password");
          setReady(true);
        }
      })
      .catch((err) => {
        if (active) {
          window.history.replaceState(null, "", "/reset-password");
          setReady(false);
          setNotice(
            err instanceof Error ? err.message : "Bərpa linkini yenidən yoxla.",
          );
        }
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || busy || !ready) return;
    const form = new FormData(e.currentTarget);
    if (form.get("password") !== form.get("confirm")) {
      setNotice("Şifrələr eyni olmalıdır.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const { error } = await finishWithin(
        supabase.auth.updateUser({ password: String(form.get("password")) }),
      );
      if (error) throw error;
      try {
        sessionStorage.removeItem("kiraye:pending-confirmation");
        sessionStorage.removeItem("kiraye:auth-retry-at");
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
          kiraye<span>.az</span>
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
          {!checking && !ready && (
            <button
              className="link"
              onClick={() => {
                work.current = null;
                setAttempt((x) => x + 1);
              }}
            >
              Yenidən yoxla
            </button>
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
