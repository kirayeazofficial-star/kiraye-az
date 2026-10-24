"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { supabase } from "../../lib/supabase";
import { normalizePhone } from "../../lib/rental-details";
export default function Account() {
  const [user, setUser] = useState(""),
    [loginPhone, setLoginPhone] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [notice, setNotice] = useState("");
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const client = supabase;
    client.auth
      .getUser()
      .then(async ({ data, error }) => {
        if (error || !data.user) return;
        setUser(data.user.id);
        setLoginPhone(data.user.phone || "");
        const profile = await client
          .from("profiles")
          .select("display_name,phone")
          .eq("id", data.user.id)
          .maybeSingle();
        if (profile.error) throw profile.error;
        setName(profile.data?.display_name || data.user.user_metadata?.full_name || "");
        setPhone(profile.data?.phone || data.user.user_metadata?.contact_phone || data.user.phone || "");
      })
      .catch(() => setNotice("Məlumatları yükləmək mümkün olmadı."))
      .finally(() => setLoading(false));
  }, []);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !user || busy) return;
    if (phone && !normalizePhone(phone)) {
      setNotice("Düzgün Azərbaycan telefon nömrəsi yazın.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user,
        display_name: name.trim(),
        phone: phone ? normalizePhone(phone) : null,
      });
      if (error) throw error;
      setNotice("Profil məlumatları saxlanıldı.");
    } catch {
      setNotice("Məlumatlar saxlanmadı. Yenidən yoxlayın.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Header />
      <main className="wrap formPage">
        <p className="breadcrumb">
          <Link href="/profile">Kabinet</Link> / Profil ayarları
        </p>
        <h1>Profil məlumatları</h1>
        <p className="muted">
          Elanlarında görünəcək adını və əlaqə nömrəni idarə et.
        </p>
        {loading ? (
          <p role="status">Yüklənir...</p>
        ) : !user ? (
          <div className="notice">
            <Link href="/login">Davam etmək üçün daxil ol.</Link>
          </div>
        ) : (
          <form className="listingForm accountForm" onSubmit={save}>
            {loginPhone && (
              <p className="notice">
                Giriş nömrən: <strong>{loginPhone}</strong>
                <br />
                Aşağıdakı əlaqə nömrəsi giriş nömrəni dəyişmir.
              </p>
            )}
            <label>
              Ad və soyad
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                maxLength={80}
                required
                autoComplete="name"
              />
            </label>
            <label>
              Telefon
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                maxLength={25}
                autoComplete="tel"
                placeholder="050 123 45 67"
              />
            </label>
            <button disabled={busy} className="add">
              {busy ? "Saxlanılır..." : "Dəyişiklikləri saxla"}
            </button>
          </form>
        )}
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}
