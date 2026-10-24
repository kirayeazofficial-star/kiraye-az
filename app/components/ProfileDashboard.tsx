"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PhotoMark from "./PhotoMark";
import BalancePreview from "../components/BalancePreview";
import PromotionOptions from "../components/PromotionOptions";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { effectiveListingStatus } from "../../lib/listing-lifecycle";
import { listingPolicyError } from "../../lib/listing-policy";
import { supabase } from "../../lib/supabase";
import {
  Listing,
  loadListings,
  statusName,
  money,
  periodName,
} from "../../lib/marketplace";
export default function ProfileDashboard({ balanceOnly = false }: { balanceOnly?: boolean }) {
  const [identity, setIdentity] = useState(""),
    [userId, setUserId] = useState(""),
    [loading, setLoading] = useState(true),
    [listings, setListings] = useState<Listing[]>([]),
    [error, setError] = useState(""),
    [admin, setAdmin] = useState(false),
    [busy, setBusy] = useState(""),
    [notice, setNotice] = useState(""),
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
        if (!balanceOnly) setListings(await loadListings("mine"));
      })
      .catch(() =>
        setError("Məlumatları yükləmək mümkün olmadı. Yenidən yoxlayın."),
      )
      .finally(() => setLoading(false));
  }, [balanceOnly]);
  async function archive(item: Listing) {
    if (!supabase || busy) return;
    setBusy(item.id);
    setError("");
    setNotice("");
    try {
      const { error } = await supabase
        .from("listings")
        .update({ status: "archived" })
        .eq("id", item.id)
        .eq("owner_id", userId)
        .select("id")
        .single();
      if (error) throw error;
      setListings((current) => current.map((x) =>
        x.id === item.id ? { ...x, status: "archived" } : x,
      ));
      setNotice("Elan axtarışdan götürüldü və arxivdə saxlanıldı. Yenidən kirayə vermək üçün arxivdən yeniləyib göndərə bilərsən.");
    } catch {
      setError("Elanı arxivə keçirmək mümkün olmadı. Yenidən cəhd et.");
    } finally {
      setBusy("");
    }
  }

  async function renew(item: Listing) {
    if (!supabase || busy) return;
    setBusy(item.id); setError(""); setNotice("");
    try {
      const result = await supabase.rpc("renew_listing", { p_listing_id: item.id });
      if (result.error) throw result.error;
      setListings(current => current.map(value => value.id === item.id ? { ...value, status: "pending" } : value));
      setNotice("Elan bərpa üçün yoxlamaya göndərildi.");
    } catch (error) {
      const value = error as { code?: string; message?: string };
      setError(value.code === "PGRST202" ? "Elanı bərpa etmək hazırda mümkün deyil. Bir qədər sonra yenidən yoxla." : listingPolicyError(value));
    } finally { setBusy(""); }
  }
  async function logout() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      setError("Hesabdan çıxmaq mümkün olmadı.");
      return;
    }
    try {
      sessionStorage.removeItem("kiraye:pending-confirmation");
      sessionStorage.removeItem("kiraye:login-email");
    } catch {}
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
            <Link className="add" href={balanceOnly ? "/login?next=/balance" : "/login?next=/profile"}>
              Daxil ol / Qeydiyyatdan keç
            </Link>
          </div>
        ) : (
          <div className="cabinetLayout">
            <nav className="cabinetNav" aria-label="Şəxsi kabinet">
              <Link href="/profile" aria-current={!balanceOnly ? "page" : undefined}>
                Elanlarım
              </Link>
              <Link href="/?favorites=1">Seçilmişlər</Link>
              <Link href="/account">Profil ayarları</Link>
              <Link href="/balance" aria-current={balanceOnly ? "page" : undefined}>Balans</Link>
              <Link href="/help">Kömək və qaydalar</Link>
              {admin && <Link href="/admin">Admin paneli</Link>}
            </nav>
            <div className="cabinetContent">
              {balanceOnly ? <BalancePreview /> : <>
              <div className="stats">
                <div>
                  <b>{listings.length}</b>
                  <span>Bütün elanlar</span>
                </div>
                <div>
                  <b>
                    {listings.filter((x) => effectiveListingStatus(x) === "published").length}
                  </b>
                  <span>Yayımlanmış</span>
                </div>
                <div>
                  <b>{listings.filter((x) => effectiveListingStatus(x) === "pending").length}</b>
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
                  ["expired", "Müddəti bitib"],
                ].map(([status, label]) => (
                  <button
                    key={status}
                    className="secondary"
                    aria-pressed={statusFilter === status}
                    onClick={() => setStatusFilter(status)}
                  >
                    {label} (
                    {
                      listings.filter((x) => !status || effectiveListingStatus(x) === status)
                        .length
                    }
                    )
                  </button>
                ))}
              </div>
              {!!listings.length &&
                !listings.some(
                  (x) => !statusFilter || effectiveListingStatus(x) === statusFilter,
                ) && <p className="notice">Bu bölmədə elan yoxdur.</p>}
              <p className="muted">Kirayəyə verilib və ya artıq mövcud deyil? Elanı arxivə keçir: axtarışda görünməyəcək, məlumatları hesabında qalacaq.</p>
              {notice && <p className="notice" role="status">{notice}</p>}
              <div className="accountListings">
                {listings
                  .filter((x) => !statusFilter || effectiveListingStatus(x) === statusFilter)
                  .map((x) => (
                    <article key={x.id}>
                      <Link
                        href={
                          effectiveListingStatus(x) === "published"
                            ? `/listings/${x.id}`
                            : `/profile/listings/${x.id}`
                        }
                        aria-label={`${x.title} — elana bax`}
                        className="ownedPhoto"
                      >
                        <img
                          src={x.images?.[0] || "/placeholder.svg"}
                          alt={x.title}
                        />
                        <PhotoMark src={x.images?.[0]} />
                      </Link>
                      <div>
                        <span className={`status ${effectiveListingStatus(x)}`}>
                          {statusName(effectiveListingStatus(x))}
                        </span>
                        <h3>
                          <Link
                            href={
                              effectiveListingStatus(x) === "published"
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
                        {effectiveListingStatus(x) === "rejected" && x.rejection_reason && (
                          <p className="error">Səbəb: {x.rejection_reason}</p>
                        )}
                        <small>{new Date(x.created_at).toLocaleDateString("az-AZ")}</small>
                        {x.expires_at && <p className="muted">Bitmə tarixi: {new Date(x.expires_at).toLocaleDateString("az-AZ")}</p>}
                      </div>
                      <div className="accountItemActions">
                        <PromotionOptions eligible={effectiveListingStatus(x) === "published"} />
                        {!!x.expires_at && ["expired", "archived"].includes(effectiveListingStatus(x)) && <button type="button" className="secondary" disabled={!!busy} onClick={() => renew(x)}>{busy === x.id ? "Gözləyin..." : "Bərpa et"}</button>}
                        <Link className="secondary" href={`/edit/${x.id}`}>
                          {effectiveListingStatus(x) === "archived"
                            ? "Yenilə və göndər"
                            : "Redaktə et"}
                        </Link>
                        <Link
                          className="secondary"
                          href={
                            effectiveListingStatus(x) === "published"
                              ? `/listings/${x.id}`
                              : `/profile/listings/${x.id}`
                          }
                        >
                          Elana bax
                        </Link>
                        {effectiveListingStatus(x) !== "archived" && (
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
              </>}
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
