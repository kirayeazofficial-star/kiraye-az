"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
export default function Header() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setSignedIn(!!session);
    });
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSignedIn(!!data.session);
      })
      .catch(() => {});
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return (
    <>
      <div className="topbar">
        <div>
          Azərbaycanın kirayə platforması <span>Almağa tələsmə. Kirayələ.</span>
        </div>
      </div>
      <header className="header">
        <Link className="logo" href="/">
          kirayeal<span>.az</span>
          <small>KİRAYƏ ÜÇÜN BİR ÜNVAN</small>
        </Link>
        <nav aria-label="Əsas menyu">
          <a href="/#elanlar">Elanlar</a>
          <a href="/?favorites=1#elanlar">♡ Seçilmişlər</a>
          <Link href="/help">Kömək</Link>
        </nav>
        <div className="headerActions">
          <Link className="accountLink" href={signedIn ? "/profile" : "/login"}>
            {signedIn ? "Hesabım" : "Daxil ol"}
          </Link>
          {!signedIn && <a className="signupLink" href="/login?mode=signup">Qeydiyyatdan keç</a>}
          <Link className="add" href="/new">
            + Elan yerləşdir
          </Link>
        </div>
      </header>
      <nav className="mobileNav" aria-label="Mobil menyu">
        <Link href="/">
          ⌂<span>Ana səhifə</span>
        </Link>
        <a href="/?favorites=1#elanlar">
          ♡<span>Seçilmişlər</span>
        </a>
        <Link className="mobilePublish" href="/new">
          +<span>Elan yerləşdir</span>
        </Link>
        <Link href={signedIn ? "/profile" : "/login"}>
          ◎<span>{signedIn ? "Hesabım" : "Hesab"}</span>
        </Link>
      </nav>
    </>
  );
}
