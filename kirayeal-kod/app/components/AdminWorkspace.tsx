"use client";
import { FormEvent, ReactNode, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowRight, Ban, Store, Check, Eye, Unlink, CircleCheck, Clock, CloudUpload, Database, ExternalLink, HardDrive, Images, LoaderCircle, TriangleAlert, ChevronLeft, RefreshCw, ChevronRight, CreditCard, FileCode, Flag, ListChecks, UserRound, History, Image, LayoutDashboard, List, ShieldCheck, SlidersHorizontal, Users, X, type LucideIcon } from "lucide-react";
import BannerManager from "./BannerManager";
import PhotoOrganizer, { type ListingPhoto } from "./PhotoOrganizer";
import AzerbaijaniDateInput from "./AzerbaijaniDateInput";
import { adminDate, staffRoleName } from "../../lib/admin-display";
import { formatContact } from "../../lib/contact-mask";
import { categories, categoryName, money, periodName, statusName, type Listing } from "../../lib/marketplace";
import { cleanLimitRules, limitGroups, type LimitRules } from "../../lib/limit-rules";
import { moderationActions, moderationFields, rejectionReasons, riskWords, type ModerationContext, type ModerationEvent } from "../../lib/moderation";
import { useAutoClear } from "../../lib/use-auto-clear";

type Section = "overview" | "moderation" | "reports" | "history" | "users" | "banners" | "staff" | "backup" | "stores" | "limits";
type AdminListing = Listing & { listing_no?: number | string; owner_email: string; owner_name?: string; views?: number; review_kind?: string; signal_count?: number };
type Counts = { users: number; listings: number; messages: number; reports: number; stores?: number; statuses: Record<string, number> };
type Period = { today: number; week: number; month: number };
type Activity = { id: number; listing_id: string; action: string; new_status: string | null; reason: string | null; created_at: string; actor_name: string | null; title: string | null };
type User = { id: string; email: string; display_name: string; phone: string; profile_no: number; staff_role?: string; listing_count: number; created_at?: string; blocked?: boolean; blocked_reason?: string | null };
type Report = { id: string; report_no: number | string; reason: string; message: string; status: string; created_at: string; resolved_at?: string | null; resolved_by?: string | null; listing_id: string; title: string; listing_no?: number | string; reporter_email?: string };
type Member = { id: string; name: string | null; email: string; phone?: string; profile_no?: number; role: string; confirmed?: boolean; assigned_at?: string | null };
type StaffEvent = { id: number; action: string; created_at: string; actor_email?: string | null; target_email?: string | null };

const PAGE = 24;
const sectionLabels: Record<Section, string> = { overview: "Ümumi baxış", moderation: "Elanlar", reports: "Şikayətlər", history: "Əməliyyatlar", users: "İstifadəçilər", banners: "Bannerlər", stores: "Mağazalar", limits: "Ödəniş və limitlər", staff: "Komanda", backup: "Ehtiyat nüsxə" };
const statuses: [string, string][] = [["pending", "Gözləmədə"], ["published", "Yayımlanıb"], ["rejected", "Rədd edilib"], ["archived", "Müddəti bitib"], ["all", "Hamısı"]];
const staffActions: Record<string, string> = { moderator_granted: "Admin təyin edildi", user_blocked: "İstifadəçi bloklandı", user_unblocked: "Blok götürüldü", moderator_revoked: "Səlahiyyət geri alındı", leader_initialized: "Rəhbər təyin edildi", report_resolved: "Şikayətə baxıldı" };
const icons: Record<Section, LucideIcon> = { overview: LayoutDashboard, moderation: List, reports: Flag, history: History, users: Users, banners: Image, stores: Store, limits: SlidersHorizontal, staff: ShieldCheck, backup: CloudUpload };

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

// Everything a moderator needs about one listing, in one sheet (bottom sheet on phones):
// the listing itself, similar listings by other accounts, and the owner.
function ReviewSheet({ item, onClose, onInspect, onSaved, onDecide, onNext, position }: { item: AdminListing; onClose: () => void; onInspect: (id: string) => void; onSaved: () => void; onDecide?: (status: "published" | "rejected", reason: string) => Promise<boolean>; onNext?: () => void; position?: string }) {
  // Decide right here: approve, or reject with one tap on a ready reason; then the next listing opens.
  const [rejectOpen, setRejectOpen] = useState(false), [reason, setReason] = useState(""), [deciding, setDeciding] = useState(false), [decideError, setDecideError] = useState("");
  useEffect(() => { setRejectOpen(false); setReason(""); setDecideError(""); }, [item.id]);
  async function decide(status: "published" | "rejected", why = "") {
    if (!onDecide || deciding) return;
    setDeciding(true); setDecideError("");
    const ok = await onDecide(status, why);
    setDeciding(false);
    if (!ok) { setDecideError("Saxlanmadı. Yenidən cəhd edin."); return; }
    if (onNext) onNext(); else onClose();
  }
  const [tab, setTab] = useState<"listing" | "similar" | "owner">("listing");
  const [data, setData] = useState<ModerationContext | null>(null), [error, setError] = useState("");
  const load = useCallback(() => { setError(""); api({ action: "context", id: item.id }).then(result => setData(result as ModerationContext)).catch(() => setError("Məlumat yüklənmədi.")); }, [item.id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", close); document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", close); document.body.style.overflow = ""; };
  }, [onClose]);
  const others = data?.signals.filter(signal => signal.owner_id !== data.owner.id) || [];
  const reasons = (signal: ModerationContext["signals"][number]) => [signal.same_phone && "Eyni telefon", signal.same_image && "Eyni şəkil", signal.similar_text && "Oxşar mətn"].filter(Boolean) as string[];
  const tabs: [typeof tab, string][] = [["listing", "Elan"], ["similar", others.length ? `Oxşarlar (${others.length})` : "Oxşarlar"], ["owner", "Sahibi"]];
  return createPortal(<div className="kzSheetBack" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="kzSheet" role="dialog" aria-modal="true" aria-label={item.title}>
      <header className="kzSheetHead"><strong>{item.title}</strong><button type="button" className="kzSheetClose" aria-label="Bağla" onClick={onClose}><X aria-hidden="true" size={18} strokeWidth={2.25} /></button></header>
      <nav className="kzSheetTabs" role="tablist">{tabs.map(([key, text]) => <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "on" : ""} onClick={() => setTab(key)}>{text}</button>)}</nav>
      <div className="kzSheetBody">
        {tab === "listing" && <>
          {(item.images?.length || 0) === 1 && <div className="kzAdGallery"><a href={item.images[0]} target="_blank" rel="noopener noreferrer"><img src={item.images[0]} alt="" loading="lazy" /></a></div>}
          {(item.images?.length || 0) > 1 && <PhotoOrder key={item.images.join("|")} listingId={item.id} images={item.images} onSaved={onSaved} />}
          <dl className="kzAdFacts"><div><dt>Kateqoriya</dt><dd>{categoryName(item.category)}</dd></div><div><dt>Qiymət</dt><dd>{money(item.price)} ₼ / {periodName(item.rental_period)}</dd></div><div><dt>Depozit</dt><dd>{money(item.deposit ?? 0)} ₼</dd></div><div><dt>Minimum müddət</dt><dd>{item.min_days ?? 1} gün</dd></div>{item.rooms && <div><dt>Otaq</dt><dd>{item.rooms}</dd></div>}{item.area_m2 && <div><dt>Sahə</dt><dd>{item.area_m2} m²</dd></div>}<div><dt>Əlaqə</dt><dd>{item.contact ? formatContact(item.contact) : "—"}</dd></div><div><dt>Baxış</dt><dd>{item.views || 0}</dd></div></dl>
          {riskWords(item.title, item.description).length > 0 && <p className="kzRiskNote"><TriangleAlert aria-hidden="true" size={16} strokeWidth={2.2} />Mətndə şübhəli ifadə var: <b>{riskWords(item.title, item.description).join(", ")}</b>. Kontekstə baxın — «almıram» kimi inkar da ola bilər.</p>}
          <LongText text={item.description} />
          <a className="kzAdLink" href={`/listings/${item.id}`} target="_blank" rel="noopener noreferrer">Elanı saytda aç</a>
        </>}
        {tab !== "listing" && !data && !error && <p className="kzAdMuted" role="status">Yüklənir…</p>}
        {tab !== "listing" && error && <p className="kzAdError" role="alert">{error} <button className="kzAdLink" type="button" onClick={load}>Yenidən yoxla</button></p>}
        {tab === "similar" && data && <>
          {!others.length ? <p className="kzSheetOk">Başqa hesablarda oxşar elan tapılmadı.</p> : <ul className="kzSheetList">{others.map(signal => <li key={signal.id}>
            <button type="button" onClick={() => onInspect(signal.id)}><span>{signal.title}</span><small>{statusName(signal.status)}</small></button>
            <div className="kzSheetChips">{reasons(signal).map(reason => <em key={reason}>{reason}</em>)}</div>
          </li>)}</ul>}
          <p className="kzAdHint">Son 180 gündə başqa hesabların elanları ilə müqayisə olunur. Oxşarlıq özü-özlüyündə pozuntu deyil.</p>
        </>}
        {tab === "owner" && data && <>
          <dl className="kzAdFacts"><div><dt>Ad</dt><dd>{data.owner.name || "Qeyd edilməyib"}</dd></div><div><dt>E-poçt</dt><dd>{item.owner_email}</dd></div><div><dt>Qeydiyyat</dt><dd>{adminDate(data.owner.joined_at)}</dd></div><div><dt>Şikayətlər</dt><dd>{data.reports.open} açıq · {data.reports.resolved} baxılıb</dd></div></dl>
          <h4>Bu istifadəçinin elanları ({data.owner_listings.length})</h4>
          <ul className="kzSheetList">{data.owner_listings.map(listing => <li key={listing.id}><button type="button" onClick={() => onInspect(listing.id)}><span>{listing.title}</span><small>{statusName(listing.status)} · {adminDate(listing.created_at)}</small></button></li>)}</ul>
          {!!data.events.length && <><h4>Son əməliyyatlar</h4><EventList events={data.events} /></>}
        </>}
      </div>
      {onDecide && <footer className="kzSheetFoot">
        {decideError && <p className="kzAdError" role="alert">{decideError}</p>}
        {rejectOpen ? <>
          <p className="kzSheetFootLabel">Səbəbi seçin — elan dərhal rədd olunacaq:</p>
          <div className="kzReasonChips">{rejectionReasons.map(text => <button key={text} type="button" disabled={deciding} onClick={() => void decide("rejected", text)}>{text.split(/[.(]/)[0].trim()}</button>)}</div>
          <div className="kzSheetFootRow"><input value={reason} maxLength={500} onChange={event => setReason(event.target.value)} placeholder="Və ya öz səbəbinizi yazın (ən azı 10 simvol)" aria-label="Rədd səbəbi" />
            <button type="button" className="kzAdBtn danger solid" disabled={deciding || reason.trim().length < 10} onClick={() => void decide("rejected", reason.trim())}>Rədd et</button>
            <button type="button" className="kzAdBtn" onClick={() => setRejectOpen(false)}>Geri</button></div>
        </> : <div className="kzSheetFootRow">
          {["pending", "rejected"].includes(item.status) && <button type="button" className="kzAdBtn success" disabled={deciding} onClick={() => void decide("published")}><Check aria-hidden="true" size={16} strokeWidth={2.4} />Təsdiqlə</button>}
          {["pending", "published"].includes(item.status) && <button type="button" className="kzAdBtn danger" disabled={deciding} onClick={() => setRejectOpen(true)}><X aria-hidden="true" size={16} strokeWidth={2.4} />{item.status === "published" ? "Yayımdan çıxar" : "Rədd et"}</button>}
          {onNext && <button type="button" className="kzAdBtn kzNextBtn" onClick={onNext}>Növbəti{position ? ` (${position})` : ""}<ChevronRight aria-hidden="true" size={16} strokeWidth={2.2} /></button>}
        </div>}
      </footer>}
    </section>
  </div>, document.body);
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
  const [busy, setBusy] = useState(""), [notice, setNotice] = useState("");
  useAutoClear(notice, () => setNotice(""));
  // Block: the account cannot sign in and its listings disappear from the site until unblocked.
  async function block(user: User, blocked: boolean) {
    const reason = blocked ? window.prompt(`«${user.display_name || user.email}» bloklansın? Hesaba girə bilməyəcək, elanları saytdan gizlənəcək.\n\nSəbəbi yazın (istifadəçiyə görünmür):`, "Saxtakarlıq / qaydaların pozulması") : "";
    if (blocked && (reason === null || reason.trim().length < 5)) return;
    if (!blocked && !window.confirm(`«${user.display_name || user.email}» hesabının bloku götürülsün?`)) return;
    setBusy(user.id); setError("");
    try {
      await post({ action: "block_user", id: user.id, blocked, reason: reason || "" });
      setUsers(current => current.map(item => item.id === user.id ? { ...item, blocked, blocked_reason: blocked ? reason : null } : item));
      setNotice(blocked ? "İstifadəçi bloklandı." : "Blok götürüldü.");
    } catch (failure) { setError((failure as { code?: string }).code === "STAFF_PROTECTED" ? "Admin və rəhbər hesabını bloklamaq olmaz." : "Dəyişiklik saxlanmadı."); }
    finally { setBusy(""); }
  }
  useEffect(() => {
    let active = true; setLoading(true);
    const timer = setTimeout(() => api({ action: "users", query }).then(data => { if (active) { setUsers(data.items); setError(""); } }).catch(() => { if (active) setError("İstifadəçilər yüklənmədi."); }).finally(() => { if (active) setLoading(false); }), 250);
    return () => { active = false; clearTimeout(timer); };
  }, [query, revision]);
  return <Panel title="İstifadəçilər" actions={<span className="kzAdMuted">{users.length >= 100 ? "Son 100 hesab" : `${users.length} hesab`}</span>}>
    <div className="kzAdFilters kzAdInline"><input type="text" inputMode="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Ad, e-poçt, telefon, №" aria-label="İstifadəçi axtar" /></div>
    {error && <p className="kzAdError" role="alert">{error}</p>}{notice && <p className="kzAdNotice" role="status">{notice}</p>}
    {loading && !users.length ? <p className="kzAdMuted" role="status">Yüklənir…</p> : !users.length ? <Empty title="İstifadəçi tapılmadı" /> : <div className="kzAdTable kzAdUsers" role="table" aria-label="İstifadəçilər">
      <div className="kzAdTableHead" role="row"><span>Ad</span><span>Əlaqə</span><span>Elan</span><span>Qeydiyyat</span><span>Rol</span><span /></div>
      {users.map(user => <div className="kzAdTableRow" role="row" key={user.id}>
        <span className="kzAdPerson"><b aria-hidden="true">{initial(user.display_name || user.email)}</b><span><strong>{user.display_name || "Adsız istifadəçi"}</strong><small>#{user.profile_no}</small></span></span>
        <span className="kzAdContact"><span>{user.email}</span><small>{user.phone ? formatContact(user.phone) : "Telefon yoxdur"}</small></span>
        <span className="kzAdNum" data-label="Elan">{user.listing_count}</span>
        <span data-label="Qeydiyyat">{user.created_at ? adminDate(user.created_at).split(",")[0] : "—"}</span>
        <span>{user.staff_role ? <em className={`kzAdPill${user.staff_role === "leader" ? " strong" : ""}`}>{user.staff_role === "leader" ? "Rəhbər" : "Admin"}</em> : user.blocked ? <em className="kzAdPill danger" title={user.blocked_reason || ""}>Bloklanıb</em> : <span className="kzAdMuted">İstifadəçi</span>}</span>
        <span className="kzAdRowEnd"><button type="button" className="kzAdBtn small" disabled={!user.listing_count} onClick={() => onListings(user)}>Elanları</button>
          {!user.staff_role && (user.blocked
            ? <button type="button" className="kzAdBtn small" disabled={busy === user.id} onClick={() => void block(user, false)}>Bloku götür</button>
            : <button type="button" className="kzAdBtn small danger" disabled={busy === user.id} onClick={() => void block(user, true)}><Ban aria-hidden="true" size={14} strokeWidth={2.2} />Blokla</button>)}</span>
      </div>)}
    </div>}
  </Panel>;
}

function StaffManagement() {
  const [members, setMembers] = useState<Member[]>([]), [events, setEvents] = useState<StaffEvent[]>([]), [cursor, setCursor] = useState<number | null>(null);
  const [query, setQuery] = useState(""), [found, setFound] = useState<Member | null>(null), [matches, setMatches] = useState<Member[]>([]), [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  useAutoClear(notice, () => setNotice(""));
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
    <div className="kzAdPerson"><b aria-hidden="true">{initial(account.name || account.email)}</b><span><strong>{account.name || account.email}<em className={`kzAdPill${account.role === "leader" ? " strong" : ""}`}>{staffRoleName(account.role)}</em></strong><small>#{account.profile_no || "—"} · {account.email}{account.phone && <> · <span className="kzNoWrap">{formatContact(account.phone)}</span></>}</small>{account.assigned_at && account.role !== "leader" && <small>Admin təyin edilib: {adminDate(account.assigned_at)}</small>}</span></div>
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
  // Coming back from Google Drive (connect) opens the backup section.
  useEffect(() => { if (new URLSearchParams(window.location.search).get("section") === "backup") setSection("backup"); }, []);
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

  const [details, setDetails] = useState<AdminListing | null>(null);
  async function moderate(item: AdminListing, status: "published" | "rejected", given?: string): Promise<boolean> {
    if (busy || loading) return false;
    const reason = (given ?? reasons[item.id])?.trim() || "";
    if (status === "rejected" && reason.length < 10) { setRejecting(item.id); return false; }
    setBusy(item.id); setError("");
    try {
      await post({ action: "moderate", id: item.id, status, from: item.status, reason });
      setReasons(current => { const next = { ...current }; delete next[item.id]; return next; });
      setRejecting("");
      setRevision(value => value + 1);
      return true;
    } catch { setError("Dəyişiklik saxlanmadı. Siyahını yenilə və yenidən yoxla."); return false; }
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
  const sections = (Object.keys(sectionLabels) as Section[]).filter(item => item !== "history" && (!["staff", "backup", "limits"].includes(item) || role === "leader"));
  const pending = counts?.statuses?.pending || 0, openReports = counts?.reports || 0, storeRequests = counts?.stores || 0;
  const badge = (item: Section) => item === "moderation" ? pending : item === "reports" ? openReports : item === "stores" ? storeRequests : 0;
  const menuNote = (item: Section): { text: string; alert?: boolean } =>
    item === "moderation" ? (pending ? { text: `${pending} elan yoxlama gözləyir`, alert: true } : { text: "Yoxlanılacaq elan yoxdur" })
    : item === "reports" ? (openReports ? { text: `${openReports} açıq şikayət`, alert: true } : { text: "Açıq şikayət yoxdur" })
    : item === "users" ? { text: counts ? `${counts.users} istifadəçi` : "Hesablar və bloklama" }
    : item === "banners" ? { text: "Reklam bannerləri" }
    : item === "backup" ? { text: "Hər gecə Google Drive-a" }
    : item === "limits" ? { text: "Ödənişli xidmətlər və pulsuz elan" }
    : item === "stores" ? (storeRequests ? { text: `${storeRequests} mağaza müraciəti`, alert: true } : { text: "Müraciətlər və paketlər" })
    : { text: "Rəhbər və adminlər" };

  return <div className="kzAdm">
    <nav className="kzAdNav" aria-label="Panel bölmələri">
      {sections.map(item => <button key={item} type="button" aria-pressed={section === item} onClick={() => open(item)}>{(() => { const SectionIcon = icons[item]; return <SectionIcon aria-hidden="true" size={20} strokeWidth={1.75} />; })()}<span>{sectionLabels[item]}</span>{!!badge(item) && <b>{badge(item)}</b>}</button>)}
      <Link className="kzAdNavBack" href="/profile"><UserRound aria-hidden="true" size={19} strokeWidth={2} />Şəxsi kabinet</Link>
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
            {([[pending, "Yoxlama gözləyən elan", "attention", ListChecks, () => showListings("pending")], [openReports, "Açıq şikayət", "warn", Flag, () => open("reports")], [storeRequests, "Mağaza müraciəti", "attention", Store, () => open("stores")]] as const).map(([count, label, tone, Icon, go]) =>
              <button type="button" key={label} className={count ? tone : "done"} onClick={go}>
                <span className="kzAdTodoIcon"><Icon aria-hidden="true" size={20} strokeWidth={2} /></span>
                <span className="kzAdTodoText"><small>{label}</small><b>{count}</b></span>
                <ChevronRight className="kzAdTodoGo" aria-hidden="true" size={18} strokeWidth={2.25} />
              </button>)}
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
              <div className="kzAdRowTop"><span className={`status ${item.status}`}>{statusName(item.status)}</span>{item.status === "pending" && item.review_kind === "edited" && <span className="kzAdPill warn">Dəyişdirilib</span>}{(item.signal_count || 0) > 0 && <span className="kzAdPill danger" title="Başqa hesabda eyni telefon və ya şəkil">Şübhəli: {item.signal_count} oxşar</span>}{riskWords(item.title, item.description).length > 0 && <span className="kzAdPill warn kzRisk" title={`Mətndə: ${riskWords(item.title, item.description).join(", ")}`}><TriangleAlert aria-hidden="true" size={12} strokeWidth={2.4} />Diqqət: {riskWords(item.title, item.description)[0]}</span>}<span className="kzAdMuted">{categoryName(item.category)}</span></div>
              <h3>{item.title}</h3>
              <p><strong>{money(item.price)} ₼</strong> / {periodName(item.rental_period)} · {item.city}{item.district && `, ${item.district}`}</p>
              <p className="kzAdMuted">№ {item.listing_no ?? "—"} · {adminDate(item.created_at)}</p><p className="kzAdMuted kzAdOwnerLine">{item.owner_name || "İstifadəçi"}{item.contact ? ` · ${formatContact(item.contact)}` : ""}</p>
              {item.rejection_reason && <p className="kzAdReason">Əvvəlki səbəb: {item.rejection_reason}</p>}
            </div>
            <div className="kzAdRowActions">
              {["pending", "rejected"].includes(item.status) && <button type="button" className="kzAdBtn success" disabled={!!busy} onClick={() => void moderate(item, "published")}><Check aria-hidden="true" size={16} strokeWidth={2.4} />{busy === item.id ? "Saxlanılır…" : "Təsdiqlə"}</button>}
              <button type="button" className="kzAdBtn danger" disabled={!!busy || !["pending", "published"].includes(item.status)} onClick={() => setRejecting(rejecting === item.id ? "" : item.id)}><X aria-hidden="true" size={16} strokeWidth={2.4} />{item.status === "published" ? "Yayımdan çıxar" : "Rədd et"}</button>
            </div>
            {rejecting === item.id && <div className="kzAdReject">
              <label>Səbəb<select value={rejectionReasons.includes(reasons[item.id] || "") ? reasons[item.id] : ""} onChange={event => setReasons(current => ({ ...current, [item.id]: event.target.value }))}><option value="">Hazır səbəb seç və ya aşağıda yaz</option>{rejectionReasons.map(reason => <option key={reason} value={reason}>{reason}</option>)}</select></label>
              <textarea aria-label="Rədd səbəbi" maxLength={500} rows={2} value={reasons[item.id] ?? ""} onChange={event => setReasons({ ...reasons, [item.id]: event.target.value })} placeholder="Elan sahibinə görünəcək səbəb (ən azı 10 simvol)" />
              <div className="kzAdCenter start"><button type="button" className="kzAdBtn danger solid" disabled={!!busy || (reasons[item.id]?.trim().length || 0) < 10} onClick={() => void moderate(item, "rejected")}>Rədd et</button><button type="button" className="kzAdBtn" onClick={() => setRejecting("")}>Ləğv et</button></div>
            </div>}
            <button type="button" className="kzAdDetailsBtn" onClick={() => setDetails(item)}><Eye aria-hidden="true" size={16} strokeWidth={2} />Ətraflı bax{(item.signal_count || 0) > 0 && <span className="kzAdDot" aria-label="oxşar elan var" />}</button>
          </article>)}</div>}
          {total > PAGE && <nav className="kzAdPager" aria-label="Elan səhifələri"><button type="button" className="kzAdBtn" disabled={page === 1 || !!busy} onClick={() => setPage(x => x - 1)}><ChevronLeft className="kzI kzIL" aria-hidden="true" size={16} strokeWidth={2.25} />Əvvəlki</button><span>{page} / {Math.ceil(total / PAGE)}</span><button type="button" className="kzAdBtn" disabled={page * PAGE >= total || !!busy} onClick={() => setPage(x => x + 1)}>Növbəti<ChevronRight className="kzI kzIR" aria-hidden="true" size={16} strokeWidth={2.25} /></button></nav>}
        </>}
      </Panel>}

      {details && (() => { const index = items.findIndex(entry => entry.id === details.id), next = index >= 0 ? items[index + 1] : undefined;
        return <ReviewSheet item={details} onClose={() => setDetails(null)} onInspect={id => { setDetails(null); inspect(id); }} onSaved={() => setRevision(value => value + 1)}
          onDecide={(status, reason) => moderate(details, status, reason)} onNext={next ? () => setDetails(next) : undefined} position={index >= 0 ? `${index + 1}/${items.length}` : undefined} />; })()}
      {section === "reports" && <ReportQueue onInspect={inspect} onChange={() => setRevision(x => x + 1)} />}
      {section === "history" && <ModerationHistory revision={revision} onInspect={inspect} />}
      {section === "banners" && <BannerManager />}
      {section === "stores" && <StoreAdmin leader={role === "leader"} />}
      {section === "limits" && role === "leader" && <LimitAdmin />}
      {section === "backup" && role === "leader" && <BackupStatus />}
      {section === "users" && <UserList revision={revision} onListings={ownerListings} />}
      {section === "staff" && role === "leader" && <StaffManagement />}
    </div>
  </div>;
}

// Moderator can change only the order of a listing's photos (e.g. a bad cover photo), not the photos themselves.
function PhotoOrder({ listingId, images, onSaved }: { listingId: string; images: string[]; onSaved: () => void }) {
  const [photos, setPhotos] = useState<ListingPhoto[]>(() => images.map(src => ({ id: src, src })));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const changed = photos.some((photo, index) => photo.src !== images[index]);
  async function save() {
    setSaving(true); setMessage("");
    try { await post({ action: "reorder_images", id: listingId, images: photos.map(photo => photo.src) }); setMessage("Sıra saxlanıldı."); onSaved(); }
    catch { setMessage("Sıra saxlanmadı. Siyahını yenilə və yenidən yoxla."); }
    finally { setSaving(false); }
  }
  return <div className="kzAdPhotos">
    <p className="kzAdMuted">Şəkli basıb saxla və sürüşdür — birinci şəkil üz qabığıdır.</p>
    <PhotoOrganizer removable={false} photos={photos} onChange={next => { setPhotos(next); setMessage(""); }} />
    {(changed || message) && <div className="kzAdCenter start">
      {changed && <><button type="button" className="kzAdBtn primary" disabled={saving} onClick={() => void save()}>{saving ? "Saxlanılır…" : "Sırayı saxla"}</button><button type="button" className="kzAdBtn" disabled={saving} onClick={() => setPhotos(images.map(src => ({ id: src, src })))}>Geri qaytar</button></>}
      {message && <span className="kzAdMuted" role="status">{message}</span>}
    </div>}
  </div>;
}

// Long descriptions start folded to four lines.
function LongText({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 280 || text.split("\n").length > 4;
  return <div className="kzAdDescriptionWrap">
    <p className={`kzAdDescription${long && !open ? " folded" : ""}`}>{text}</p>
    {long && <button type="button" className="kzAdLink" onClick={() => setOpen(value => !value)}>{open ? "Qısalt" : "Davamı"}</button>}
  </div>;
}

// Nightly backup to the leader's Google Drive: connect once, then the state of the last copies.
type BackupRun = { id: number; started_at: string; finished_at: string | null; heartbeat_at: string | null; ok: boolean | null; db_rows: number | null; db_bytes: number | null; files_new: number; error: string | null; stalled: boolean };
function BackupStatus() {
  const [data, setData] = useState<{ connected: boolean; email: string; folder: string | null; runs: BackupRun[]; files: { count: number; bytes: number }; code: { version: string; bytes: number; at: string } | null; google: boolean } | null>(null), [error, setError] = useState("");
  const load = useCallback(() => { fetch("/api/admin/backup", { cache: "no-store" }).then(r => r.ok ? r.json() : Promise.reject()).then(setData).catch(() => setError("Məlumat yüklənmədi.")); }, []);
  useEffect(() => { load(); }, [load]);
  // Result of connecting Drive arrives in the address (?backup=…); shown once, then the address is cleaned.
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("backup");
    if (value) { setNotice(value); window.history.replaceState(null, "", "/admin?section=backup"); }
  }, []);
  useAutoClear(notice === "connected" ? notice : null, () => setNotice(null), 6000);
  const last = data?.runs[0];
  const running = !!last && !last.finished_at && !last.stalled;
  // While a copy is being sent the card refreshes by itself.
  useEffect(() => { if (!running) return; const timer = setTimeout(load, 4000); return () => clearTimeout(timer); }, [running, data, load]);
  const size = (bytes: number | null) => !Number(bytes) ? "0 KB" : Number(bytes) > 1048576 ? `${(Number(bytes) / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(Number(bytes) / 1024))} KB`;
  async function disconnect() {
    if (!window.confirm("Google Drive ayrılsın? Drive-dakı fayllar silinmir, amma yeni ehtiyat nüsxələri dayanacaq.")) return;
    await fetch("/api/admin/backup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "disconnect" }) }).catch(() => null);
    load();
  }
  const state = !last ? "none" : running ? "running" : last.ok ? "ok" : "failed";
  const lastOk = data?.runs.find(run => run.ok);
  return <Panel title="Ehtiyat nüsxə">
    <p className="kzAdHint">Hər gecə saat 03:00-da saytın bütün məlumatı Google Drive-dakı <strong>«kirayeal.az ehtiyat nüsxə»</strong> qovluğuna yazılır.</p>
    {notice === "connected" && <p className="kzAdNotice" role="status">Google Drive qoşuldu. İlk ehtiyat nüsxə göndərilir.</p>}
    {(notice === "error" || notice === "no-access") && <p className="kzAdError" role="alert">Drive qoşulmadı. Google pəncərəsində Drive icazəsini təsdiqləyin və yenidən cəhd edin.</p>}
    {error && <p className="kzAdError" role="alert">{error}</p>}
    {!data ? <p className="kzAdMuted" role="status">Yüklənir…</p> : <div className="kzBk">
      <section className="kzBkDrive">
        <span className={`kzBkIcon ${data.connected ? "ok" : ""}`}><HardDrive aria-hidden="true" size={20} strokeWidth={1.9} /></span>
        <div className="kzBkText"><strong>{data.connected ? "Google Drive qoşulub" : "Google Drive qoşulmayıb"}</strong><small>{data.connected ? data.email || "Google hesabı" : data.google ? "Ehtiyat nüsxə üçün Drive-ı bir dəfə qoşun." : "Əvvəl serverdə Google girişi qurulmalıdır."}</small></div>
        <div className="kzBkActions">
          {data.connected && data.folder && <a className="kzAdBtn" href={`https://drive.google.com/drive/folders/${data.folder}`} target="_blank" rel="noopener noreferrer"><ExternalLink aria-hidden="true" size={15} strokeWidth={2} />Drive-da aç</a>}
          {data.connected ? <button type="button" className="kzAdBtn kzBkUnlink" onClick={() => void disconnect()}><Unlink aria-hidden="true" size={15} strokeWidth={2} />Drive-ı ayır</button> : data.google && <a className="kzAdBtn primary" href="/api/admin/backup/drive">Google Drive-a qoş</a>}
        </div>
      </section>
      {data.connected && <section className={`kzBkStatus ${state}`}>
        <span className="kzBkIcon">{state === "running" ? <LoaderCircle className="kzSpin" aria-hidden="true" size={22} strokeWidth={2} /> : state === "ok" ? <CircleCheck aria-hidden="true" size={22} strokeWidth={2} /> : state === "failed" ? <TriangleAlert aria-hidden="true" size={22} strokeWidth={2} /> : <Clock aria-hidden="true" size={22} strokeWidth={2} />}</span>
        <div className="kzBkText">
          <strong>{state === "running" ? "Ehtiyat nüsxə göndərilir…" : state === "ok" ? "Ehtiyat nüsxə hazırdır" : state === "failed" ? "Son cəhd alınmadı" : "Hələ ehtiyat nüsxə olmayıb"}</strong>
          <small>{state === "running" ? `Başladı: ${adminDate(last!.started_at)}${last!.db_rows ? ` · baza göndərildi` : ""}${last!.files_new ? ` · ${last!.files_new} şəkil göndərildi` : ""}` : state === "ok" ? adminDate(last!.finished_at || last!.started_at) : state === "failed" ? `${adminDate(last!.started_at)} · ${last!.error || "naməlum səbəb"}` : "İlk nüsxə bu gecə saat 03:00-da göndəriləcək."}</small>
          {state === "failed" && <small>Sistem bir saat ərzində özü yenidən cəhd edəcək.</small>}
        </div>
      </section>}
      {data.connected && <div className="kzBkStats">
        <div><Database aria-hidden="true" size={18} strokeWidth={1.9} /><span>Baza</span><strong>{lastOk ? `${Number(lastOk.db_rows || 0)} sətir · ${size(lastOk.db_bytes)}` : "—"}</strong></div>
        <div><Images aria-hidden="true" size={18} strokeWidth={1.9} /><span>Şəkil və videolar</span><strong>{data.files.count} fayl · {size(data.files.bytes)}</strong></div>
        <div><FileCode aria-hidden="true" size={18} strokeWidth={1.9} /><span>Saytın kodu</span><strong>{data.code ? `${size(data.code.bytes)} · ${adminDate(data.code.at).split(",")[0]}` : "Növbəti deploydan sonra"}</strong></div>
        <div><Clock aria-hidden="true" size={18} strokeWidth={1.9} /><span>Növbəti nüsxə</span><strong>Bu gecə, 03:00</strong></div>
      </div>}
      {data.runs.length > 1 && <details className="kzBkHistory"><summary>Son nüsxələr</summary><ul>{data.runs.map(run => <li key={run.id}><span className={`kzBkDot ${run.ok ? "ok" : !run.finished_at && !run.stalled ? "running" : "failed"}`} />{adminDate(run.started_at)}<em>{run.ok ? `hazırdır · ${run.files_new} yeni şəkil` : !run.finished_at && !run.stalled ? "göndərilir" : run.error || "alınmadı"}</em></li>)}</ul></details>}
    </div>}
  </Panel>;
}

// Stores: applications to approve, active stores to extend or stop, and the package prices (leader).
type AdminStore = { id: string; slug: string; name: string; logo_url: string | null; phone: string; address: string; plan: string; plan_name: string; plan_price: string; status: string; active_until: string | null; reject_reason: string | null; owner_email: string; owner_name: string | null; created_at: string; description?: string; open_from?: string | null; open_to?: string | null; listings?: number };
type AdminPlan = { id: string; name: string; price: string; listing_limit: number | null; free_bumps: number; featured: boolean };
function StoreAdmin({ leader }: { leader: boolean }) {
  const [items, setItems] = useState<AdminStore[]>([]), [plans, setPlans] = useState<AdminPlan[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState(""), [notice, setNotice] = useState(""), [busy, setBusy] = useState("");
  useAutoClear(notice, () => setNotice(""));
  const load = useCallback(() => api({ action: "stores" }).then(data => { setItems(data.items); setPlans(data.plans); }).catch(() => setError("Mağazalar yüklənmədi.")).finally(() => setLoading(false)), []);
  useEffect(() => { void load(); }, [load]);
  async function decide(store: AdminStore, decision: "activate" | "reject" | "stop", days = 30) {
    const reason = decision === "reject" ? window.prompt("Rədd səbəbi (mağaza sahibinə görünəcək):", "Məlumatlar natamamdır. Loqo, ünvan və telefonu əlavə edin.") : "";
    if (decision === "reject" && (!reason || reason.trim().length < 5)) return;
    if (decision === "stop" && !window.confirm(`«${store.name}» mağazası dayandırılsın?`)) return;
    setBusy(store.id); setError("");
    try { await post({ action: "store_decide", id: store.id, decision, days, reason }); setNotice(decision === "activate" ? `Mağaza ${days} gün aktivləşdirildi.` : decision === "reject" ? "Müraciət rədd edildi." : "Mağaza dayandırıldı."); await load(); }
    catch { setError("Dəyişiklik saxlanmadı."); } finally { setBusy(""); }
  }
  async function savePlan(plan: AdminPlan, form: HTMLFormElement) {
    const data = new FormData(form); setBusy(plan.id); setError("");
    try { await post({ action: "store_plan", id: plan.id, price: Number(data.get("price")), listing_limit: String(data.get("limit") || ""), free_bumps: Number(data.get("bumps") || 0) }); setNotice(`«${plan.name}» paketi yeniləndi.`); await load(); }
    catch { setError("Paket saxlanmadı. Rəqəmləri yoxlayın."); } finally { setBusy(""); }
  }
  const statusText: Record<string, string> = { pending: "Müraciət", active: "Aktiv", rejected: "Rədd edilib", expired: "Dayandırılıb" };
  return <Panel title="Mağazalar">
    {error && <p className="kzAdError" role="alert">{error}</p>}{notice && <p className="kzAdNotice" role="status">{notice}</p>}
    <p className="kzAdHint">Mağaza sahibi kabinetdən müraciət edir. Ödənişi aldıqdan sonra «Aktivləşdir» basın — mağaza seçilən müddətə açılır, elanlarında «Mağaza» nişanı görünür və limiti paketə görə artır.</p>
    {loading ? <p className="kzAdMuted" role="status">Yüklənir…</p> : !items.length ? <Empty title="Hələ mağaza müraciəti yoxdur" text="Müraciət gələndə burada görünəcək." /> :
      <div className="kzAdList">{items.map(store => { const live = store.status === "active" && !!store.active_until && Date.parse(store.active_until) > Date.now(); return <article className="kzAdRow kzStoreRow" key={store.id}>
        <span className="kzStoreRowLogo">{store.logo_url ? <img src={store.logo_url} alt="" /> : <b>{store.name.charAt(0).toUpperCase()}</b>}</span>
        <div className="kzAdRowMain">
          <div className="kzAdRowTop"><span className={`status ${live ? "published" : store.status === "pending" ? "pending" : "archived"}`}>{live ? "Aktiv" : store.status === "active" ? "Müddəti bitib" : statusText[store.status] || store.status}</span><span className="kzAdMuted">{store.plan_name} · {Number(store.plan_price).toLocaleString("ru-RU")} ₼/ay</span></div>
          <h3>{store.name}</h3>
          <p className="kzAdMuted">{store.owner_name || "İstifadəçi"} · {store.owner_email}{store.phone ? ` · ${store.phone}` : ""}</p>
          {store.description && <p className="kzStoreRowText">{store.description}</p>}
          <p className="kzAdMuted">{[store.address, store.open_from && store.open_to ? `${store.open_from}–${store.open_to}` : "", `${store.listings ?? 0} aktiv elan`].filter(Boolean).join(" · ")}</p>
          <p className="kzAdMuted">{live ? `${adminDate(store.active_until!).split(",")[0]} tarixinədək · ` : store.status === "active" && store.active_until ? `${adminDate(store.active_until).split(",")[0]} tarixində bitib · ` : ""}<a className="kzAdLink" href={`/magaza/${store.slug}${live ? "" : "?preview=1"}`} target="_blank" rel="noopener noreferrer">{live ? "Səhifəyə bax" : "Necə görünəcək — bax"}</a></p>
          {store.reject_reason && store.status === "rejected" && <p className="kzAdReason">Səbəb: {store.reject_reason}</p>}
        </div>
        <div className="kzAdRowActions kzStoreActions">
          <select aria-label="Müddət" defaultValue="30" id={`days-${store.id}`}><option value="30">30 gün</option><option value="90">90 gün</option><option value="180">180 gün</option><option value="365">1 il</option></select>
          <button type="button" className="kzAdBtn success" disabled={busy === store.id} onClick={() => void decide(store, "activate", Number((document.getElementById(`days-${store.id}`) as HTMLSelectElement)?.value || 30))}><Check aria-hidden="true" size={15} strokeWidth={2.4} />{live ? "Uzat" : "Aktivləşdir"}</button>
          {store.status === "pending" && <button type="button" className="kzAdBtn danger" disabled={busy === store.id} onClick={() => void decide(store, "reject")}><X aria-hidden="true" size={15} strokeWidth={2.4} />Rədd et</button>}
          {live && <button type="button" className="kzAdBtn danger" disabled={busy === store.id} onClick={() => void decide(store, "stop")}><Ban aria-hidden="true" size={14} strokeWidth={2.2} />Dayandır</button>}
        </div>
      </article>; })}</div>}
    {leader && <><h3 className="kzAdSubhead">Paketlər və qiymətlər</h3>
      <div className="kzPlanEdit">{plans.map(plan => <form key={plan.id} onSubmit={event => { event.preventDefault(); void savePlan(plan, event.currentTarget); }}>
        <strong>{plan.name}</strong>
        <label>Qiymət, ₼/ay<input name="price" type="number" min="0" step="0.01" defaultValue={Number(plan.price)} required /></label>
        <label>Elan limiti (kateqoriya üzrə)<input name="limit" type="number" min="1" placeholder="Limitsiz" defaultValue={plan.listing_limit ?? ""} /></label>
        <label>Pulsuz irəli çək / ay<input name="bumps" type="number" min="0" defaultValue={plan.free_bumps} /></label>
        <button className="kzAdBtn primary" disabled={busy === plan.id}>Yadda saxla</button>
      </form>)}</div>
      <p className="kzAdHint kzPlanHint">«Elan limiti» boş qalsa, paket limitsizdir. Dəyişiklik aktiv mağazalara növbəti uzatmadan tətbiq olunur.</p></>}
  </Panel>;
}

// Leader → "Limitlər": the free listing rule. Off = one free listing per category (as now);
// on = one free listing per group, and the ticked categories always paid.
function LimitAdmin() {
  const [rules, setRules] = useState<LimitRules | null>(null), [payments, setPayments] = useState<boolean | null>(null), [error, setError] = useState(""), [notice, setNotice] = useState(""), [busy, setBusy] = useState(false);
  useAutoClear(notice, () => setNotice(""));
  useEffect(() => { api({ action: "limit_rules" }).then(data => { setRules(cleanLimitRules(data.rules)); setPayments(data.payments !== false); }).catch(() => setError("Ayarlar yüklənmədi.")); }, []);
  async function save(next: LimitRules) {
    setBusy(true); setError("");
    try { await post({ action: "save_limit_rules", rules: next }); setRules(next); setNotice(next.enabled ? "Yeni limit qaydası açıqdır." : "Ayarlar saxlanıldı. Qayda bağlıdır."); }
    catch { setError("Ayarlar saxlanmadı."); } finally { setBusy(false); }
  }
  async function switchPayments() {
    const next = !payments;
    if (!next && !window.confirm("Bütün ödənişli xidmətlər dayandırılsın? İstifadəçilər «Reklam et», VIP, Premium, ödənişli bərpa və mağaza müraciəti düymələrini görməyəcək.")) return;
    setBusy(true); setError("");
    try { await post({ action: "save_payments", enabled: next }); setPayments(next); setNotice(next ? "Ödənişli xidmətlər açıldı." : "Ödənişli xidmətlər dayandırıldı."); }
    catch { setError("Dəyişiklik saxlanmadı."); } finally { setBusy(false); }
  }
  const name = (id: string) => categories.find(item => item.id === id)?.name || id;
  return <Panel title="Ödəniş və limitlər">
    {payments !== null && <div className={`kzPaySwitch${payments ? " on" : ""}`}>
      <span className="kzPaySwitchIcon"><CreditCard aria-hidden="true" size={22} strokeWidth={2} /></span>
      <div><strong>Ödənişli xidmətlər: {payments ? "Açıq" : "Dayandırılıb"}</strong>
        <small>{payments ? "İrəli çək, VIP, Premium, ödənişli yerləşdirmə, bərpa və mağaza paketləri istifadəçilərə görünür." : "İstifadəçilər heç bir ödənişli düymə görmür. Aktiv mağazalar və artıq alınmış xidmətlər müddəti bitənədək işləyir. Sizin üçün hər şey pulsuzdur."}</small></div>
      <button type="button" role="switch" aria-checked={payments} aria-label="Ödənişli xidmətlər" className="kzToggle" disabled={busy} onClick={() => void switchPayments()}><i aria-hidden="true" /></button>
    </div>}
    {error && <p className="kzAdError" role="alert">{error}</p>}{notice && <p className="kzAdNotice" role="status">{notice}</p>}
    {!rules ? <p className="kzAdMuted" role="status">Yüklənir…</p> : <>
      <div className={`kzLimitSwitch${rules.enabled ? " on" : ""}`}>
        <span className="kzPaySwitchIcon"><SlidersHorizontal aria-hidden="true" size={22} strokeWidth={2} /></span>
        <div><strong>Yeni limit qaydası: {rules.enabled ? "Açıq" : "Bağlı"}</strong>
          <small>{rules.enabled ? "Hər qrupda 30 gündə aşağıdakı sayda pulsuz elan; seçilmiş kateqoriyalar həmişə ödənişlidir." : "İndi hər kateqoriyada 30 gündə 1 pulsuz elan verilir. Ödəniş sistemi qoşulanda qaydanı açın."}</small></div>
        <button type="button" role="switch" aria-checked={rules.enabled} aria-label="Yeni limit qaydası" className="kzToggle" disabled={busy} onClick={() => { if (rules.enabled || window.confirm("Yeni limit qaydası açılsın? Limitdən artıq elanlar «Ödəniş gözləyir» bölməsinə düşəcək.")) void save({ ...rules, enabled: !rules.enabled }); }}><i aria-hidden="true" /></button>
      </div>
      <h3 className="kzAdSub">Qruplar üzrə pulsuz elan (30 gün)</h3>
      <div className="kzLimitGroups">
        {limitGroups.map(group => <label key={group.id} className="kzLimitGroup">
          <span><strong>{group.name}</strong><small>{group.categories.filter(id => !rules.paid.includes(id)).map(name).join(", ") || "Hamısı ödənişli"}</small></span>
          <input type="number" min="0" max="100" value={rules.free[group.id]} onChange={event => setRules({ ...rules, free: { ...rules.free, [group.id]: Math.max(0, Math.min(100, Number(event.target.value) || 0)) } })} aria-label={`${group.name}: pulsuz elan sayı`} />
        </label>)}
      </div>
      <h3 className="kzAdSub">Həmişə ödənişli kateqoriyalar</h3>
      <div className="kzLimitPaid">
        {categories.map(item => <label key={item.id} className={rules.paid.includes(item.id) ? "on" : ""}>
          <input type="checkbox" checked={rules.paid.includes(item.id)} onChange={event => setRules({ ...rules, paid: event.target.checked ? [...rules.paid, item.id] : rules.paid.filter(id => id !== item.id) })} />{item.name}
        </label>)}
      </div>
      <p className="kzAdHint">0 yazsanız, həmin qrupda pulsuz elan olmur. Mağazası olanlara bu qayda aid deyil — onların limiti paketə görədir. Rəhbər üçün limit yoxdur.</p>
      <button type="button" className="kzAdBtn primary kzLimitSave" disabled={busy} onClick={() => void save(rules)}>{busy ? "Saxlanılır…" : "Yadda saxla"}</button>
    </>}
  </Panel>;
}
