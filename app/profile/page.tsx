"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "../login/style.css";

export default function Profile() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase?.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      setLoading(false);
    });
  }, []);
  async function logout() {
    await supabase?.auth.signOut();
    window.location.href = "/";
  }
  return <main className="loginPage"><a className="logo" href="/">kiraye<span>.az</span></a><section><p>ŞƏXSİ KABİNET</p><h1>Hesabım</h1>{loading ? <div className="notice">Yüklənir...</div> : email ? <><div className="notice">{email}</div><a className="profileAction" href="/">Elanlara bax</a><button className="link" onClick={logout}>Hesabdan çıx</button></> : <><div className="notice">Hesaba daxil olmamısan.</div><a className="profileAction" href="/login">Daxil ol</a></>}</section></main>;
}
