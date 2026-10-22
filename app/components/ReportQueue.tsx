"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
type Report = {
  id: string;
  listing_id: string;
  reason: string;
  message: string;
  status: string;
  created_at: string;
  listings: { title: string } | null;
};
export default function ReportQueue() {
  const [reports, setReports] = useState<Report[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(""),
    [loading, setLoading] = useState(true),
    [tab, setTab] = useState("open"),
    [page, setPage] = useState(0);
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    let active = true;
    supabase
      .from("listing_reports")
      .select("*,listings(title)")
      .eq("status", tab)
      .order("created_at", { ascending: false })
      .range(page * 50, page * 50 + 49)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError("Şikayətləri yükləmək mümkün olmadı.");
        else setReports(data as Report[]);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tab, page]);
  async function resolve(id: string) {
    if (!supabase || busy) return;
    setBusy(id);
    try {
      const result = await supabase
        .from("listing_reports")
        .update({ status: "resolved" })
        .eq("id", id)
        .select("id")
        .single();
      if (result.error) throw result.error;
      setReports(reports.filter((r) => r.id !== id));
    } catch {
      setError("Şikayətin vəziyyəti saxlanmadı.");
    } finally {
      setBusy("");
    }
  }
  return (
    <section className="reportQueue">
      <h2>Şikayətlər və arxiv</h2>
      <div className="profileTabs" aria-label="Şikayət bölmələri">
        <button
          className="secondary"
          aria-pressed={tab === "open"}
          onClick={() => {
            setTab("open");
            setPage(0);
          }}
        >
          Açıq şikayətlər
        </button>
        <button
          className="secondary"
          aria-pressed={tab === "resolved"}
          onClick={() => {
            setTab("resolved");
            setPage(0);
          }}
        >
          Şikayət arxivi
        </button>
      </div>
      <p className="muted">Baxılan şikayətlər silinmir, arxivdə saxlanılır.</p>
      {loading ? (
        <p role="status">Yüklənir...</p>
      ) : !reports.length && !error ? (
        <p className="notice">
          {tab === "open" ? "Açıq şikayət yoxdur." : "Arxivdə şikayət yoxdur."}
        </p>
      ) : (
        reports.map((report) => (
          <article className="moderationCard" key={report.id}>
            <span className="status pending">{report.reason}</span>
            <h3>{report.listings?.title ?? "Elan"}</h3>
            <p className="description">{report.message}</p>
            <p className="muted">
              {new Date(report.created_at).toLocaleDateString("az-AZ")}
            </p>
            <div className="contactActions">
              <Link
                className="secondary"
                href={`/listings/${report.listing_id}`}
              >
                Elana bax
              </Link>
              {tab === "open" && (
                <button
                  className="add"
                  disabled={!!busy}
                  onClick={() => resolve(report.id)}
                >
                  {busy === report.id
                    ? "Saxlanılır..."
                    : "Baxıldı — arxivə keçir"}
                </button>
              )}
            </div>
            <small className="muted">
              Elanı silmək üçün yuxarıdakı elan idarəetməsindən arxivə keçir.
            </small>
          </article>
        ))
      )}
      <nav className="pagination" aria-label="Şikayət səhifələri">
        <button
          className="secondary"
          disabled={!page || loading}
          onClick={() => setPage(page - 1)}
        >
          Əvvəlki
        </button>
        <span>{page + 1}</span>
        <button
          className="secondary"
          disabled={reports.length < 50 || loading}
          onClick={() => setPage(page + 1)}
        >
          Növbəti
        </button>
      </nav>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
