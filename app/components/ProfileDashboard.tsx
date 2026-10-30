"use client";
import { useAutoClear } from "../../lib/use-auto-clear";
import { ChevronLeft, ChevronRight, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatContact } from "../../lib/contact-mask";
import {WalletActivity,SavedCards} from "./WalletPanels";
import PhotoMark from "./PhotoMark";
import PaymentDialog from "./PaymentDialog";
import PromotionOptions from "./PromotionOptions";
import EmptyArt from "./EmptyArt";
import { activePromotion } from "./PromotionBadges";
import NavigationIcon from "./NavigationIcon";
import AccountLimits from "./AccountLimits";
import BalancePreview from "../components/BalancePreview";
import UserAvatar from "./UserAvatar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { effectiveListingStatus } from "../../lib/listing-lifecycle";
import {
  Listing,
  loadListings,
  statusName,
  money,
  periodName,
} from "../../lib/marketplace";
const listingTabs = [["published", "Aktiv"], ["pending", "Gözləmədə"], ["payment", "Ödəniş gözləyir"], ["rejected", "Rədd edilib"], ["expired", "Müddəti bitib"], ["deleted", "Silinmiş"]];
const emptyText: Record<string, string> = { published: "Aktiv elanınız yoxdur. İstifadə etmədiyiniz əşyanı kirayəyə verin.", pending: "Gözləmədə olan elan yoxdur.", payment: "Ödəniş gözləyən elan yoxdur.", rejected: "Rədd edilmiş elan yoxdur.", expired: "Müddəti bitmiş elan yoxdur.", deleted: "Silinmiş elan yoxdur." };
const shortDate = (value?: string | null) => { if (!value) return "—"; const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Baku", day: "2-digit", month: "2-digit", year: "numeric" }).formatToParts(new Date(value)); const part = (type: string) => parts.find(item => item.type === type)?.value || ""; return `${part("day")}.${part("month")}.${part("year")}`; };
export default function ProfileDashboard({ balanceOnly = false }: { balanceOnly?: boolean }) {
  const params=useSearchParams(),requested=params.get("section"),section=requested&&["listings","transactions","cards","limits"].includes(requested)?requested:"listings",screen:"menu"|"section"=balanceOnly||requested&&["listings","transactions","cards","limits"].includes(requested)?"section":"menu",[profileNumber,setProfileNumber]=useState("");
  useEffect(()=>{window.scrollTo(0,0);},[requested]);
  const sectionTitles:Record<string,string>={listings:"Mənim elanlarım",transactions:"Əməliyyat tarixçəsi",cards:"Mənim kartlarım",limits:"Limitlər"};
  const openSection=(_name:string)=>{};
  const [avatar, setAvatar] = useState<string|null>(null);
  const [identity, setIdentity] = useState(""),
    [userId, setUserId] = useState(""),
    [accountPhone, setAccountPhone] = useState(""),
    [accountEmail, setAccountEmail] = useState(""),
    [loading, setLoading] = useState(true),
    [listings, setListings] = useState<Listing[]>([]),
    [error, setError] = useState(""),
    [admin, setAdmin] = useState(false),
    [staffRole, setStaffRole] = useState(""),
    [leader, setLeader] = useState(false),
    [busy, setBusy] = useState(""),
    [notice, setNotice] = useState(""),
    [statusFilter, setStatusFilter] = useState(() => { const tab = params.get("tab"); return tab && listingTabs.some(([key]) => key === tab) ? tab : "published"; }),
    [reloadKey, setReloadKey] = useState(0),
    [fullCategories, setFullCategories] = useState<string[]>([]),
    [payment, setPayment] = useState<{ title: string; text: string } | null>(null),
    [refreshing, setRefreshing] = useState(false);
  useAutoClear(notice, () => setNotice(""));
  // Tapping the cabinet link while already here reloads the data.
  useEffect(() => {
    const refresh = () => setReloadKey(key => key + 1);
    window.addEventListener("kiraye:refresh", refresh);
    return () => window.removeEventListener("kiraye:refresh", refresh);
  }, []);
  useEffect(() => {
    if (reloadKey) { setRefreshing(true); setError(""); }
    fetch('/api/auth/host',{cache:'no-store'})
      .then(async response => {
        const data=await response.json();if(!data.user)return;
        setUserId(data.user.id);setLeader(!!data.leader);setIdentity(data.user.display_name||data.user.email||'Hesab');setAccountPhone(data.user.phone||'');setAccountEmail(data.user.email||'');
        const [profileResult,listingsResult]=await Promise.allSettled([
          fetch('/api/account/profile',{cache:'no-store'}).then(result=>result.ok?result.json():Promise.reject()),
          balanceOnly?Promise.resolve(null):loadListings("mine"),
        ]);
        if(profileResult.status==='fulfilled'){
          const profile=profileResult.value?.profile;
          if(profile?.profile_no)setProfileNumber(String(profile.profile_no));setAvatar(profile?.avatar_url||null);
          setAdmin(profile?.role==='admin'||!!profile?.staff_role);if(profile?.staff_role)setStaffRole(profile.staff_role);
          if(profile?.name||profile?.display_name)setIdentity(profile.name||profile.display_name);if(profile?.phone)setAccountPhone(profile.phone);
        }
        if(!balanceOnly){
          if(listingsResult.status==='fulfilled'&&Array.isArray(listingsResult.value))setListings(listingsResult.value);
          else setError("Məlumatları yükləmək mümkün olmadı. Yenidən cəhd edin.");
        }
      })
      .catch(() =>
        setError("Məlumatları yükləmək mümkün olmadı. Yenidən cəhd edin."),
      )
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, [balanceOnly, reloadKey]);
  // Categories whose free place is used: restoring there will need payment, so say it up front.
  useEffect(() => {
    if (balanceOnly || !userId) return;
    fetch("/api/listings/limits", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(data => {
      if (data?.items) setFullCategories(data.items.filter((item: { remaining: number }) => item.remaining <= 0).map((item: { category: string }) => item.category));
    }).catch(() => {});
  }, [balanceOnly, reloadKey, userId]);
  const [deleteConfirm,setDeleteConfirm]=useState("");
  async function archive(item: Listing) {
    if (busy) return;
    setBusy(item.id);
    setError("");
    setNotice("");
    try {
      const response=await fetch('/api/listings',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:item.id})});
      if(!response.ok)throw new Error('archive_failed');
      setListings((current) => current.map((x) => x.id === item.id ? { ...x, status: "archived", deleted_at: new Date().toISOString() } : x));
      setDeleteConfirm("");
      setNotice("Elan silindi.");
    } catch {
      setError("Elanı silmək mümkün olmadı. Yenidən cəhd et.");
    } finally {
      setBusy("");
    }
  }

  const paidRestore = () => setPayment({ title: "Ödənişlə bərpa", text: "Müddəti bitmiş və ya silinmiş elanın bərpası ödənişlidir. Bərpa edilən elan yenidən 30 gün yayımlanır." });
  const paidSubmit = () => setPayment({ title: "Ödənişlə göndərmə", text: "Bu kateqoriyada aylıq pulsuz elan limitiniz dolub. Elanı yoxlamaya göndərmək üçün ödəniş lazımdır." });
  // Restoring is a paid step (payments are not connected yet, so this opens the payment notice).
  // Only the leader restores their own listings for free.
  async function restore(item: Listing) {
    if (busy) return;
    if (!leader) { paidRestore(); return; }
    setBusy(item.id); setError(""); setNotice("");
    try {
      const response = await fetch("/api/listings/restore", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id }) });
      if (!response.ok) throw new Error();
      setNotice("Elan yenidən 30 gün müddətinə yayımlandı (rəhbər üçün pulsuz).");
      setReloadKey(key => key + 1);
    } catch { setError("Elanı bərpa etmək mümkün olmadı. Yenidən cəhd edin."); }
    finally { setBusy(""); }
  }
  async function submitWaiting(item: Listing) {
    if (busy) return;
    setBusy(item.id); setError(""); setNotice("");
    try {
      const response = await fetch("/api/listings/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id }) });
      if (response.status === 429) { paidSubmit(); return; }
      if (!response.ok) throw new Error();
      setNotice("Elan yoxlamaya göndərildi.");
      setReloadKey(key => key + 1);
    } catch { setError("Elanı göndərmək mümkün olmadı. Yenidən cəhd edin."); }
    finally { setBusy(""); }
  }
  const matchesTab=(item:Listing,status:string)=>{if(status==="deleted")return !!item.deleted_at;if(item.deleted_at)return false;if(status==="payment")return !!item.payment_required;if(item.payment_required)return false;const current=effectiveListingStatus(item);if(status==="expired")return ["expired","archived"].includes(current);return current===status;};
  return (
    <>
      <Header />
      <main className="wrap dashboard accountDashboard">
        {loading ? (
          <p role="status">Yüklənir...</p>
        ) : !userId ? (
          <div className="empty">
            <h2>
              Hesabına daxil ol
            </h2>
            <p>Elanlarını və onların vəziyyətini burada görə bilərsən.</p>
            <Link className="add" href={balanceOnly ? "/login?next=/balance" : "/login?next=/profile"}>
              Daxil ol / Qeydiyyatdan keç
            </Link>
          </div>
        ) : (
          <><div className={`cabinetLayout screen-${screen}`}>
            <aside className="cabinetSidebar">
              <section className="kzProfileCard">
                <Link href="/account" className="kzProfileAvatarLink" aria-label="Profil şəklini dəyiş"><UserAvatar src={avatar} name={identity} className="large"/></Link>
                <h1>{identity||"Profil"}</h1>
                {profileNumber&&<p>Profil № {profileNumber}</p>}
                {accountPhone ? <p>Tel: {formatContact(accountPhone)}</p> : <Link href="/account">Telefon nömrəni əlavə et</Link>}
                {accountEmail&&<p className="kzProfileEmail">{accountEmail}</p>}
              </section>
              {!balanceOnly && <BalancePreview compact/>}
            <nav id="cabinet-menu" className="cabinetNav cabinetCards" aria-label="Şəxsi kabinet">
              <Link href="/profile?section=listings" onClick={()=>openSection('listings')} aria-current={!balanceOnly && section === "listings" ? "page" : undefined}>
                <span className="kzNavIcon"><NavigationIcon name="home"/></span><span>Mənim elanlarım
              </span></Link>
              
              <Link href="/account"><span className="kzNavIcon"><NavigationIcon name="account"/></span><span>Profil</span></Link>
                            <Link href="/profile?section=transactions" onClick={()=>openSection('transactions')} aria-current={section === "transactions" ? "page" : undefined}><span className="kzNavIcon"><NavigationIcon name="history"/></span><span>Əməliyyat tarixçəsi</span></Link>
              <Link href="/profile?section=cards" onClick={()=>openSection('cards')} aria-current={section === "cards" ? "page" : undefined}><span className="kzNavIcon"><NavigationIcon name="card"/></span><span>Mənim kartlarım</span></Link>
              <Link href="/profile?section=limits" onClick={()=>openSection('limits')} aria-current={section === "limits" ? "page" : undefined}><span className="kzNavIcon"><NavigationIcon name="limits"/></span><span>Limitlər</span></Link>
              <div className="cabinetNavFoot">
                {admin && <Link className="kzMenuRow" href="/admin"><span className="kzMenuIcon admin"><ShieldCheck size={18} strokeWidth={2} /></span><span>{staffRole==='leader'?'Rəhbər paneli':'Admin paneli'}</span><ChevronRight className="kzMenuChevron" aria-hidden="true" size={18} strokeWidth={1.75} /></Link>}
              </div>
            </nav>
            </aside>
            <div className="cabinetContent">
              <div className="cabinetBack">{balanceOnly?<Link href="/profile" aria-label="Kabinetə qayıt"><ChevronLeft aria-hidden="true" size={22} strokeWidth={2} /></Link>:<Link href="/profile" aria-label="Kabinetə qayıt"><ChevronLeft aria-hidden="true" size={22} strokeWidth={2} /></Link>}<strong>{balanceOnly?"Balans":sectionTitles[section]}</strong></div>
              {balanceOnly ? <BalancePreview /> : section === "transactions" ? <WalletActivity/> : section === "cards" ? <SavedCards/> : section === "limits" ? <AccountLimits/> : <>
              <div className="kzOwnHead">
                <h2>Elanlarım{refreshing && <span className="kzSpinner" role="status" aria-label="Yenilənir" />}</h2>
                <Link className="kzButton" href="/new"><Plus className="kzI kzIL" aria-hidden="true" size={16} strokeWidth={2.25} />Yeni elan</Link>
              </div>
              <div className="kzOwnTabs" role="group" aria-label="Elan vəziyyəti">
                {listingTabs.map(([status, label]) => (
                  <button key={status} type="button" aria-pressed={statusFilter === status} onClick={() => { setStatusFilter(status); setNotice(""); setError(""); }}>
                    {label}<b>{listings.filter((x) => matchesTab(x, status)).length}</b>
                  </button>
                ))}
              </div>
              {notice && <p className="kzOwnNotice" role="status">{notice}</p>}
              {payment && <PaymentDialog title={payment.title} text={payment.text} onClose={() => setPayment(null)} />}
              {!listings.some((x) => matchesTab(x, statusFilter)) ? (
                <div className="kzOwnEmpty">
                  <EmptyArt kind="listings" />
                  <p>{emptyText[statusFilter]}</p>
                  {(statusFilter === "published" || !listings.length) && <Link className="kzButton" href="/new">Elan yerləşdir</Link>}
                </div>
              ) : (
                <div className="accountListings">
                  {listings.filter((x) => matchesTab(x, statusFilter)).map((x) => {
                    const current = effectiveListingStatus(x), expired = ["expired", "archived"].includes(current);
                    const href = current === "published" ? `/listings/${x.id}` : `/profile/listings/${x.id}`;
                    const promo = activePromotion(x);
                    return <article key={x.id} className={x.deleted_at ? "kzOwnDeleted" : undefined}>
                      <Link href={href} aria-label={`${x.title} — elana bax`} className="ownedPhoto"><img src={x.images?.[0] || "/placeholder.svg"} alt="" /></Link>
                      <div className="kzOwnBody">
                        <div className="kzOwnTop"><span className={`status ${x.deleted_at ? "archived" : x.payment_required ? "payment" : expired ? "expired" : current}`}>{x.deleted_at ? "Silinib" : x.payment_required ? "Ödəniş gözləyir" : statusName(expired ? "expired" : current)}</span>{promo && <span className={`kzOwnPromo ${promo}`}>{promo === "premium" ? "Premium" : "VIP"}</span>}</div>
                        <h3><Link href={href}>{x.title}</Link></h3>
                        <p className="kzOwnPrice">{money(x.price)} ₼ / {periodName(x.rental_period)} · {x.city}</p>
                        <p className="kzOwnMeta">{x.listing_no ? `№ ${x.listing_no} · ` : ""}Baxış: {x.views ?? 0}</p>
                        <p className="kzOwnDates">
                          {current === "published" && x.expires_at && <span>Aktivdir: {shortDate(x.expires_at)} tarixinədək</span>}
                          {expired && !x.deleted_at && <span>Müddəti bitib: {shortDate(x.expires_at || x.created_at)}</span>}
                          {current === "pending" && <span>Təsdiqdən sonra yayımlanacaq.</span>}
                          {promo && x.promotion_until && <span>{promo === "premium" ? "Premium" : "VIP"}: {shortDate(x.promotion_until)} tarixinədək</span>}
                        </p>
                        {x.payment_required && !x.deleted_at && <p className="kzOwnHint">Bu kateqoriyada pulsuz limit dolub. Ödənişdən sonra elan yoxlamaya göndəriləcək.</p>}
                        {current === "rejected" && x.rejection_reason && <p className="kzOwnReason"><strong>Rədd səbəbi:</strong> {x.rejection_reason}</p>}
                        {expired && !x.deleted_at && <p className="kzOwnHint">{leader ? "Bərpa sizin üçün pulsuzdur." : "Bərpa ödənişlidir."} Bərpa olunmasa, 180 gün sonra arxivə keçir.</p>}
                        {x.deleted_at && <p className="kzOwnHint">Silinib: {shortDate(x.deleted_at)}. {leader ? "Bərpa sizin üçün pulsuzdur." : "Bərpa ödənişlidir."} 180 gün sonra arxivə keçir.</p>}
                      </div>
                      <div className="accountItemActions">
                        {x.payment_required && !x.deleted_at ? <>
                            <button type="button" className="kzButton" disabled={!!busy} onClick={() => void submitWaiting(x)}>{busy === x.id ? "Gözləyin..." : "Ödəniş et"}</button>
                            <Link className="kzButtonGhost" href={`/edit/${x.id}`}>Redaktə et</Link>
                          </>
                          : expired ? <button type="button" className="kzButton" disabled={!!busy} onClick={() => void restore(x)}>{busy === x.id ? "Gözləyin..." : leader ? "Bərpa et" : "Ödənişlə bərpa et"}</button>
                          : current === "rejected" ? <Link className="kzButton" href={`/edit/${x.id}`}>Düzəlt və göndər</Link>
                          : <>
                            <Link className="kzButtonGhost" href={`/edit/${x.id}`}>Redaktə et</Link>
                            {current === "published" && <PromotionOptions label="Reklam et" listingId={x.id} />}
                          </>}
                        {!x.deleted_at && <button type="button" className="kzDangerLink" disabled={!!busy} onClick={() => setDeleteConfirm(x.id)}><Trash2 aria-hidden="true" size={15} strokeWidth={2} />Sil</button>}
                      </div>
                      {deleteConfirm===x.id && <div className="deleteListingConfirm" role="group" aria-label="Elanı silməyi təsdiqlə"><p>Elan saytdan çıxarılacaq və «Silinmiş» bölməsinə keçəcək. Silmək pulsuz limiti geri qaytarmır.</p><button type="button" className="kzDangerButton" disabled={!!busy} onClick={()=>archive(x)}>Bəli, sil</button><button type="button" className="kzButtonGhost" disabled={!!busy} onClick={()=>setDeleteConfirm("")}>Ləğv et</button></div>}
                    </article>;
                  })}
                </div>
              )}
              </>}
            </div>
          </div>
          
          </>
        )}
        {error && <div className="kzErrorBar" role="alert"><span>{error}</span><button type="button" className="kzButtonGhost" onClick={()=>setReloadKey(key=>key+1)}>Yenidən cəhd et</button></div>}
      </main>
      <Footer />
    </>
  );
}
