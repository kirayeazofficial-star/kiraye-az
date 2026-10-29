"use client";
import { FormEvent, ReactNode, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, RefreshCw, ChevronRight, Flag, History, Image, LayoutDashboard, List, ShieldCheck, SlidersHorizontal, Users, X, type LucideIcon } from "lucide-react";
import BannerManager from "./BannerManager";
import AzerbaijaniDateInput from "./AzerbaijaniDateInput";
import { adminDate, staffRoleName } from "../../lib/admin-display";
import { formatContact } from "../../lib/contact-mask";
import { categoryName, money, periodName, statusName, type Listing } from "../../lib/marketplace";
import { moderationActions, moderationFields, rejectionReasons, type ModerationContext, type ModerationEvent } from "../../lib/moderation";

type Section = "overview" | "moderation" | "reports" | "history" | "users" | "banners" | "staff";
type AdminListing = Listing & { listing_no?: number | string; owner_email: string; owner_name?: string; views?: number; review_kind?: string };
type Counts = { users: number; listings: number; messages: number; reports: number; statuses: Record<string, number> };
type Period = { today: number; week: number; month: number };
type Activity = { id: number; listing_id: string; action: string; new_status: string | null; reason: string | null; created_at: string; actor_name: string | null; title: string | null };
type User = { id: string; email: string; display_name: string; phone: string; profile_no: number; staff_role?: string; listing_count: number; created_at?: string };
type Report = { id: string; report_no: number | string; reason: string; message: string; status: string; created_at: string; resolved_at?: string | null; resolved_by?: string | null; listing_id: string; title: string; listing_no?: number | string; reporter_email?: string };
type Member = { id: string; name: string | null; email: string; phone?: string; profile_no?: number; role: string; confirmed?: boolean; assigned_at?: string | null };
type StaffEvent = { id: number; action: string; created_at: string; actor_email?: string | null; target_email?: string | null };

const PAGE = 24;
const sectionLabels: Record<Section, string> = { overview: "Ümumi baxış", moderation: "Elanlar", reports: "Şikayətlər", history: "Əməliyyatlar", users: "İstifadəçilər", banners: "Bannerlər", staff: "Komanda" };
const statuses: [string, string][] = [["pending", "Gözləmədə"], ["published", "Yayımlanıb"], ["rejected", "Rədd edilib"], ["archived", "Müddəti bitib"], ["all", "Hamısı"]];
const staffActions: Record<string, string> = { moderator_granted: "Admin təyin edildi", moderator_revoked: "Səlahiyyət geri alındı", leader_initialized: "Rəhbər təyin edildi", report_resolved: "Şikayətə baxıldı" };
const icons: Record<Section, LucideIcon> = { overview: LayoutDashboard, moderation: List, reports: Flag, history: History, users: Users, banners: Image, staff: ShieldCheck };

async function api(params: Record<string, string | number>) {
  const response = await fetch("/api/admin?" + new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])).toString(), { cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || "FAILED"), { status: response.status, code: data.error, detail: data.detail });
  return data;
}
async function post(payload: Record<string, unknown>) {
  const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || "FAILED"), { code: data.error, detail: data.detail });
  return data;
}
const renderValue = (value: unknown) => value === null || value === undefined || value === "" ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value);
const initial = (name?: string | null) => (name || "?").trim().charAt(0).toUpperCase() || "?";

function Panel({ title, actions, children, className }: { title: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`kzAdPanel${className ? " " + className : ""}`}><header className="kzAdPanelHead"><h2>{title}</h2>{actions && <div className="kzAdActions">{actions}</div>}</header>{children}</section>;
}
function Empty({ title, text }: { title: string; text?: string }) {
  return <div className="kzAdEmpty"><strong>{title}</strong>{text && <p>{text}</p>}</div>;
}

function EventList({ events, onInspect }: { events: ModerationEvent[]; onInspect?: (id: string) => void }) {
  return <ol className="kzAdTimeline">{events.map(event => <li key={event.id}>
    <div className="kzAdTimelineTop"><strong>{moderationActions[event.action] || event.action}</strong><time>{adminDate(event.created_at)}</time></div>
    <p>{event.actor_name || (event.actor_kind === "system" ? "Sistem" : event.actor_kind === "admin" ? "İdarəçi" : "Elan sahibi")}{(event.old_status || event.new_status) && <> · {event.old_status && <>{statusName(event.old_status)} <ArrowRight className="kzI" aria-hidden="true" size={13} strokeWidth={2.25} /> </>}{event.new_status ? statusName(event.new_status) : "Silinib"}</>}</p>
    {event.reason && <p className="kzAdReason">Səbəb: {event.reason}</p>}
    <div className="kzAdTimelineLinks">
      {onInspect && <button type="button" className="kzAdLink" onClick={() => onInspect(event.listing_id)}>Elanı aç</button>}
      {!!event.changed_fields?.length && event.before_values && event.after_values && <details><summary>Dəyişikliklər ({event.changed_fields.length})</summary><div className="kzAdChanges">{event.changed_fields.map(key => <div key={key}><strong>{moderationFields[key] || key}</strong><p><span>Əvvəl:</span> {renderValue(event.before_values?.[key])}</p><p><span>İndi:</span> {renderValue(event.after_values?.[key])}</p></div>)}</div></details>}
    </div>
  </li>)}</ol>;
}

function ModerationReview({ listingId, onInspect }: { listingId: string; onInspect: (id: string) => void }) {
  const [data, setData] = useState<ModerationContext | null>(null), [loading, setLoading] = useState(false), [error, setError] = useState("");
  async function load() {
    if (loading || data) return;
    setLoading(true); setError("");
    try { setData(await api({ action: "context", id: listingId }) as ModerationContext); }
    catch { setError("Yoxlama məlumatları yüklənmədi."); }
    finally { setLoading(false); }
  }
  return <details className="kzAdMore" onToggle={event => { if (event.currentTarget.open) void load(); }}><summary>Oxşarlar və sahibi</summary>
    <div className="kzAdMoreBody">
      {loading && <p className="kzAdMuted" role="status">Yüklənir…</p>}
      {error && <p className="kzAdError" role="alert">{error} <button className="kzAdLink" type="button" onClick={() => void load()}>Yenidən yoxla</button></p>}
      {data && <>
        <h4>Oxşar elanlar</h4>
        {!data.signals.length ? <p className="kzAdMuted">Uyğunluq tapılmadı.</p> : <ul className="kzAdPlain">{data.signals.map(signal => <li key={signal.id}><button type="button" className="kzAdLink" onClick={() => onInspect(signal.id)}>{signal.title}</button> <span className="kzAdMuted">· {[signal.same_phone && "eyni nömrə", signal.same_image && "eyni şəkil", signal.similar_text && "oxşar mətn"].filter(Boolean).join(", ")} · {statusName(signal.status)}</span></li>)}</ul>}
        <p className="kzAdHint">Son 180 gündəki elanlarla müqayisə edilir. Oxşarlıq qayda pozuntusunun sübutu deyil.</p>
        <h4>Elan sahibi</h4>
        <p>{data.owner.name || "Ad qeyd edilməyib"} · qeydiyyat: {adminDate(data.owner.joined_at)} · şikayətlər: {data.reports.open} açıq, {data.reports.resolved} baxılıb</p>
        {!!data.owner_listings.length && <ul className="kzAdPlain">{data.owner_listings.map(item => <li key={item.id}><button type="button" className="kzAdLink" onClick={() => onInspect(item.id)}>{item.title}</button> <span className="kzAdMuted">· {statusName(item.status)} · {adminDate(item.created_at)}</span></li>)}</ul>}
        <h4>Son əməliyyatlar</h4>
        {data.events.length ? <EventList events={data.events} /> : <p className="kzAdMuted">Qeyd yoxdur.</p>}
      </>}
    </div>
  </details>;
}

function ModerationHistory({ revision, onInspect }: { revision: number; onInspect: (id: string) => void }) {
  const [events, setEvents] = useState<ModerationEvent[]>([]), [cursor, setCursor] = useState<number | null>(null), [loading, setLoading] = useState(false), [error, setError] = useState("");
  const load = useCallback(async (before?: number | null) => {
    setLoading(true); setError("");
    try {
      const data = await api(before ? { action: "history", before } : { action: "history" });
      setEvents(old => before ? [...old, ...data.events] : data.events); setCursor(data.next);
    } catch { setError("Tarixçə yüklənmədi. Yenidən cəhd et."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load, revision]);
  return <Panel title="Əməliyyat tarixçəsi" actions={<button type="button" className="kzAdBtn kzAdIconBtn" aria-label="Yenilə" title="Yenilə" disabled={loading} onClick={() => void load()}><RefreshCw aria-hidden="true" size={16} strokeWidth={2} /></button>}>
    {error && <p className="kzAdError" role="alert">{error}</p>}
    {!events.length && !loading && !error ? <Empty title="Hələ qeyd yoxdur" /> : <EventList events={events} onInspect={onInspect} />}
    {cursor && <button type="button" className="kzAdBtn kzAdMoreBtn" disabled={loading} onClick={() => void load(cursor)}>Daha köhnə qeydlər</button>}
  </Panel>;
}

function ReportQueue({ onInspect, onChange }: { onInspect: (id: string) => void; onChange: () => void }) {
  const [search, setSearch] = useState(""), [query, setQuery] = useState(""), [from, setFrom] = useState("");
  const [reports, setReports] = useState<Report[]>([]), [error, setError] = useState(""), [busy, setBusy] = useState(""), [loading, setLoading] = useState(true), [tab, setTab] = useState("open"), [page, setPage] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setError("");
    api({ action: "reports", tab, query, from, page }).then(data => { if (active) setReports(data.items); }).catch(() => { if (active) setError("Şikayətləri yükləmək mümkün olmadı."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [tab, page, query, from]);
  async function resolve(id: string) {
    if (busy) return; setBusy(id);
    try { await post({ action: "resolve_report", id }); setReports(current => current.filter(item => item.id !== id)); onChange(); }
    catch { setError("Şikayətin vəziyyəti saxlanmadı."); } finally { setBusy(""); }
  }
  return <Panel title="Şikayətlər">
    <div className="kzAdTabs" role="group" aria-label="Şikayət bölmələri">{[["open", "Açıq"], ["resolved", "Arxiv"]].map(([key, label]) => <button key={key} type="button" aria-pressed={tab === key} onClick={() => { setTab(key); setPage(0); }}>{label}</button>)}</div>
    <form className="kzAdFilters" onSubmit={event => { event.preventDefault(); setQuery(search.trim()); setPage(0); }}>
      <input aria-label="Şikayət nömrəsi" inputMode="numeric" pattern="[0-9]{8,18}" value={search} onChange={event => setSearch(event.target.value)} placeholder="Şikayət №, məs. 20000001" />
      <AzerbaijaniDateInput label="Şikayət tarixi" value={from} onChange={value => { setFrom(value); setPage(0); }} />
      <button className="kzAdBtn primary">Axtar</button>
    </form>
    {error && <p className="kzAdError" role="alert">{error}</p>}
    {loading ? <p className="kzAdMuted" role="status">Yüklənir…</p> : !reports.length ? <Empty title={tab === "open" ? "Açıq şikayət yoxdur" : "Arxiv boşdur"} text={tab === "open" ? "Yeni şikayət gələndə burada görünəcək." : undefined} /> : <div className="kzAdList">{reports.map(report => <article className="kzAdRow kzAdReport" key={report.id}>
      <div className="kzAdRowMain">
        <div className="kzAdRowTop"><span className="kzAdPill warn">{report.reason}</span><span className="kzAdMuted">№ {report.report_no} · {adminDate(report.created_at)}</span></div>
        <h3>{report.title}</h3>
        <p className="kzAdQuote">{report.message}</p>
        <p className="kzAdMuted">Elan № {report.listing_no ?? "—"}{report.reporter_email ? ` · göndərən: ${report.reporter_email}` : ""}{tab === "resolved" ? ` · baxılıb: ${adminDate(report.resolved_at)}` : ""}</p>
      </div>
      <div className="kzAdRowActions">
        <button type="button" className="kzAdBtn" onClick={() => onInspect(report.listing_id)}>Elanı yoxla</button>
        <Link className="kzAdBtn" href={`/listings/${report.listing_id}`} target="_blank">Elana bax</Link>
        {tab === "open" && <button type="button" className="kzAdBtn primary" disabled={!!busy} onClick={() => void resolve(report.id)}>{busy === report.id ? "Saxlanılır…" : "Baxıldı"}</button>}
      </div>
    </article>)}</div>}
    {(page > 0 || reports.length >= 50) && <nav className="kzAdPager" aria-label="Şikayət səhifələri"><button type="button" className="kzAdBtn" disabled={!page || loading} onClick={() => setPage(page - 1)}><ChevronLeft className="kzI kzIL" aria-hidden="true" size={16} strokeWidth={2.25} />Əvvəlki</button><span>{page + 1}</span><button type="button" className="kzAdBtn" disabled={reports.length < 50 || loading} onClick={() => setPage(page + 1)}>Növbəti<ChevronRight className="kzI kzIR" aria-hidden="true" size={16} strokeWidth={2.25} /></button></nav>}
  </Panel>;
}

function UserList({ revision, onListings }: { revision: number; onListings: (user: User) => void }) {
  const [query, setQuery] = useState(""), [users, setUsers] = useState<User[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState("");
  useEffect(() => {
    let active = true; setLoading(true);
    const timer = setTimeout(() => api({ action: "users", query }).then(data => { if (active) { setUsers(data.items); setError(""); } }).catch(() => { if (active) setError("İstifadəçilər yüklənmədi."); }).finally(() => { if (active) setLoading(false); }), 250);
    return () => { active = false; clearTimeout(timer); };
  }, [query, revision]);
  return <Panel title="İstifadəçilər" actions={<span className="kzAdMuted">{users.length >= 100 ? "Son 100 hesab" : `${users.length} hesab`}</span>}>
    <div className="kzAdFilters kzAdInline"><input type="text" inputMode="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Ad, e-poçt, telefon, №" aria-label="İstifadəçi axtar" /></div>
    {error && <p className="kzAdError" role="alert">{error}</p>}
    {loading && !users.length ? <p className="kzAdMuted" role="status">Yüklənir…</p> : !users.length ? <Empty title="İstifadəçi tapılmadı" /> : <div className="kzAdTable kzAdUsers" role="table" aria-label="İstifadəçilər">
      <div className="kzAdTableHead" role="row"><span>Ad</span><span>Əlaqə</span><span>Elan</span><span>Qeydiyyat</span><span>Rol</span><span /></div>
      {users.map(user => <div className="kzAdTableRow" role="row" key={user.id}>
        <span className="kzAdPerson"><b aria-hidden="true">{initial(user.display_name || user.email)}</b><span><strong>{user.display_name || "Adsız istifadəçi"}</strong><small>#{user.profile_no}</small></span></span>
        <span className="kzAdContact"><span>{user.email}</span><small>{user.phone ? formatContact(user.phone) : "Telefon yoxdur"}</small></span>
        <span className="kzAdNum" data-label="Elan">{user.listing_count}</span>
        <span data-label="Qeydiyyat">{user.created_at ? adminDate(user.created_at).split(",")[0] : "—"}</span>
        <span>{user.staff_role ? <em className={`kzAdPill${user.staff_role === "leader" ? " strong" : ""}`}>{user.staff_role === "leader" ? "Rəhbər" : "Admin"}</em> : <span className="kzAdMuted">İstifadəçi</span>}</span>
        <span className="kzAdRowEnd"><button type="button" className="kzAdBtn small" disabled={!user.listing_count} onClick={() => onListings(user)}>Elanları</button></span>
      </div>)}
    </div>}
  </Panel>;
}

function StaffManagement() {
  const [members, setMembers] = useState<Member[]>([]), [events, setEvents] = useState<StaffEvent[]>([]), [cursor, setCursor] = useState<number | null>(null);
  const [query, setQuery] = useState(""), [found, setFound] = useState<Member | null>(null), [matches, setMatches] = useState<Member[]>([]), [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const load = useCallback(async () => { const data = await api({ action: "staff" }); setMembers(data.members); setEvents(data.events); setCursor(data.next); }, []);
  useEffect(() => { load().catch(failure => setError(`Admin siyahısı yüklənmədi.${(failure as { detail?: string }).detail ? ` Texniki kod: ${(failure as { detail?: string }).detail}` : ""}`)); }, [load]);
  async function older() {
    if (busy || !cursor) return; setBusy(true); setError("");
    try { const data = await api({ action: "staff", before: cursor }); setEvents(old => [...old, ...data.events]); setCursor(data.next); } catch { setError("Köhnə qeydlər yüklənmədi."); } finally { setBusy(false); }
  }
  async function find(event: FormEvent) {
    event.preventDefault(); if (busy) return; setBusy(true); setError(""); setNotice(""); setFound(null); setMatches([]);
    try { const data = await api({ action: "find", query: query.trim() }); if (data.account) setFound(data.account); else setMatches(data.accounts || []); }
    catch (failure) { const { code, detail } = failure as { code?: string; detail?: string }; setError(code === "NOT_FOUND" ? "Bu məlumatla hesab tapılmadı. Hesab əvvəl saytda qeydiyyatdan keçməlidir." : code === "INVALID_REQUEST" ? "Ən azı 3 simvol yaz." : `Axtarış alınmadı.${detail ? ` Texniki kod: ${detail}` : ""}`); }
    finally { setBusy(false); }
  }
  async function change(account: Member, enabled: boolean) {
    if (busy) return; setBusy(true); setError(""); setNotice("");
    try { await post({ action: "set_staff", id: account.id, enabled }); setFound(null); setMatches([]); setQuery(""); setNotice(enabled ? "Admin təyin edildi." : "Səlahiyyət geri alındı."); await load(); }
    catch (failure) { const { code, detail } = failure as { code?: string; detail?: string }; setError(code === "EMAIL_NOT_CONFIRMED" ? "Bu hesabın e-poçtu təsdiqlənməyib. İstifadəçi əvvəl e-poçtunu təsdiqləməlidir." : code === "LEADER_PROTECTED" ? "Rəhbərin səlahiyyəti dəyişdirilmir." : `Səlahiyyət dəyişdirilmədi.${detail ? ` Texniki kod: ${detail}` : ""}`); }
    finally { setBusy(false); }
  }
  const person = (account: Member, action?: ReactNode) => <article className="kzAdRow" key={account.id}>
    <div className="kzAdPerson"><b aria-hidden="true">{initial(account.name || account.email)}</b><span><strong>{account.name || account.email}<em className={`kzAdPill${account.role === "leader" ? " strong" : ""}`}>{staffRoleName(account.role)}</em></strong><small>#{account.profile_no || "—"} · {account.email}{account.phone ? ` · ${formatContact(account.phone)}` : ""}</small>{account.assigned_at && account.role !== "leader" && <small>Admin təyin edilib: {adminDate(account.assigned_at)}</small>}</span></div>
    {action && <div className="kzAdRowActions">{action}</div>}
  </article>;
  return <Panel title="Komanda">
    <h3 className="kzAdSub">Üzvlər ({members.length})</h3>
    <div className="kzAdList">{members.map(account => person(account, account.role === "moderator" ? <button className="kzAdBtn danger" type="button" disabled={busy} onClick={() => void change(account, false)}>Geri al</button> : undefined))}</div>
    {!members.some(account => account.role === "moderator") && <p className="kzAdHint">Hələ heç kimə admin səlahiyyəti verilməyib. Komandada yalnız siz — Rəhbər varsınız.</p>}
    <h3 className="kzAdSub">Yeni admin təyin et</h3>
    <p className="kzAdHint">İstifadəçinin e-poçtunu, telefonunu, adını və ya profil nömrəsini yazıb hesabını tapın. Admin elanları yoxlaya və şikayətlərə baxa bilər; admin təyin etmək və geri almaq yalnız Rəhbərin işidir.</p>
    <form className="kzAdFilters kzAdInline" onSubmit={event => void find(event)}><input aria-label="Telefon, e-poçt və ya hesab nömrəsi" value={query} onChange={event => { setQuery(event.target.value); setFound(null); setMatches([]); }} maxLength={254} placeholder="E-poçt, telefon, ad və ya №" minLength={3} required /><button className="kzAdBtn primary" disabled={busy}>Hesabı tap</button></form>
    {error && <p className="kzAdError" role="alert">{error}</p>}{notice && <p className="kzAdNotice" role="status">{notice}</p>}
    {found && <div className="kzAdFound">{person(found, found.role === "user" ? <button className="kzAdBtn primary" type="button" disabled={busy || !found.confirmed} onClick={() => void change(found, true)}>{found.confirmed ? "Admin təyin et" : "E-poçt təsdiqlənməyib"}</button> : found.role === "moderator" ? <button className="kzAdBtn danger" type="button" disabled={busy} onClick={() => void change(found, false)}>Səlahiyyəti geri al</button> : undefined)}</div>}
    {!!matches.length && <div className="kzAdFound"><p className="kzAdHint">{matches.length} hesab tapıldı. Lazım olanı seçin:</p><div className="kzAdList">{matches.map(account => person(account, account.role === "user" ? <button className="kzAdBtn" type="button" onClick={() => { setFound(account); setMatches([]); }}>Seç</button> : undefined))}</div></div>}
    <h3 className="kzAdSub">Son dəyişikliklər</h3>
    {!events.length ? <p className="kzAdHint">Hələ heç bir dəyişiklik olmayıb.</p> : <ol className="kzAdTimeline kzAdChanges">{events.map(event => <li key={event.id}><div className="kzAdTimelineTop"><strong>{staffActions[event.action] || event.action}</strong><time>{adminDate(event.created_at)}</time></div><p>{event.target_email || "—"}{event.actor_email && <small> · {event.actor_email} tərəfindən</small>}</p></li>)}</ol>}
    {cursor && <button type="button" className="kzAdBtn" disabled={busy} onClick={() => void older()}>Daha köhnə qeydlər</button>}
  </Panel>;
}

export default function AdminWorkspace() {
  const [allowed, setAllowed] = useState<boolean | null>(null), [role, setRole] = useState(""), [section, setSection] = useState<Section>("overview");
  const [filter, setFilter] = useState("pending"), [items, setItems] = useState<AdminListing[]>([]), [total, setTotal] = useState(0), [page, setPage] = useState(1);
  const [search, setSearch] = useState(""), [query, setQuery] = useState(""), [dateFrom, setDateFrom] = useState(""), [reviewKind, setReviewKind] = useState(""), [owner, setOwner] = useState<{ id: string; name: string } | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({}), [rejecting, setRejecting] = useState(""), [revision, setRevision] = useState(0), [loading, setLoading] = useState(false), [busy, setBusy] = useState(""), [error, setError] = useState("");
  const [moreFilters, setMoreFilters] = useState(false);
  const [counts, setCounts] = useState<Counts | null>(null), [periods, setPeriods] = useState<{ users: Period; listings: Period } | null>(null), [activity, setActivity] = useState<Activity[]>([]);

  useEffect(() => { api({ action: "access" }).then(data => { setAllowed(true); setRole(data.role); }).catch(() => setAllowed(false)); }, []);
  useEffect(() => {
    if (!allowed || section !== "moderation") return;
    let active = true; setLoading(true); setError("");
    api({ action: "listings", status: filter, query, page, from: dateFrom, kind: reviewKind, owner: owner?.id || "" }).then(data => {
      if (!active) return;
      const maxPage = Math.max(1, Math.ceil(data.total / PAGE));
      if (page > maxPage) { setPage(maxPage); return; }
      setItems(data.items); setTotal(data.total);
    }).catch(() => { if (active) setError("Məlumatları yükləmək mümkün olmadı. Yenidən cəhd edin."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [allowed, section, filter, query, page, revision, dateFrom, reviewKind, owner]);
  useEffect(() => {
    if (!allowed) return;
    api({ action: "overview" }).then(data => { setCounts(data.counts); setPeriods(data.periods || null); setActivity(data.activity || []); }).catch(() => {});
  }, [allowed, revision]);

  async function moderate(item: AdminListing, status: "published" | "rejected") {
    if (busy || loading) return;
    const reason = reasons[item.id]?.trim() || "";
    if (status === "rejected" && reason.length < 10) { setRejecting(item.id); return; }
    setBusy(item.id); setError("");
    try {
      await post({ action: "moderate", id: item.id, status, from: item.status, reason });
      setReasons(current => { const next = { ...current }; delete next[item.id]; return next; });
      setRejecting("");
      setRevision(value => value + 1);
    } catch { setError("Dəyişiklik saxlanmadı. Siyahını yenilə və yenidən yoxla."); }
    finally { setBusy(""); }
  }
  function open(next: Section) { setSection(next); setError(""); window.scrollTo({ top: 0 }); }
  function clearFilters() { setSearch(""); setQuery(""); setDateFrom(""); setReviewKind(""); setOwner(null); setPage(1); }
  function showListings(status: string) { clearFilters(); setFilter(status); open("moderation"); }
  function ownerListings(user: User) { clearFilters(); setOwner({ id: user.id, name: user.display_name || user.email }); setFilter("all"); open("moderation"); }
  function inspect(id: string) { clearFilters(); setFilter("all"); setSearch(id); setQuery(id); open("moderation"); }
  function find(event: FormEvent) { event.preventDefault(); setPage(1); setQuery(search.trim()); }

  if (allowed === null) return <p className="kzAdMuted" role="status">İcazə yoxlanılır…</p>;
  if (allowed === false) return <div className="kzAdPanel"><Empty title="Bu bölmə yalnız idarəçilər üçündür" text="Admin icazəsi olan hesabla daxil ol." /><div className="kzAdCenter"><Link className="kzAdBtn primary" href="/login?next=/admin">Daxil ol</Link><Link className="kzAdBtn" href="/profile">Kabinetə qayıt</Link></div></div>;
  const sections = (Object.keys(sectionLabels) as Section[]).filter(item => item !== "history" && (item !== "staff" || role === "leader"));
  const pending = counts?.statuses?.pending || 0, openReports = counts?.reports || 0;
  const badge = (item: Section) => item === "moderation" ? pending : item === "reports" ? openReports : 0;
  const menuNote = (item: Section): { text: string; alert?: boolean } =>
    item === "moderation" ? (pending ? { text: `${pending} elan yoxlama gözləyir`, alert: true } : { text: "Yoxlanılacaq elan yoxdur" })
    : item === "reports" ? (openReports ? { text: `${openReports} açıq şikayət`, alert: true } : { text: "Açıq şikayət yoxdur" })
    : item === "users" ? { text: counts ? `${counts.users} istifadəçi` : "Hesablar və bloklama" }
    : item === "banners" ? { text: "Reklam bannerləri" }
    : { text: "Rəhbər və adminlər" };

  return <div className="kzAdm">
    <nav className="kzAdNav" aria-label="Panel bölmələri">
      {sections.map(item => <button key={item} type="button" aria-pressed={section === item} onClick={() => open(item)}>{(() => { const SectionIcon = icons[item]; return <SectionIcon aria-hidden="true" size={20} strokeWidth={1.75} />; })()}<span>{sectionLabels[item]}</span>{!!badge(item) && <b>{badge(item)}</b>}</button>)}
      <Link className="kzAdNavBack" href="/profile"><ChevronLeft className="kzI kzIL" aria-hidden="true" size={16} strokeWidth={2.25} />Şəxsi kabinet</Link>
    </nav>
    <div className="kzAdContent">
      {section !== "overview" && <button type="button" className="kzAdBack" onClick={() => open(section === "history" ? "moderation" : "overview")}><ChevronLeft aria-hidden="true" size={20} strokeWidth={2} />{section === "history" ? "Elanlar" : "Panel"}</button>}
      {error && <p className="kzAdError" role="alert">{error}</p>}

      {section === "overview" && <>
        <nav className="kzAdMenu" aria-label="Panel bölmələri">
          {sections.filter(item => item !== "overview").map(item => { const SectionIcon = icons[item]; const note = menuNote(item); return <button key={item} type="button" className={`tone-${item}`} onClick={() => open(item)}>
            <span className="kzAdMenuIcon"><SectionIcon aria-hidden="true" size={20} strokeWidth={1.9} /></span>
            <span className="kzAdMenuText"><strong>{sectionLabels[item]}</strong><small className={note.alert ? "alert" : ""}>{note.text}</small></span>
            {!!badge(item) && <b>{badge(item)}</b>}
            <ChevronRight className="kzAdMenuArrow" aria-hidden="true" size={18} strokeWidth={2} />
          </button>; })}
        </nav>
        <Panel title="Görüləcək işlər" className="kzAdTodoPanel">
          <div className="kzAdTodo">
            <button type="button" className={pending ? "attention" : ""} onClick={() => showListings("pending")}><b>{pending}</b><span>{pending ? "elan yoxlama gözləyir" : "yoxlanılacaq elan yoxdur"}</span><em>Bax<ChevronRight className="kzI kzIR" aria-hidden="true" size={16} strokeWidth={2.25} /></em></button>
            <button type="button" className={openReports ? "warn" : ""} onClick={() => open("reports")}><b>{openReports}</b><span>{openReports ? "açıq şikayət" : "açıq şikayət yoxdur"}</span><em>Bax<ChevronRight className="kzI kzIR" aria-hidden="true" size={16} strokeWidth={2.25} /></em></button>
          </div>
        </Panel>
        <Panel title="Statistika" actions={<button type="button" className="kzAdBtn kzAdIconBtn" aria-label="Yenilə" title="Yenilə" onClick={() => setRevision(x => x + 1)}><RefreshCw aria-hidden="true" size={16} strokeWidth={2} /></button>}>
          <div className="kzAdKpis">
            <button type="button" onClick={() => showListings("published")}><b>{counts?.statuses?.published ?? "—"}</b><span>Yayımda olan elan</span></button>
            <button type="button" onClick={() => showListings("all")}><b>{counts?.listings ?? "—"}</b><span>Cəmi elan</span></button>
            <button type="button" onClick={() => open("users")}><b>{counts?.users ?? "—"}</b><span>İstifadəçi</span></button>
            <div><b>{counts?.messages ?? "—"}</b><span>Mesaj</span></div>
          </div>
          <table className="kzAdPeriods">
            <thead><tr><th scope="col">Yeni</th><th scope="col">Bu gün</th><th scope="col">7 gün</th><th scope="col">30 gün</th></tr></thead>
            <tbody>
              <tr><th scope="row">İstifadəçi</th><td>{periods?.users.today ?? "—"}</td><td>{periods?.users.week ?? "—"}</td><td>{periods?.users.month ?? "—"}</td></tr>
              <tr><th scope="row">Elan</th><td>{periods?.listings.today ?? "—"}</td><td>{periods?.listings.week ?? "—"}</td><td>{periods?.listings.month ?? "—"}</td></tr>
            </tbody>
          </table>
        </Panel>
        <Panel title="Son fəaliyyətlər" actions={<button type="button" className="kzAdBtn" onClick={() => open("history")}>Hamısı</button>}>
          {!activity.length ? <Empty title="Hələ qərar verilməyib" text="Təsdiq və rədd qərarları burada görünəcək." /> : <ul className="kzAdActivity">{activity.map(item => <li key={item.id}>
            <span className={`kzAdDot ${item.new_status || ""}`} aria-hidden="true" />
            <div><p><strong>{item.actor_name || "İdarəçi"}</strong> · {moderationActions[item.action] || item.action}{item.new_status ? ` — ${statusName(item.new_status)}` : ""}</p>
              <button type="button" className="kzAdLink" onClick={() => inspect(item.listing_id)}>{item.title || "Silinmiş elan"}</button>
              {item.reason && <p className="kzAdReason">Səbəb: {item.reason}</p>}</div>
            <time>{adminDate(item.created_at)}</time>
          </li>)}</ul>}
        </Panel>

      </>}

      {section === "moderation" && <Panel title="Elanlar" actions={<><button type="button" className="kzAdBtn" onClick={() => open("history")}><History aria-hidden="true" size={15} strokeWidth={2} />Tarixçə</button><button type="button" className="kzAdBtn kzAdIconBtn" aria-label="Yenilə" title="Yenilə" disabled={loading || !!busy} onClick={() => setRevision(x => x + 1)}><RefreshCw aria-hidden="true" size={16} strokeWidth={2} /></button></>}>
        <div className="kzAdTabs" role="group" aria-label="Elan vəziyyəti">{statuses.map(([status, label]) => <button key={status} type="button" aria-pressed={filter === status} disabled={!!busy} onClick={() => { setFilter(status); setPage(1); }}>{label}{counts && <small>{status === "all" ? counts.listings : status === "archived" ? (counts.statuses.archived || 0) + (counts.statuses.expired || 0) : counts.statuses[status] || 0}</small>}</button>)}</div>
        <form className="kzAdFilters" onSubmit={find}>
          <input type="text" inputMode="search" value={search} onChange={event => setSearch(event.target.value)} maxLength={100} placeholder="Başlıq, telefon, № elan" aria-label="Elan axtar" />
          <button type="button" className="kzAdBtn kzAdFilterToggle" aria-expanded={moreFilters} onClick={() => setMoreFilters(value => !value)}><SlidersHorizontal aria-hidden="true" size={16} strokeWidth={2} /></button>
          <span className={`kzAdExtra${moreFilters ? " open" : ""}`}>
          <AzerbaijaniDateInput label="Elanın tarixi" value={dateFrom} onChange={value => { setDateFrom(value); setPage(1); }} />
          <select aria-label="Yoxlama növü" value={reviewKind} onChange={event => { setReviewKind(event.target.value); setPage(1); }}><option value="">Hamısı</option><option value="new">Yeni</option><option value="edited">Dəyişdirilmiş</option></select>
          </span>
          <button className="kzAdBtn primary" disabled={!!busy}>Axtar</button>
        </form>
        {(query || dateFrom || reviewKind || owner) && <div className="kzAdActive" aria-label="Aktiv filtrlər">
          <span>Filtr:</span>
          {owner && <button type="button" onClick={() => { setOwner(null); setPage(1); }}>Sahibi: {owner.name} <X aria-hidden="true" size={13} strokeWidth={2.25} /></button>}
          {query && <button type="button" onClick={() => { setSearch(""); setQuery(""); setPage(1); }}>{/^[0-9a-f-]{36}$/i.test(query) ? "Seçilmiş elan" : `Axtarış: ${query}`} <X aria-hidden="true" size={13} strokeWidth={2.25} /></button>}
          {dateFrom && <button type="button" onClick={() => { setDateFrom(""); setPage(1); }}>Tarix: {dateFrom.split("-").reverse().join(".")} <X aria-hidden="true" size={13} strokeWidth={2.25} /></button>}
          {reviewKind && <button type="button" onClick={() => { setReviewKind(""); setPage(1); }}>{reviewKind === "new" ? "Yeni elanlar" : "Dəyişdirilmiş"} <X aria-hidden="true" size={13} strokeWidth={2.25} /></button>}
          <button type="button" className="kzAdLink" onClick={clearFilters}>Filtrləri təmizlə</button>
        </div>}
        {loading ? <p className="kzAdMuted" role="status">Yüklənir…</p> : <>
          <p className="kzAdMuted kzAdCount">{(query || dateFrom || reviewKind || owner) ? "Filtrə uyğun: " : ""}{total} elan{total > PAGE ? ` · səhifə ${page} / ${Math.ceil(total / PAGE)}` : ""}</p>
          {!items.length ? <Empty title={filter === "pending" && !query ? "Yoxlanılacaq elan yoxdur" : "Elan tapılmadı"} text={filter === "pending" && !query ? "Hamısı baxılıb. Yeni elan gələndə burada görünəcək." : "Başqa vəziyyət seç və ya axtarışı dəyiş."} /> : <div className="kzAdList">{items.map(item => <article className="kzAdRow kzAdListing" key={item.id}>
            <a className="kzAdThumb" href={`/listings/${item.id}`} target="_blank" rel="noopener noreferrer">{item.images?.[0] ? <img src={item.images[0]} alt="" loading="lazy" /> : null}{(item.images?.length || 0) > 1 && <small>{item.images.length}</small>}</a>
            <div className="kzAdRowMain">
              <div className="kzAdRowTop"><span className={`status ${item.status}`}>{statusName(item.status)}</span>{item.status === "pending" && item.review_kind === "edited" && <span className="kzAdPill warn">Dəyişdirilib</span>}<span className="kzAdMuted">{categoryName(item.category)}</span></div>
              <h3>{item.title}</h3>
              <p><strong>{money(item.price)} ₼</strong> / {periodName(item.rental_period)} · {item.city}{item.district && `, ${item.district}`}</p>
              <p className="kzAdMuted">№ {item.listing_no ?? "—"} · {adminDate(item.created_at)}</p><p className="kzAdMuted kzAdOwnerLine">{item.owner_name || "İstifadəçi"}{item.contact ? ` · ${formatContact(item.contact)}` : ""}</p>
              {item.rejection_reason && <p className="kzAdReason">Əvvəlki səbəb: {item.rejection_reason}</p>}
            </div>
            <div className="kzAdRowActions">
              <button type="button" className="kzAdBtn success" disabled={!!busy || !["pending", "rejected"].includes(item.status)} onClick={() => void moderate(item, "published")}>{busy === item.id ? "Saxlanılır…" : "Təsdiqlə"}</button>
              <button type="button" className="kzAdBtn danger" disabled={!!busy || !["pending", "published"].includes(item.status)} onClick={() => setRejecting(rejecting === item.id ? "" : item.id)}>Rədd et</button>
            </div>
            {rejecting === item.id && <div className="kzAdReject">
              <label>Səbəb<select value={rejectionReasons.includes(reasons[item.id] || "") ? reasons[item.id] : ""} onChange={event => setReasons(current => ({ ...current, [item.id]: event.target.value }))}><option value="">Hazır səbəb seç və ya aşağıda yaz</option>{rejectionReasons.map(reason => <option key={reason} value={reason}>{reason}</option>)}</select></label>
              <textarea aria-label="Rədd səbəbi" maxLength={500} rows={2} value={reasons[item.id] ?? ""} onChange={event => setReasons({ ...reasons, [item.id]: event.target.value })} placeholder="Elan sahibinə görünəcək səbəb (ən azı 10 simvol)" />
              <div className="kzAdCenter start"><button type="button" className="kzAdBtn danger solid" disabled={!!busy || (reasons[item.id]?.trim().length || 0) < 10} onClick={() => void moderate(item, "rejected")}>Rədd et</button><button type="button" className="kzAdBtn" onClick={() => setRejecting("")}>Ləğv et</button></div>
            </div>}
            <div className="kzAdRowMore">
              <details className="kzAdMore"><summary>Ətraflı</summary><div className="kzAdMoreBody">
                {(item.images?.length || 0) > 0 && <div className="kzAdGallery">{item.images.map(src => <a key={src} href={src} target="_blank" rel="noopener noreferrer"><img src={src} alt="" loading="lazy" /></a>)}</div>}
                <dl className="kzAdFacts"><div><dt>Kateqoriya</dt><dd>{categoryName(item.category)}</dd></div><div><dt>Əlaqə</dt><dd>{item.contact ? formatContact(item.contact) : "—"}</dd></div><div><dt>Depozit</dt><dd>{money(item.deposit ?? 0)} ₼</dd></div><div><dt>Minimum müddət</dt><dd>{item.min_days ?? 1} gün</dd></div>{item.rooms && <div><dt>Otaq</dt><dd>{item.rooms}</dd></div>}{item.area_m2 && <div><dt>Sahə</dt><dd>{item.area_m2} m²</dd></div>}<div><dt>Sahibi</dt><dd>{item.owner_name || "İstifadəçi"} · {item.owner_email}</dd></div><div><dt>Baxış</dt><dd>{item.views || 0}</dd></div></dl>
                <p className="kzAdDescription">{item.description}</p>
                <p className="kzAdMuted">Sistem ID: {item.id}</p>
              </div></details>
              <ModerationReview key={`${item.id}-${revision}`} listingId={item.id} onInspect={inspect} />
            </div>
          </article>)}</div>}
          {total > PAGE && <nav className="kzAdPager" aria-label="Elan səhifələri"><button type="button" className="kzAdBtn" disabled={page === 1 || !!busy} onClick={() => setPage(x => x - 1)}><ChevronLeft className="kzI kzIL" aria-hidden="true" size={16} strokeWidth={2.25} />Əvvəlki</button><span>{page} / {Math.ceil(total / PAGE)}</span><button type="button" className="kzAdBtn" disabled={page * PAGE >= total || !!busy} onClick={() => setPage(x => x + 1)}>Növbəti<ChevronRight className="kzI kzIR" aria-hidden="true" size={16} strokeWidth={2.25} /></button></nav>}
        </>}
      </Panel>}

      {section === "reports" && <ReportQueue onInspect={inspect} onChange={() => setRevision(x => x + 1)} />}
      {section === "history" && <ModerationHistory revision={revision} onInspect={inspect} />}
      {section === "banners" && <BannerManager />}
      {section === "users" && <UserList revision={revision} onListings={ownerListings} />}
      {section === "staff" && role === "leader" && <StaffManagement />}
    </div>
  </div>;
}
