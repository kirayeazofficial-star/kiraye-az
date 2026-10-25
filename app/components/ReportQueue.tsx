"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { adminDate } from "../../lib/admin-display";
import { supabase } from "../../lib/supabase";
type Report = {
  id: string;
  listing_id: string;
  report_no?: number|string;
  resolved_at?:string|null;
  resolved_by?:string|null;
  reason: string;
  message: string;
  status: string;
  created_at: string;
  listings: { title: string;listing_no?:number|string } | null;
};
export default function ReportQueue({onInspect,numbered=false}:{onInspect?:(id:string)=>void;numbered?:boolean}={}) {
  const [search,setSearch]=useState(""),[query,setQuery]=useState(""),[from,setFrom]=useState("");
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
    let builder=supabase.from("listing_reports").select(numbered?"*,listings(title,listing_no)":"*,listings(title)").eq("status",tab);
    if (/^\d{8,18}$/.test(query)) builder=builder.eq("report_no",query);

    if(from)builder=builder.gte("created_at",`${from}T00:00:00+04:00`);
    if(from)builder=builder.lte("created_at",`${from}T23:59:59.999999+04:00`);
    builder.order("created_at", { ascending: false })
      .order("id",{ascending:false})
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
  }, [tab, page,query,from,numbered]);
  async function resolve(id: string) {
    if (!supabase || busy) return;
    setBusy(id);
    try {
      const result = await supabase
        .from("listing_reports")
        .update({ status: "resolved" })
        .eq("id", id)
        .eq("status","open")
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
      <form className="adminSearch reportSearch" onSubmit={event=>{event.preventDefault();setQuery(search.trim());setPage(0);}}><label htmlFor="report-number">Şikayət nömrəsi</label><div><input id="report-number" aria-label="Şikayət nömrəsi" inputMode="numeric" pattern="[0-9]{8,18}" value={search} onChange={event=>setSearch(event.target.value.replace(/[^0-9]/g,''))} maxLength={18} placeholder="Məsələn, 20000001"/><button className="secondary">Şikayət axtar</button></div></form>
      <div className="adminExtraFilters"><label>Şikayət tarixi<input type="date" value={from} onChange={event=>{setFrom(event.target.value);setPage(0);}}/></label></div>
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
            <strong>Şikayət № {report.report_no ?? "təyin edilməyib"}</strong>
            <p>Elan № {report.listings?.listing_no ?? "təyin edilməyib"}</p>
            <span className="status pending">{report.reason}</span>
            <h3>{report.listings?.title ?? "Elan"}</h3>
            <p className="description">{report.message}</p>
            <p className="muted">
              Göndərilib: {adminDate(report.created_at)}
            </p>
            {tab === "resolved" && <p className="muted">Baxılıb: {adminDate(report.resolved_at)}{report.resolved_by && <small> · Admin ID: {report.resolved_by}</small>}</p>}
            <div className="contactActions">
              {onInspect && <button type="button" className="secondary" onClick={()=>onInspect(report.listing_id)}>Elanı paneldə yoxla</button>}
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
              Şikayətə baxmaq elanı avtomatik silmir. Elan barədə qərarı yoxlama bölməsində ver.
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
