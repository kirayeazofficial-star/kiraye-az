"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { completeEmailAuth } from "../../../lib/auth-flow";
import { authReturnHref, finishWithin } from "../../../lib/auth-return";
import "../../login/style.css";
export default function AuthCallback() {
  const [error, setError] = useState("");
  const work = useRef<Promise<string> | null>(null);
  useEffect(() => {
    if (!supabase) {
      setError("Giriş xidməti hazır deyil. Bir az sonra yenidən yoxlayın.");
      return;
    }
    let active = true;
    work.current ??= finishWithin(
      completeEmailAuth(supabase, authReturnHref(window.location.href)),
    );
    work.current
      .then((destination) => {
        if (!active) return;
        window.history.replaceState(null, "", "/auth/callback");
        window.location.replace(destination);
      })
      .catch((err) => {
        if (!active) return;
        window.history.replaceState(null, "", "/auth/callback");
        setError(err instanceof Error ? err.message : "Təsdiq tamamlanmadı.");
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <main className="loginPage">
      <Link className="logo" href="/">
        kirayeal<span>.az</span>
      </Link>
      <section>
        <div className="authEmblem">{error ? "!" : "✓"}</div>
        <h1>{error ? "Linki yeniləmək lazımdır" : "Giriş tamamlanır"}</h1>
        <p className={error ? "error" : "notice"} role="status">
          {error || "Bir neçə saniyə gözlə. Girişdən sonra sayta qayıdacaqsan."}
        </p>
        {error && (
          <Link className="add wide" href="/login">
            Girişə qayıt / Yeni kod istə
          </Link>
        )}
      </section>
    </main>
  );
}
