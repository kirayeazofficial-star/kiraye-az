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
  const [identity, setIdentity] = useState(""),
    [userId, setUserId] = useState(""),
    [loading, setLoading] = useState(true),
    [listings, setListings] = useState<Listing[]>([]),
    [error, setError] = useState(""),
    [admin, setAdmin] = useState(false),
    [busy, setBusy] = useState(""),
    [statusFilter, setStatusFilter] = useState("");
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
        setUserId(data.user.id);
        setIdentity(data.user.phone || data.user.email || "Hesab");
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
              {identity || "Elanlarını bir yerdən idarə et."}
            </p>
          </div>
          {userId && (
            <button className="secondary" onClick={logout}>
              Hesabdan çıx
            </button>
          )}
        </div>
        {loading ? (
          <p role="status">Yüklənir...</p>
        ) : !userId ? (
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
          <div className="cabinetLayout">
            <nav className="cabinetNav" aria-label="Şəxsi kabinet">
              <Link href="/profile" aria-current="page">
                Elanlarım
              </Link>
              <Link href="/?favorites=1">Seçilmişlər</Link>
              <Link href="/account">Profil ayarları</Link>
              <Link href="/help">Kömək və qaydalar</Link>
              {admin && <Link href="/admin">Admin paneli</Link>}
            </nav>
            <div className="cabinetContent">
              <div className="stats">
                <div>
                  <b>{listings.length}</b>
                  <span>Bütün elanlar</span>
                </div>
                <div>
                  <b>
                    {listings.filter((x) => x.status === "published").length}
                  </b>
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
              <div className="profileTabs" aria-label="Elan vəziyyəti">
                {[
                  ["", "Hamısı"],
                  ["published", "Yayımlanmış"],
                  ["pending", "Yoxlanılır"],
                  ["rejected", "Rədd edilmiş"],
                  ["archived", "Arxiv"],
                ].map(([status, label]) => (
                  <button
                    key={status}
                    className="secondary"
                    aria-pressed={statusFilter === status}
                    onClick={() => setStatusFilter(status)}
                  >
                    {label} (
                    {
                      listings.filter((x) => !status || x.status === status)
                        .length
                    }
                    )
                  </button>
                ))}
              </div>
              {!!listings.length &&
                !listings.some(
                  (x) => !statusFilter || x.status === statusFilter,
                ) && <p className="notice">Bu bölmədə elan yoxdur.</p>}
              <div className="accountListings">
                {listings
                  .filter((x) => !statusFilter || x.status === statusFilter)
                  .map((x) => (
                    <article key={x.id}>
                      <Link
                        href={
                          x.status === "published"
                            ? `/listings/${x.id}`
                            : `/profile/listings/${x.id}`
                        }
                        aria-label={`${x.title} — elana bax`}
                      >
                        <img
                          src={x.images?.[0] || "/placeholder.svg"}
                          alt={x.title}
                        />
                      </Link>
                      <div>
                        <span className={`status ${x.status}`}>
                          {statusName(x.status)}
                        </span>
                        <h3>
                          <Link
                            href={
                              x.status === "published"
                                ? `/listings/${x.id}`
                                : `/profile/listings/${x.id}`
                            }
                          >
                            {x.title}
                          </Link>
                        </h3>
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
                        <Link
                          className="secondary"
                          href={
                            x.status === "published"
                              ? `/listings/${x.id}`
                              : `/profile/listings/${x.id}`
                          }
                        >
                          Elana bax
                        </Link>
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
            </div>
          </div>
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
