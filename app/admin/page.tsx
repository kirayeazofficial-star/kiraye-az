"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import ReportQueue from "../components/ReportQueue";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { supabase } from "../../lib/supabase";
import {
  Listing,
  statusName,
  money,
  categoryName,
  periodName,
} from "../../lib/marketplace";
import { adminListingQuery, ADMIN_PAGE_SIZE } from "../../lib/admin-catalog";
const statuses = [
  ["pending", "Yoxlanılır"],
  ["published", "Yayımlanıb"],
  ["rejected", "Rədd edilib"],
  ["archived", "Arxiv"],
  ["", "Hamısı"],
];
export default function Admin() {
  const [allowed, setAllowed] = useState(false),
    [checking, setChecking] = useState(true),
    [loading, setLoading] = useState(false),
    [loadError, setLoadError] = useState(false),
    [items, setItems] = useState<Listing[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(""),
    [filter, setFilter] = useState("pending"),
    [reasons, setReasons] = useState<Record<string, string>>({}),
    [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }
    const client = supabase;
    let active = true;
    client.auth
      .getUser()
      .then(async ({ data, error }) => {
        if (error || !data.user) return;
        const result = await client
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();
        if (result.error) throw result.error;
        if (active) setAllowed(result.data?.role === "admin");
      })
      .catch(() => {
        if (active)
          setError("İcazəni yoxlamaq mümkün olmadı. Səhifəni yenilə.");
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!allowed || !supabase) return;
    let active = true;
    setLoading(true);
    setLoadError(false);
    setError("");
    const builder = supabase.from("listings").select("*", { count: "exact" });
    Promise.resolve(adminListingQuery(builder, filter, query, page))
      .then(({ data, error, count }) => {
        if (!active) return;
        if (error) {
          setLoadError(true);
          setError("Elanları yükləmək mümkün olmadı. Yenidən yoxla.");
          return;
        }
        const maxPage = Math.max(1, Math.ceil((count ?? 0) / ADMIN_PAGE_SIZE));
        if (page > maxPage) {
          setPage(maxPage);
          return;
        }
        setItems((data ?? []) as Listing[]);
        setTotal(count ?? 0);
      })
      .catch(() => {
        if (active) {
          setLoadError(true);
          setError("Elanları yükləmək mümkün olmadı.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [allowed, filter, query, page, revision]);
  async function moderate(item: Listing, status: "published" | "rejected") {
    if (!supabase || busy || loading) return;
    const reason = reasons[item.id]?.trim() || "";
    if (status === "rejected" && reason.length < 10) {
      setError("Rədd səbəbini ən azı 10 simvolla yazın.");
      return;
    }
    setBusy(item.id);
    setError("");
    try {
      const result = await supabase
        .from("listings")
        .update({
          status,
          rejection_reason: status === "rejected" ? reason : null,
        })
        .eq("id", item.id)
        .eq("status", item.status)
        .select("id")
        .single();
      if (result.error) throw result.error;
      setReasons((current) => {
        const next = { ...current };
        delete next[item.id];
        return next;
      });
      setRevision((value) => value + 1);
    } catch {
      setError(
        "Dəyişiklik saxlanmadı. Elanın vəziyyəti dəyişmiş ola bilər; siyahını yenilə.",
      );
    } finally {
      setBusy("");
    }
  }
  function find(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPage(1);
    setQuery(search.trim());
  }
  return (
    <>
      <Header />
      <main className="wrap dashboard adminDashboard">
        <div className="sectionTitle">
          <div>
            <p className="eyebrow">İDARƏETMƏ</p>
            <h1>Admin paneli</h1>
            <p className="muted">
              Kirayə elanlarını yoxla, yayımla və şikayətləri idarə et.
            </p>
          </div>
          <Link className="secondary" href="/profile">
            Şəxsi kabinet
          </Link>
        </div>
        {checking ? (
          <p role="status">İcazə yoxlanılır...</p>
        ) : !allowed ? (
          <div className="empty">
            <h2>Bu bölmə yalnız idarəçilər üçündür</h2>
            <p>Admin icazəsi olan hesabla daxil ol.</p>
            <Link className="add" href="/login?next=/admin">
              Admin hesabına daxil ol
            </Link>
            <Link className="secondary" href="/profile">
              Kabinetə qayıt
            </Link>
          </div>
        ) : (
          <>
            <nav className="adminSections" aria-label="Admin bölmələri">
              <a href="#moderation">Elanların yoxlanılması</a>
              <a href="#reports">Şikayətlər</a>
            </nav>
            <section id="moderation" aria-labelledby="moderation-title">
              <div className="sectionTitle">
                <h2 id="moderation-title">Elanların yoxlanılması</h2>
                <button
                  className="secondary"
                  disabled={loading || !!busy}
                  onClick={() => setRevision((x) => x + 1)}
                >
                  Siyahını yenilə
                </button>
              </div>
              <div className="profileTabs" aria-label="Elan vəziyyəti">
                {statuses.map(([status, label]) => (
                  <button
                    key={status}
                    className="secondary"
                    aria-pressed={filter === status}
                    disabled={!!busy}
                    onClick={() => {
                      setFilter(status);
                      setPage(1);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <form className="adminSearch" onSubmit={find}>
                <label htmlFor="admin-search">
                  Başlıq, telefon və ya elan ID-si
                </label>
                <div>
                  <input
                    id="admin-search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    maxLength={100}
                    placeholder="Elan axtar..."
                  />
                  <button className="add" disabled={!!busy}>
                    Axtar
                  </button>
                </div>
              </form>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              {loading ? (
                <p role="status">Elanlar yüklənir...</p>
              ) : loadError ? null : (
                <>
                  <p className="adminResultCount">
                    {total} elan · Səhifə {page} /{" "}
                    {Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE))}
                  </p>
                  {!items.length && (
                    <div className="empty">
                      <h3>Bu bölmədə elan yoxdur</h3>
                      <p>Başqa vəziyyət seç və ya axtarışı dəyiş.</p>
                    </div>
                  )}
                  {items.map((item) => (
                    <article className="moderationCard" key={item.id}>
                      <div className="moderationImages">
                        {item.images?.map((src) => (
                          <a
                            key={src}
                            href={src}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img src={src} alt={item.title} loading="lazy" />
                          </a>
                        ))}
                      </div>
                      <span className={`status ${item.status}`}>
                        {statusName(item.status)}
                      </span>
                      <h3>{item.title}</h3>
                      <p>
                        <strong>
                          {money(item.price)} ₼ /{" "}
                          {periodName(item.rental_period)}
                        </strong>{" "}
                        · {item.city} {item.district && `· ${item.district}`}
                      </p>
                      <dl className="moderationMeta">
                        <div>
                          <dt>Kateqoriya</dt>
                          <dd>{categoryName(item.category)}</dd>
                        </div>
                        <div>
                          <dt>Əlaqə</dt>
                          <dd>{item.contact}</dd>
                        </div>
                        <div>
                          <dt>Depozit</dt>
                          <dd>{money(item.deposit ?? 0)} ₼</dd>
                        </div>
                        <div>
                          <dt>Minimum müddət</dt>
                          <dd>{item.min_days ?? 1} gün</dd>
                        </div>
                        {item.rooms && (
                          <div>
                            <dt>Otaq sayı</dt>
                            <dd>{item.rooms}</dd>
                          </div>
                        )}
                        {item.area_m2 && (
                          <div>
                            <dt>Sahə</dt>
                            <dd>{item.area_m2} m²</dd>
                          </div>
                        )}
                      </dl>
                      <p className="description">{item.description}</p>
                      <p className="adminItemId">
                        Elan ID: {item.id} ·{" "}
                        {new Date(item.created_at).toLocaleDateString("az-AZ")}
                      </p>
                      {item.rejection_reason && (
                        <p className="error">
                          Əvvəlki səbəb: {item.rejection_reason}
                        </p>
                      )}
                      <label className="moderationReason">
                        Rədd səbəbi
                        <textarea
                          maxLength={500}
                          rows={2}
                          value={reasons[item.id] ?? ""}
                          onChange={(e) =>
                            setReasons({
                              ...reasons,
                              [item.id]: e.target.value,
                            })
                          }
                          placeholder="Elan sahibinə görünəcək səbəbi yazın."
                        />
                      </label>
                      <div className="contactActions">
                        <button
                          disabled={!!busy || item.status === "published"}
                          className="add"
                          onClick={() => moderate(item, "published")}
                        >
                          {busy === item.id
                            ? "Saxlanılır..."
                            : "Təsdiqlə və yayımla"}
                        </button>
                        <button
                          disabled={!!busy || item.status === "rejected"}
                          className="secondary"
                          onClick={() => moderate(item, "rejected")}
                        >
                          Rədd et
                        </button>

                      </div>
                    </article>
                  ))}
                  {total > ADMIN_PAGE_SIZE && (
                    <nav
                      className="pagination"
                      aria-label="Admin elan səhifələri"
                    >
                      <button
                        className="secondary"
                        disabled={page === 1 || !!busy}
                        onClick={() => setPage((x) => x - 1)}
                      >
                        Əvvəlki
                      </button>
                      <span>{page}</span>
                      <button
                        className="secondary"
                        disabled={page * ADMIN_PAGE_SIZE >= total || !!busy}
                        onClick={() => setPage((x) => x + 1)}
                      >
                        Növbəti
                      </button>
                    </nav>
                  )}
                </>
              )}
            </section>
            <div id="reports">
              <ReportQueue />
            </div>
          </>
        )}
        {error && !allowed && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}
