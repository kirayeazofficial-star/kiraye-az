"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { supabase } from "../../lib/supabase";
import {
  Listing,
  loadListings,
  statusName,
  money,
  periodName,
} from "../../lib/marketplace";
export default function Profile() {
  const [email, setEmail] = useState(""),
    [loading, setLoading] = useState(true),
    [listings, setListings] = useState<Listing[]>([]),
    [error, setError] = useState(""),
    [admin, setAdmin] = useState(false),
    [busy, setBusy] = useState("");
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
        setEmail(data.user.email ?? "");
        const role = await client
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();
        setAdmin(role.data?.role === "admin");
        setListings(await loadListings("mine"));
      })
      .catch(() =>
        setError("Məlumatları yükləmək mümkün olmadı. Yenidən yoxlayın."),
      )
      .finally(() => setLoading(false));
  }, []);
  async function archive(item: Listing) {
    if (!supabase || busy) return;
    setBusy(item.id);
    setError("");
    const { error } = await supabase
      .from("listings")
      .update({ status: "archived" })
      .eq("id", item.id)
      .select("id")
      .single();
    if (error) setError("Elanı arxivə keçirmək mümkün olmadı.");
    else
      setListings(
        listings.map((x) =>
          x.id === item.id ? { ...x, status: "archived" } : x,
        ),
      );
    setBusy("");
  }
  async function logout() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      setError("Hesabdan çıxmaq mümkün olmadı.");
      return;
    }
    window.location.href = "/";
  }
  return (
    <>
      <Header />
      <main className="wrap dashboard">
        <div className="sectionTitle">
          <div>
            <p className="eyebrow">ŞƏXSİ KABİNET</p>
            <h1>Hesabım</h1>
            <p className="muted">
              {email || "Elanlarını bir yerdən idarə et."}
            </p>
          </div>
          {email && (
            <button className="secondary" onClick={logout}>
              Hesabdan çıx
            </button>
          )}
        </div>
        {loading ? (
          <p role="status">Yüklənir...</p>
        ) : !email ? (
          <div className="empty">
            <h2>
              {!supabase ? "Giriş xidməti hazırlanır" : "Hesabına daxil ol"}
            </h2>
            <p>Elanlarını və onların vəziyyətini burada görə bilərsən.</p>
            <Link className="add" href="/login?next=/profile">
              Daxil ol / Qeydiyyatdan keç
            </Link>
          </div>
        ) : (
          <>
            <div className="stats">
              <div>
                <b>{listings.length}</b>
                <span>Bütün elanlar</span>
              </div>
              <div>
                <b>{listings.filter((x) => x.status === "published").length}</b>
                <span>Yayımlanmış</span>
              </div>
              <div>
                <b>{listings.filter((x) => x.status === "pending").length}</b>
                <span>Yoxlanılır</span>
              </div>
            </div>
            <div className="sectionTitle">
              <h2>Elanlarım</h2>
              <div className="contactActions">
                <Link className="secondary" href="/account">
                  Profil ayarları
                </Link>
                {admin && (
                  <Link className="secondary" href="/admin">
                    Admin paneli
                  </Link>
                )}
                <Link className="add" href="/new">
                  + Yeni elan
                </Link>
              </div>
            </div>
            {!listings.length && !error && (
              <div className="empty">
                <h3>İlk elanını yaratmağa hazırsan?</h3>
                <p>İstifadə etmədiyin əşyanı kirayə ver.</p>
                <Link href="/new" className="add">
                  Elan yerləşdir
                </Link>
              </div>
            )}
            <div className="accountListings">
              {listings.map((x) => (
                <article key={x.id}>
                  <img
                    src={x.images?.[0] || "/placeholder.svg"}
                    alt={x.title}
                  />
                  <div>
                    <span className={`status ${x.status}`}>
                      {statusName(x.status)}
                    </span>
                    <h3>{x.title}</h3>
                    <p>
                      {money(x.price)} ₼ / {periodName(x.rental_period)} ·{" "}
                      {x.city}
                    </p>
                    {x.status === "rejected" && x.rejection_reason && (
                      <p className="error">Səbəb: {x.rejection_reason}</p>
                    )}
                    <small>
                      {new Date(x.created_at).toLocaleDateString("az-AZ")}
                    </small>
                  </div>
                  <div className="accountItemActions">
                    <Link className="secondary" href={`/edit/${x.id}`}>
                      {x.status === "archived"
                        ? "Yenilə və göndər"
                        : "Redaktə et"}
                    </Link>
                    {x.status === "published" && (
                      <Link className="secondary" href={`/listings/${x.id}`}>
                        Elana bax
                      </Link>
                    )}
                    {x.status !== "archived" && (
                      <button
                        className="secondary"
                        disabled={!!busy}
                        onClick={() => archive(x)}
                      >
                        {busy === x.id ? "Gözləyin..." : "Arxivə keçir"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}
