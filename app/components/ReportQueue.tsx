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
    [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase
      .from("listing_reports")
      .select("*,listings(title)")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) setError("Şikayətləri yükləmək mümkün olmadı.");
        else setReports(data as Report[]);
        setLoading(false);
      });
  }, []);
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
      <h2>Şikayətlər</h2>
      {loading ? (
        <p role="status">Yüklənir...</p>
      ) : !reports.length && !error ? (
        <p className="notice">Açıq şikayət yoxdur.</p>
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
              <button
                className="add"
                disabled={!!busy}
                onClick={() => resolve(report.id)}
              >
                {busy === report.id ? "Saxlanılır..." : "Baxıldı — bağla"}
              </button>
            </div>
            <small className="muted">
              Elanı silmək üçün yuxarıdakı elan idarəetməsindən arxivə keçir.
            </small>
          </article>
        ))
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
