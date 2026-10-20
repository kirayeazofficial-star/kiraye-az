"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import { supabase } from "../../lib/supabase";
import {
  Listing,
  loadListings,
  statusName,
  money,
} from "../../lib/marketplace";
export default function Admin() {
  const [allowed, setAllowed] = useState(false),
    [loading, setLoading] = useState(true),
    [items, setItems] = useState<Listing[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(""),
    [filter, setFilter] = useState("pending");
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const client = supabase;
    client.auth
      .getUser()
      .then(async ({ data }) => {
        if (!data.user) return;
        const { data: profile } = await client
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();
        if (profile?.role !== "admin") return;
        setAllowed(true);
        setItems(await loadListings("admin"));
      })
      .catch(() => setError("Elanları yükləmək mümkün olmadı."))
      .finally(() => setLoading(false));
  }, []);
  async function moderate(id: string, status: string) {
    if (!supabase || busy) return;
    setBusy(id);
    setError("");
    try {
      const result = await supabase
        .from("listings")
        .update({ status })
        .eq("id", id)
        .select("id")
        .single();
      if (result.error) throw result.error;
      setItems(items.map((x) => (x.id === id ? { ...x, status } : x)));
    } catch {
      setError("Dəyişiklik saxlanmadı. Yenidən yoxlayın.");
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <Header />
      <main className="wrap dashboard">
        <p className="eyebrow">İDARƏETMƏ</p>
        <h1>Elanların yoxlanılması</h1>
        {loading ? (
          <p role="status">İcazə yoxlanılır...</p>
        ) : !allowed ? (
          <div className="empty">
            <h2>Bu bölmə yalnız idarəçilər üçündür</h2>
            <Link className="add" href="/profile">
              Kabinetə qayıt
            </Link>
          </div>
        ) : (
          <>
            <div className="filterRow">
              <label>
                Elan vəziyyəti
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="pending">Yoxlanılır</option>
                  <option value="published">Yayımlanıb</option>
                  <option value="rejected">Qəbul edilməyib</option>
                  <option value="">Hamısı</option>
                </select>
              </label>
            </div>
            {!items.filter((x) => !filter || x.status === filter).length && (
              <p className="notice">Bu bölmədə elan yoxdur.</p>
            )}
            {items
              .filter((x) => !filter || x.status === filter)
              .map((x) => (
                <article className="moderationCard" key={x.id}>
                  <div className="moderationImages">
                    {x.images?.map((src) => (
                      <a
                        key={src}
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img src={src} alt={x.title} />
                      </a>
                    ))}
                  </div>
                  <span className={`status ${x.status}`}>
                    {statusName(x.status)}
                  </span>
                  <h2>{x.title}</h2>
                  <p>
                    {money(x.price)} ₼ · {x.city} · {x.contact}
                  </p>
                  <p className="description">{x.description}</p>
                  <div className="contactActions">
                    <button
                      disabled={!!busy || x.status === "published"}
                      className="add"
                      onClick={() => moderate(x.id, "published")}
                    >
                      Təsdiqlə və yayımla
                    </button>
                    <button
                      disabled={!!busy || x.status === "rejected"}
                      className="secondary"
                      onClick={() => moderate(x.id, "rejected")}
                    >
                      Rədd et
                    </button>
                    <button
                      disabled={!!busy || x.status === "archived"}
                      className="secondary"
                      onClick={() => moderate(x.id, "archived")}
                    >
                      Arxivə keçir
                    </button>
                  </div>
                </article>
              ))}
          </>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </main>
    </>
  );
}
