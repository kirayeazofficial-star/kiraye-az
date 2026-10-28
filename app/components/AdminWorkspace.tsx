"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminDate, staffRoleName } from "../../lib/admin-display";
import { categoryName, money, periodName, statusName, type Listing } from "../../lib/marketplace";
import { moderationActions, moderationFields, rejectionReasons, type ModerationContext, type ModerationEvent } from "../../lib/moderation";

type Section = "overview" | "moderation" | "reports" | "history" | "users" | "staff";
type AdminListing = Listing & { listing_no?: number | string; owner_email: string; owner_name?: string; views?: number; review_kind?: string };
type Counts = { users: number; listings: number; messages: number; reports: number; statuses: Record<string, number> };
type User = { id: string; email: string; display_name: string; phone: string; profile_no: number; staff_role?: string; listing_count: number; created_at?: string };
type Report = { id: string; report_no: number | string; reason: string; message: string; status: string; created_at: string; resolved_at?: string | null; resolved_by?: string | null; listing_id: string; title: string; listing_no?: number | string; reporter_email?: string };
type Member = { id: string; name: string | null; email: string; phone?: string; profile_no?: number; role: string; confirmed?: boolean; assigned_at?: string | null };
type StaffEvent = { id: number; action: string; created_at: string; actor_email?: string | null; target_email?: string | null };

const PAGE = 24;
const sectionLabels: Record<Section, string> = { overview: "Ümumi", moderation: "Elanlar", reports: "Şikayətlər", history: "Əməliyyat tarixçəsi", users: "İstifadəçilər", staff: "Adminlər" };
const statuses: [string, string][] = [["pending", "Yoxlanılır"], ["published", "Yayımlanıb"], ["rejected", "Rədd edilib"], ["archived", "Bitmiş"], ["all", "Hamısı"]];
const staffActions: Record<string, string> = { moderator_granted: "Admin təyin edildi", moderator_revoked: "Səlahiyyət geri alındı", leader_initialized: "Rəhbər təyin edildi", report_resolved: "Şikayətə baxıldı" };

async function api(params: Record<string, string | number>) {
  const response = await fetch("/api/admin?" + new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])).toString(), { cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || "FAILED"), { status: response.status, code: data.error });
  return data;
}
async function post(payload: Record<string, unknown>) {
  const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || "FAILED"), { code: data.error });
  return data;
}
const renderValue = (value: unknown) => value === null || value === undefined || value === "" ? "Qeyd edilməyib" : typeof value === "object" ? JSON.stringify(value) : String(value);

function EventList({ events, onInspect }: { events: ModerationEvent[]; onInspect?: (id: string) => void }) {
  return <ol className="moderationTimeline">{events.map(event => <li key={event.id}>
    <strong>{moderationActions[event.action] || event.action}</strong>
    <p>{adminDate(event.created_at)} · {event.actor_name || (event.actor_kind === "system" ? "Sistem" : event.actor_kind === "admin" ? "İdarəçi" : "Elan sahibi")}{event.actor_id && <small> · ID: {event.actor_id}</small>}</p>
    <p>{event.old_status ? statusName(event.old_status) + " → " : ""}{event.new_status ? statusName(event.new_status) : "Silinib"}</p>
    {event.reason && <p>Qərarın səbəbi: {event.reason}</p>}
    {onInspect && <button type="button" className="textButton" onClick={() => onInspect(event.listing_id)}>Elanı yoxla</button>}
    {!!event.changed_fields?.length && event.before_values && event.after_values && <details><summary>Dəyişən məlumatlar ({event.changed_fields.length})</summary><div className="moderationChanges">{event.changed_fields.map(key => <div key={key}><strong>{moderationFields[key] || key}</strong><div><p><b>Əvvəl:</b> {renderValue(event.before_values?.[key])}</p><p><b>İndi:</b> {renderValue(event.after_values?.[key])}</p></div></div>)}</div></details>}
  </li>)}</ol>;
}

function ModerationReview({ listingId, onInspect }: { listingId: string; onInspect: (id: string) => void }) {
  const [data, setData] = useState<ModerationContext | null>(null), [loading, setLoading] = useState(false), [error, setError] = useState("");
  async function load() {
    if (loading || data) return;
    setLoading(true); setError("");
    try { setData(await api({ action: "context", id: listingId }) as ModerationContext); }
    catch { setError("Yoxlama məlumatları yüklənmədi. Bu xəta tarixçənin boş olması demək deyil."); }
    finally { setLoading(false); }
  }
  return <details className="moderationReview" onToggle={event => { if (event.currentTarget.open) void load(); }}><summary>Uyğunluqlar, istifadəçi və dəyişiklik tarixçəsi</summary>
    {loading && <p role="status">Yoxlama məlumatları yüklənir...</p>}
    {error && <p role="alert">{error} <button className="secondary" type="button" onClick={() => void load()}>Yenidən yoxla</button></p>}
    {data && <>
      <section><h4>Oxşarlıq xəbərdarlıqları</h4><p className="muted">Son 180 gündəki ən yeni 500 elanla müqayisə edilir; ən çox 8 uyğunluq göstərilir. Eyni nömrə və ya oxşarlıq qayda pozuntusunun sübutu deyil. Şəkil yoxlaması eyni fayl ünvanını aşkarlayır, yenidən yüklənmiş şəkli tanımır.</p>
        {!data.signals.length ? <p>Yoxlanılan elanlar arasında uyğunluq tapılmadı.</p> : <ul className="moderationSignals">{data.signals.map(signal => <li key={signal.id}><button type="button" className="textButton" onClick={() => onInspect(signal.id)}>{signal.title}</button><p>{[signal.same_phone && "Eyni əlaqə nömrəsi", signal.same_image && "Eyni şəkil ünvanı", signal.similar_text && "Oxşar mətn"].filter(Boolean).join(" · ")} · {statusName(signal.status)}</p></li>)}</ul>}
      </section>
      <section><h4>Elan sahibinin tarixçəsi</h4><p>{data.owner.name || "Ad qeyd edilməyib"} · Hesab: {adminDate(data.owner.joined_at)}</p><p className="moderationOwnerId">ID: {data.owner.id}</p><p>Şikayətlər: {data.reports.open} açıq, {data.reports.resolved} baxılıb. Şikayət özlüyündə qayda pozuntusunu təsdiqləmir.</p>
        <ul>{data.owner_listings.map(item => <li key={item.id}><button type="button" className="textButton" onClick={() => onInspect(item.id)}>{item.title}</button> · {statusName(item.status)} · {adminDate(item.created_at)}{item.rejection_reason && <small> · Səbəb: {item.rejection_reason}</small>}</li>)}</ul>
      </section>
      <section><h4>Elanın son 10 əməliyyatı</h4>{data.events.length ? <EventList events={data.events} /> : <p>Qeyd yoxdur. Köhnə əməliyyatlar geriyə tarixlə yaradılmır.</p>}</section>
    </>}
  </details>;
}

function ModerationHistory({ revision, onInspect }: { revision: number; onInspect: (id: string) => void }) {
  const [events, setEvents] = useState<ModerationEvent[]>([]), [cursor, setCursor] = useState<number | null>(null), [loading, setLoading] = useState(false), [error, setError] = useState("");
  const load = useCallback(async (before?: number | null) => {
    setLoading(true); setError("");
    try {
      const data = await api(before ? { action: "history", before } : { action: "history" });
      setEvents(old => before ? [...old, ...data.events] : data.events); setCursor(data.next);
    } catch { setError("Məlumat yüklənmədi. Bağlantını yoxlayıb yenidən cəhd et. Bu xəta tarixçənin boş olması demək deyil."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load, revision]);
  return <section id="moderation-history"><div className="sectionTitle"><h2>Əməliyyat tarixçəsi</h2><button type="button" className="secondary" disabled={loading} onClick={() => void load()}>{loading ? "Yüklənir..." : "Tarixçəni yenilə"}</button></div>
    <p className="muted">Qərarlar serverdə qeydə alınır. Köhnə qeydləri açmaq üçün “Daha köhnə qeydlər” düyməsindən istifadə et.</p>
    {error && <p className="error" role="alert">{error}</p>}
    {!events.length && !loading && !error ? <p className="notice">Hələ qeyd yoxdur.</p> : <EventList events={events} onInspect={onInspect} />}
    {cursor && <button type="button" className="secondary" disabled={loading} onClick={() => void load(cursor)}>Daha köhnə qeydlər</button>}
  </section>;
}

function ReportQueue({ onInspect }: { onInspect: (id: string) => void }) {
  const [search, setSearch] = useState(""), [query, setQuery] = useState(""), [from, setFrom] = useState("");
  const [reports, setReports] = useState<Report[]>([]), [error, setError] = useState(""), [busy, setBusy] = useState(""), [loading, setLoading] = useState(true), [tab, setTab] = useState("open"), [page, setPage] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setError("");
    api({ action: "reports", tab, query, from, page }).then(data => { if (active) setReports(data.items); }).catch(() => { if (active) setError("Şikayətləri yükləmək mümkün olmadı."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [tab, page, query, from]);
  async function resolve(id: string) {
    if (busy) return; setBusy(id);
    try { await post({ action: "resolve_report", id }); setReports(current => current.filter(item => item.id !== id)); }
    catch { setError("Şikayətin vəziyyəti saxlanmadı."); } finally { setBusy(""); }
  }
  return <section className="reportQueue"><h2>Şikayətlər və arxiv</h2>
    <div className="profileTabs" aria-label="Şikayət bölmələri"><button className="secondary" aria-pressed={tab === "open"} onClick={() => { setTab("open"); setPage(0); }}>Açıq şikayətlər</button><button className="secondary" aria-pressed={tab === "resolved"} onClick={() => { setTab("resolved"); setPage(0); }}>Şikayət arxivi</button></div>
    <form className="adminSearch reportSearch" onSubmit={event => { event.preventDefault(); setQuery(search.trim()); setPage(0); }}><label htmlFor="report-number">Şikayət nömrəsi</label><div><input id="report-number" aria-label="Şikayət nömrəsi" inputMode="numeric" pattern="[0-9]{8,18}" value={search} onChange={event => setSearch(event.target.value)} placeholder="Məs. 20000001" /><button className="add">Axtar</button></div></form>
    <div className="adminExtraFilters"><label>Şikayət tarixi<input type="date" value={from} onChange={event => { setFrom(event.target.value); setPage(0); }} /></label></div>
    <p className="muted">Baxılan şikayətlər silinmir, arxivdə saxlanılır.</p>
    {loading ? <p role="status">Yüklənir...</p> : !reports.length && !error ? <p className="notice">{tab === "open" ? "Açıq şikayət yoxdur." : "Arxivdə şikayət yoxdur."}</p> : reports.map(report => <article className="moderationCard" key={report.id}>
      <strong>Şikayət № {report.report_no}</strong><p>Elan № {report.listing_no ?? "təyin edilməyib"}</p><span className="status pending">{report.reason}</span><h3>{report.title}</h3><p className="description">{report.message}</p>
      <p className="muted">Göndərilib: {adminDate(report.created_at)}{report.reporter_email ? ` · ${report.reporter_email}` : ""}</p>
      {tab === "resolved" && <p className="muted">Baxılıb: {adminDate(report.resolved_at)}{report.resolved_by && <small> · Admin ID: {report.resolved_by}</small>}</p>}
      <div className="contactActions"><button type="button" className="secondary" onClick={() => onInspect(report.listing_id)}>Elanı paneldə yoxla</button><Link className="secondary" href={`/listings/${report.listing_id}`}>Elana bax</Link>{tab === "open" && <button className="add" disabled={!!busy} onClick={() => void resolve(report.id)}>{busy === report.id ? "Saxlanılır..." : "Baxıldı — arxivə keçir"}</button>}</div>
      <small className="muted">Şikayətə baxmaq elanı avtomatik silmir. Elan barədə qərarı yoxlama bölməsində ver.</small>
    </article>)}
    <nav className="pagination" aria-label="Şikayət səhifələri"><button className="secondary" disabled={!page || loading} onClick={() => setPage(page - 1)}>Əvvəlki</button><span>{page + 1}</span><button className="secondary" disabled={reports.length < 50 || loading} onClick={() => setPage(page + 1)}>Növbəti</button></nav>
    {error && <p className="error" role="alert">{error}</p>}
  </section>;
}

function StaffManagement() {
  const [members, setMembers] = useState<Member[]>([]), [events, setEvents] = useState<StaffEvent[]>([]), [cursor, setCursor] = useState<number | null>(null);
  const [query, setQuery] = useState(""), [found, setFound] = useState<Member | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const load = useCallback(async () => { const data = await api({ action: "staff" }); setMembers(data.members); setEvents(data.events); setCursor(data.next); }, []);
  useEffect(() => { load().catch(() => setError("Admin siyahısı yüklənmədi. Rəhbər icazəsini yoxla.")); }, [load]);
  async function older() {
    if (busy || !cursor) return; setBusy(true); setError("");
    try { const data = await api({ action: "staff", before: cursor }); setEvents(old => [...old, ...data.events]); setCursor(data.next); } catch { setError("Köhnə qeydlər yüklənmədi."); } finally { setBusy(false); }
  }
  async function find(event: FormEvent) {
    event.preventDefault(); if (busy) return; setBusy(true); setError(""); setNotice(""); setFound(null);
    try { setFound((await api({ action: "find", query: query.trim() })).account); }
    catch (failure) { const code = (failure as { code?: string }).code; setError(code === "NOT_FOUND" ? "Bu məlumatla hesab tapılmadı. Hesab əvvəl qeydiyyatdan keçməlidir." : code === "MULTIPLE" ? "Bu nömrə bir neçə hesaba aiddir. Dəqiq e-poçt və ya hesab ID-si yaz." : "Axtarış tamamlanmadı."); }
    finally { setBusy(false); }
  }
  async function change(account: Member, enabled: boolean) {
    if (busy) return; setBusy(true); setError(""); setNotice("");
    try { await post({ action: "set_staff", id: account.id, enabled }); setFound(null); setQuery(""); setNotice(enabled ? "Admin səlahiyyəti verildi." : "Səlahiyyət geri alındı."); await load(); }
    catch (failure) { const code = (failure as { code?: string }).code; setError(code === "EMAIL_NOT_CONFIRMED" ? "Əvvəl e-poçt təsdiqlənməlidir." : code === "LEADER_PROTECTED" ? "Rəhbərin səlahiyyəti buradan dəyişdirilmir." : "Səlahiyyət dəyişdirilmədi."); }
    finally { setBusy(false); }
  }
  return <section id="staff-management" className="staffManagement"><h2>Adminlər</h2><p>Yalnız Rəhbər yeni admin təyin edə və səlahiyyətini geri ala bilər.</p>
    <form onSubmit={event => void find(event)}><label>Yeni admin əlavə et<input aria-label="Admin üçün telefon, e-poçt və ya hesab ID-si" value={query} onChange={event => { setQuery(event.target.value); setFound(null); }} maxLength={254} placeholder="Telefon, e-poçt və ya hesab ID-si" required /></label><button className="add" disabled={busy}>Hesabı tap</button></form>
    {error && <p role="alert" className="error">{error}</p>}{notice && <p role="status">{notice}</p>}
    {found && <div className="staffAccount"><strong>{found.name || "Ad qeyd edilməyib"}</strong><p>{found.email} · {staffRoleName(found.role)}</p><p>{found.phone}</p><small>ID: {found.profile_no || found.id}</small><p>{found.confirmed ? "E-poçt təsdiqlənib." : "Əvvəl e-poçt təsdiqlənməlidir."}</p>
      {found.role === "user" && <button className="add" type="button" disabled={busy || !found.confirmed} onClick={() => void change(found, true)}>Admin təyin et</button>}
      {found.role === "moderator" && <button className="secondary danger" type="button" disabled={busy} onClick={() => void change(found, false)}>Səlahiyyəti geri al</button>}</div>}
    <button type="button" className="textButton" disabled={busy} onClick={() => load().catch(() => setError("Siyahı yenilənmədi."))}>Siyahını yenilə</button>
    <div className="staffList">{members.map(account => <article className="staffAccount" key={account.id}><strong>{account.name || account.email}</strong><span className="staffRole">{staffRoleName(account.role)}</span><p>{account.email}</p><p>{account.phone}</p><small>ID: {account.profile_no || account.id}</small><p>Təyinat: {adminDate(account.assigned_at)}</p>{account.role === "moderator" && <button className="secondary danger" disabled={busy} onClick={() => void change(account, false)}>Səlahiyyəti geri al</button>}</article>)}</div>
    <details><summary>Səlahiyyət və şikayət əməliyyatları</summary><ol className="moderationTimeline">{events.map(event => <li key={event.id}><strong>{staffActions[event.action] || event.action}</strong><p>{adminDate(event.created_at)}</p><p>{event.actor_email || "Sistem"}{event.target_email ? ` → ${event.target_email}` : ""}</p></li>)}</ol>{cursor && <button type="button" className="secondary" disabled={busy} onClick={() => void older()}>Daha köhnə qeydlər</button>}</details>
  </section>;
}

export default function AdminWorkspace() {
  const [allowed, setAllowed] = useState<boolean | null>(null), [role, setRole] = useState(""), [section, setSection] = useState<Section>("overview");
  const [filter, setFilter] = useState("pending"), [items, setItems] = useState<AdminListing[]>([]), [total, setTotal] = useState(0), [page, setPage] = useState(1);
  const [search, setSearch] = useState(""), [query, setQuery] = useState(""), [dateFrom, setDateFrom] = useState(""), [reviewKind, setReviewKind] = useState("");
  const [reasons, setReasons] = useState<Record<string, string>>({}), [revision, setRevision] = useState(0), [loading, setLoading] = useState(false), [busy, setBusy] = useState(""), [error, setError] = useState("");
  const [counts, setCounts] = useState<Counts | null>(null), [users, setUsers] = useState<User[]>([]), [userQuery, setUserQuery] = useState("");

  useEffect(() => { api({ action: "access" }).then(data => { setAllowed(true); setRole(data.role); }).catch(() => setAllowed(false)); }, []);
  useEffect(() => {
    if (!allowed || section !== "moderation") return;
    let active = true; setLoading(true); setError("");
    api({ action: "listings", status: filter, query, page, from: dateFrom, kind: reviewKind }).then(data => {
      if (!active) return;
      const maxPage = Math.max(1, Math.ceil(data.total / PAGE));
      if (page > maxPage) { setPage(maxPage); return; }
      setItems(data.items); setTotal(data.total);
    }).catch(() => { if (active) setError("Elanları yükləmək mümkün olmadı. Yenidən yoxla."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [allowed, section, filter, query, page, revision, dateFrom, reviewKind]);
  useEffect(() => {
    if (!allowed) return;
    api({ action: "overview" }).then(data => setCounts(data.counts)).catch(() => setError("Statistika yüklənmədi."));
    if (section === "users") api({ action: "users", query: userQuery }).then(data => setUsers(data.items)).catch(() => setError("İstifadəçilər yüklənmədi."));
  }, [allowed, section, userQuery, revision]);

  async function moderate(item: AdminListing, status: "published" | "rejected") {
    if (busy || loading) return;
    const reason = reasons[item.id]?.trim() || "";
    if (status === "rejected" && reason.length < 10) { setError("Rədd səbəbini ən azı 10 simvolla yazın."); return; }
    setBusy(item.id); setError("");
    try {
      await post({ action: "moderate", id: item.id, status, from: item.status, reason });
      setReasons(current => { const next = { ...current }; delete next[item.id]; return next; });
      setRevision(value => value + 1);
    } catch { setError("Dəyişiklik saxlanmadı. Elanın vəziyyəti dəyişmiş ola bilər; siyahını yenilə."); }
    finally { setBusy(""); }
  }
  function inspect(id: string) { setSection("moderation"); setDateFrom(""); setReviewKind(""); setFilter("all"); setSearch(id); setQuery(id); setPage(1); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function find(event: FormEvent) { event.preventDefault(); setPage(1); setQuery(search.trim()); }

  if (allowed === null) return <p role="status">İcazə yoxlanılır…</p>;
  if (allowed === false) return <section className="empty"><h2>Bu bölmə yalnız idarəçilər üçündür</h2><p>Admin icazəsi olan hesabla daxil ol.</p><Link className="add" href="/login?next=/admin">Admin hesabına daxil ol</Link><Link className="secondary" href="/profile">Kabinetə qayıt</Link></section>;
  const sections = (Object.keys(sectionLabels) as Section[]).filter(item => item !== "staff" || role === "leader");
  return <div className="adminWorkspace">
    <nav className="adminSections" aria-label="Admin bölmələri"><p className="adminNavTitle">İdarəetmə</p>{sections.map(item => <button key={item} aria-pressed={section === item} onClick={() => { setSection(item); setError(""); }}><span aria-hidden="true" className={`adminNavIcon adminNavIcon-${item === "moderation" || item === "history" ? "listings" : item}`} />{sectionLabels[item]}</button>)}<Link className="adminBackLink" href="/profile">← Şəxsi kabinet</Link></nav>
    <div>
      
      {error && <p className="error" role="alert">{error}</p>}
      {section === "overview" && <section className="adminPanel"><h2>Saytın vəziyyəti</h2><div className="adminStats"><article><b>{counts?.users || 0}</b><span>İstifadəçi</span></article><article><b>{counts?.listings || 0}</b><span>Bütün elanlar</span></article><article><b>{counts?.statuses?.pending || 0}</b><span>Yoxlanılır</span></article><article><b>{counts?.statuses?.published || 0}</b><span>Yayımlanıb</span></article><article><b>{counts?.messages || 0}</b><span>Mesaj</span></article><article><b>{counts?.reports || 0}</b><span>Açıq şikayət</span></article></div></section>}
      {section === "users" && <section className="adminPanel"><form className="adminSearch" onSubmit={event => { event.preventDefault(); }}><input value={userQuery} onChange={event => setUserQuery(event.target.value)} placeholder="Ad, e-poçt və ya hesab nömrəsi" /></form><div className="adminUsers">{users.map(user => <article key={user.id}><div className="adminUserMain"><strong>{user.display_name || "Adsız istifadəçi"}</strong><span className="adminUserMeta">ID: #{user.profile_no} · {user.email}</span></div><div className="adminUserDetails"><span>{user.phone || "Telefon yoxdur"}</span><span>{user.listing_count} elan</span>{user.created_at&&<span>Qeydiyyat: {new Date(user.created_at).toLocaleDateString('az-AZ',{day:'numeric',month:'short',year:'numeric'})}</span>}{user.staff_role&&<b className="adminUserRole">{user.staff_role==="leader"?"Rəhbər":"Admin"}</b>}</div></article>)}</div></section>}
      {section === "staff" && role === "leader" && <StaffManagement />}
      {section === "history" && <><button type="button" className="secondary" onClick={() => setSection("moderation")}>← Elanlara qayıt</button><ModerationHistory revision={revision} onInspect={inspect} /></>}
      {section === "reports" && <div id="reports"><ReportQueue onInspect={inspect} /></div>}
      {section === "moderation" && <section id="moderation" aria-labelledby="moderation-title">
        <div className="sectionTitle"><h2 id="moderation-title">Elanların yoxlanılması</h2><div className="contactActions"><button className="secondary" type="button" onClick={() => setSection("history")}>Tarixçə</button><button className="secondary" disabled={loading || !!busy} onClick={() => setRevision(x => x + 1)}>Yenilə</button></div></div>
        <div className="profileTabs" aria-label="Elan vəziyyəti">{statuses.map(([status, label]) => <button key={status} className="secondary" aria-pressed={filter === status} disabled={!!busy} onClick={() => { setFilter(status); setPage(1); }}>{label}{counts && <small className="chipCount">{status === "all" ? counts.listings : status === "archived" ? (counts.statuses.archived || 0) + (counts.statuses.expired || 0) : counts.statuses[status] || 0}</small>}</button>)}</div>
        <details className="adminFilters"><summary>Axtarış və filtrlər</summary>
        <form className="adminSearch" onSubmit={find}><label htmlFor="admin-search">Başlıq, telefon, elan nömrəsi və ya ID-si</label><div><input id="admin-search" value={search} onChange={event => setSearch(event.target.value)} maxLength={100} placeholder="Elan axtar..." /><button className="add" disabled={!!busy}>Axtar</button></div></form>
        <div className="adminExtraFilters"><label>Elanın tarixi<input type="date" value={dateFrom} onChange={event => { setDateFrom(event.target.value); setPage(1); }} /></label><label>Yoxlama növü<select aria-label="Yoxlama növü" value={reviewKind} onChange={event => { setReviewKind(event.target.value); setPage(1); }}><option value="">Hamısı</option><option value="new">Yeni elanlar</option><option value="edited">Dəyişdirilmiş elanlar</option></select></label></div>
        </details>
        {loading ? <p role="status">Elanlar yüklənir...</p> : <>
          <p className="adminResultCount">{total} elan · Səhifə {page} / {Math.max(1, Math.ceil(total / PAGE))}</p>
          {!items.length && <div className="empty"><h3>{filter === "pending" && !query ? "Yoxlanılacaq elan yoxdur" : "Bu bölmədə elan yoxdur"}</h3><p>{filter === "pending" && !query ? "Bütün elanlar baxılıb." : "Başqa vəziyyət seç və ya axtarışı dəyiş."}</p></div>}
          {items.map(item => <article className="moderationCard" key={item.id}>
            <div className="moderationImages">{item.images?.map(src => <a key={src} href={src} target="_blank" rel="noopener noreferrer"><img src={src} alt={item.title} loading="lazy" /></a>)}</div>
            <span className={`status ${item.status}`}>{statusName(item.status)}</span><h3>{item.title}</h3>
            {item.status === "pending" && item.review_kind === "edited" && <p className="notice">Yayımdan sonra dəyişdirilib — təkrar yoxlanmalıdır.</p>}
            <p><strong>{money(item.price)} ₼ / {periodName(item.rental_period)}</strong> · {item.city} {item.district && `· ${item.district}`}</p>
            <details className="adminMore"><summary>Ətraflı məlumat</summary><dl className="moderationMeta"><div><dt>Kateqoriya</dt><dd>{categoryName(item.category)}</dd></div><div><dt>Əlaqə</dt><dd>{item.contact}</dd></div><div><dt>Depozit</dt><dd>{money(item.deposit ?? 0)} ₼</dd></div><div><dt>Minimum müddət</dt><dd>{item.min_days ?? 1} gün</dd></div>{item.rooms && <div><dt>Otaq sayı</dt><dd>{item.rooms}</dd></div>}{item.area_m2 && <div><dt>Sahə</dt><dd>{item.area_m2} m²</dd></div>}<div><dt>Sahibi</dt><dd>{item.owner_name || "İstifadəçi"} · {item.owner_email}</dd></div><div><dt>Baxış</dt><dd>{item.views || 0}</dd></div></dl>
            <p className="description">{item.description}</p>
            <p className="adminItemId">Elan № {item.listing_no ?? "təyin edilməyib"} · {adminDate(item.created_at)}<small> · Sistem ID: {item.id}</small></p>
            {item.rejection_reason && <p className="error">Əvvəlki səbəb: {item.rejection_reason}</p>}
            <ModerationReview key={`${item.id}-${revision}`} listingId={item.id} onInspect={inspect} /></details><details className="adminMore"><summary>Rədd səbəbi</summary>
            <label className="moderationPreset">Hazır rədd səbəbi<select aria-label="Hazır rədd səbəbi" value={rejectionReasons.includes(reasons[item.id] || "") ? reasons[item.id] : ""} onChange={event => { if (event.target.value) setReasons(current => ({ ...current, [item.id]: event.target.value })); }}><option value="">Səbəb seç və ya aşağıda özün yaz</option>{rejectionReasons.map(reason => <option key={reason} value={reason}>{reason}</option>)}</select></label>
            <label className="moderationReason">Rədd səbəbi<textarea aria-label="Rədd səbəbi" maxLength={500} rows={2} value={reasons[item.id] ?? ""} onChange={event => setReasons({ ...reasons, [item.id]: event.target.value })} placeholder="Elan sahibinə görünəcək səbəbi yazın." /></label></details>
            <div className="contactActions"><button disabled={!!busy || item.status === "published" || !["pending", "rejected"].includes(item.status)} className="add" onClick={() => void moderate(item, "published")}>{busy === item.id ? "Saxlanılır..." : "Təsdiqlə və yayımla"}</button><button disabled={!!busy || item.status === "rejected" || !["pending", "published"].includes(item.status)} className="secondary" onClick={() => void moderate(item, "rejected")}>Rədd et</button></div>
          </article>)}
          {total > PAGE && <nav className="pagination" aria-label="Admin elan səhifələri"><button className="secondary" disabled={page === 1 || !!busy} onClick={() => setPage(x => x - 1)}>Əvvəlki</button><span>{page}</span><button className="secondary" disabled={page * PAGE >= total || !!busy} onClick={() => setPage(x => x + 1)}>Növbəti</button></nav>}
        </>}
      </section>}
    </div>
  </div>;
}
