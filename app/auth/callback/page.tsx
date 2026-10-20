"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { completeEmailAuth } from "../../../lib/auth-flow";
import "../../login/style.css";
export default function AuthCallback() {
  const [error, setError] = useState("");
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!supabase) {
      setError("Giriş xidməti hazır deyil. Bir az sonra yenidən yoxlayın.");
      return;
    }
    completeEmailAuth(supabase, window.location.href)
      .then((destination) => {
        window.history.replaceState(null, "", "/auth/callback");
        window.location.replace(destination);
      })
      .catch((err) => {
        window.history.replaceState(null, "", "/auth/callback");
        setError(err instanceof Error ? err.message : "Təsdiq tamamlanmadı.");
      });
  }, []);
  return (
    <main className="loginPage">
      <Link className="logo" href="/">
        kiraye<span>.az</span>
      </Link>
      <section>
        <div className="authEmblem">{error ? "!" : "✓"}</div>
        <h1>{error ? "Linki yeniləmək lazımdır" : "Hesabın təsdiqlənir"}</h1>
        <p className={error ? "error" : "notice"} role="status">
          {error ||
            "Bir neçə saniyə gözlə. Təsdiqdən sonra kabinetinə keçəcəksən."}
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
