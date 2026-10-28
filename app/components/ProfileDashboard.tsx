"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatContact } from "../../lib/contact-mask";
import {WalletActivity,SavedCards} from "./WalletPanels";
import PhotoMark from "./PhotoMark";
import PromotionOptions from "./PromotionOptions";
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
const listingTabs = [["published", "Hazırda saytda"], ["payment", "Ödəniş gözləyir"], ["expired", "Müddəti başa çatmış"], ["pending", "Yoxlanışda"], ["draft", "Dərc olunmamış"]];
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
    [busy, setBusy] = useState(""),
    [notice, setNotice] = useState(""),
    [statusFilter, setStatusFilter] = useState("published");
  useEffect(() => {
    fetch('/api/auth/host',{cache:'no-store'})
      .then(async response => {
        const data=await response.json();if(!data.user)return;
        setUserId(data.user.id);setIdentity(data.user.display_name||data.user.email||'Hesab');setAccountPhone(data.user.phone||'');setAccountEmail(data.user.email||'');
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
          else setError("Elanlarınızı yükləmək mümkün olmadı. Yenidən yoxlayın.");
        }
      })
      .catch(() =>
        setError("Məlumatları yükləmək mümkün olmadı. Yenidən yoxlayın."),
      )
      .finally(() => setLoading(false));
  }, [balanceOnly]);
  const [deleteConfirm,setDeleteConfirm]=useState("");
  async function archive(item: Listing) {
    if (busy) return;
    setBusy(item.id);
    setError("");
    setNotice("");
    try {
      const response=await fetch('/api/listings',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:item.id})});
      if(!response.ok)throw new Error('archive_failed');
      setListings((current) => current.filter((x) => x.id !== item.id));
      setDeleteConfirm("");
      setNotice("Elan silindi.");
    } catch {
      setError("Elanı silmək mümkün olmadı. Yenidən cəhd et.");
    } finally {
      setBusy("");
    }
  }

  function renew(_item: Listing) {
    setError("");
    setNotice("Elanı bərpa etmək ödənişli xidmətdir. Hazırda ödənişlər aktiv olmadığından bərpa etmək mümkün deyil. Heç bir məbləğ tutulmadı.");
  }
  const matchesTab=(item:Listing,status:string)=>{const current=effectiveListingStatus(item);if(status==="expired")return ["expired","archived"].includes(current);if(!status)return true;if(status==="payment")return false;if(status==="draft")return ["draft","rejected"].includes(current);return current===status;};
  async function logout() {
    const response=await fetch('/api/auth/host',{method:'DELETE'});
    if (!response.ok) {
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
                {profileNumber&&<p>ID: {profileNumber}</p>}
                {accountPhone ? <p>Tel: {formatContact(accountPhone)}</p> : <Link href="/account">Telefon nömrəni əlavə et</Link>}
                {accountEmail&&<p className="kzProfileEmail">{accountEmail}</p>}
              </section>
              {!balanceOnly && <BalancePreview compact/>}
            <nav id="cabinet-menu" className="cabinetNav cabinetCards" aria-label="Şəxsi kabinet">
              <Link href="/profile?section=listings" onClick={()=>openSection('listings')} aria-current={!balanceOnly && section === "listings" ? "page" : undefined}>
                <NavigationIcon name="home"/><span>Mənim elanlarım
              </span></Link>
              
              <Link href="/account"><NavigationIcon name="account"/><span>Profil</span></Link>
                            <Link href="/profile?section=transactions" onClick={()=>openSection('transactions')} aria-current={section === "transactions" ? "page" : undefined}><NavigationIcon name="history"/><span>Əməliyyat tarixçəsi</span></Link>
              <Link href="/profile?section=cards" onClick={()=>openSection('cards')} aria-current={section === "cards" ? "page" : undefined}><NavigationIcon name="card"/><span>Mənim kartlarım</span></Link>
              <Link href="/profile?section=limits" onClick={()=>openSection('limits')} aria-current={section === "limits" ? "page" : undefined}><NavigationIcon name="limits"/><span>Limitlər</span></Link>
              <div className="cabinetNavFoot">
                {admin && <Link className="cabinetAdminLink" href="/admin"><NavigationIcon name="account"/><span>{staffRole==='leader'?'Rəhbər paneli':'Admin paneli'}</span></Link>}
                <button type="button" className="textButton cabinetLogout" onClick={logout}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 8l-4 4 4 4"/><path d="M6 12h10"/></svg><span>Hesabdan çıx</span></button>
              </div>
            </nav>
            </aside>
            <div className="cabinetContent">
              <div className="cabinetBack">{balanceOnly?<Link href="/profile" aria-label="Kabinetə qayıt">‹</Link>:<Link href="/profile" aria-label="Kabinetə qayıt">‹</Link>}<strong>{balanceOnly?"Balans":sectionTitles[section]}</strong></div>
              {balanceOnly ? <BalancePreview /> : section === "transactions" ? <WalletActivity/> : section === "cards" ? <SavedCards/> : section === "limits" ? <AccountLimits/> : <>
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
              <div className="profileTabs desktopListingTabs listingStatusStrip" aria-label="Elan vəziyyəti">
                {listingTabs.map(([status, label]) => (
                  <button
                    key={status}
                    className="secondary"
                    aria-pressed={statusFilter === status}
                    onClick={() => setStatusFilter(status)}
                  >
                    {label} (
                    {
                      listings.filter((x) => matchesTab(x,status))
                        .length
                    }
                    )
                  </button>
                ))}
              </div>
              {!!listings.length &&
                !listings.some(
                  (x) => matchesTab(x,statusFilter),
                ) && <p className="notice">Bu bölmədə elan yoxdur.</p>}
              <p className="muted editRule">Elanı gündə bir dəfə redaktə etmək olar. Redaktədən sonra elan yoxlanışa gedir.</p>
              {notice && <p className="notice" role="status">{notice}</p>}
              <div className="accountListings">
                {listings
                  .filter((x) => matchesTab(x,statusFilter))
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
                        <p className="listingViews" title="Eyni IP və brauzerdən təkrar baxışlar gündə bir dəfə sayılır.">Baxış: {x.views ?? 0}</p>
                        <small>{new Date(x.created_at).toLocaleDateString("az-AZ")}</small>
                        {x.expires_at && <p className="muted">Bitmə tarixi: {new Date(x.expires_at).toLocaleDateString("az-AZ")}</p>}
                      </div>
                      <div className="accountItemActions">
                        {["expired", "archived"].includes(effectiveListingStatus(x)) ? <PromotionOptions kind="restore" label="Elanı bərpa et" /> : <>
                          {effectiveListingStatus(x) === "published" && <>
                            <PromotionOptions label="Reklam et" />
                          </>}
                          <Link className="secondary" href={`/edit/${x.id}`}>Redaktə et</Link>
                          <button className="secondary" disabled={!!busy} onClick={() => setDeleteConfirm(x.id)}>{busy === x.id ? "Gözləyin..." : "Elanı sil"}</button>
                        </>}
                      </div>
                    {deleteConfirm===x.id && <div className="deleteListingConfirm" role="group" aria-label="Elanı silməyi təsdiqlə"><p>Elan həmişəlik silinəcək. Bu əməliyyatı geri qaytarmaq olmur.</p><button type="button" className="secondary" disabled={!!busy} onClick={()=>archive(x)}>Bəli, elanı sil</button><button type="button" className="textButton" disabled={!!busy} onClick={()=>setDeleteConfirm("")}>Ləğv et</button></div>}
                    </article>
                  ))}
              </div>
              </>}
            </div>
          </div></>
        )}
        {error && <div className="formError" role="alert"><span>{error}</span><button type="button" className="textButton" onClick={()=>window.location.reload()}>Yenidən yoxla</button></div>}
      </main>
      <Footer />
    </>
  );
}
