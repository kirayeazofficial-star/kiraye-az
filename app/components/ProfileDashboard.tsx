"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatContact } from "../../lib/contact-mask";
import {WalletActivity,SavedCards} from "./WalletPanels";
import PhotoMark from "./PhotoMark";
import NavigationIcon from "./NavigationIcon";
import AccountLimits from "./AccountLimits";
import BalancePreview from "../components/BalancePreview";
import PromotionOptions from "../components/PromotionOptions";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { effectiveListingStatus } from "../../lib/listing-lifecycle";
import { listingPolicyError } from "../../lib/listing-policy";
import { supabase } from "../../lib/supabase";
import {
  Listing,
  loadListings,
  statusName,
  money,
  periodName,
} from "../../lib/marketplace";
const listingTabs = [["", "Hamısı"], ["published", "Yayımlanmış"], ["pending", "Yoxlanılır"], ["rejected", "Rədd edilmiş"], ["draft", "Dərc olunmamış"], ["expired", "Müddəti bitmiş"], ["archived", "Arxiv"]];
export default function ProfileDashboard({ balanceOnly = false }: { balanceOnly?: boolean }) {
  const [section,setSection]=useState("listings"),[profileNumber,setProfileNumber]=useState("");
  useEffect(()=>{const value=new URLSearchParams(window.location.search).get("section");if(value&&["transactions","cards","limits"].includes(value))setSection(value);},[]);
  const [accountPhone,setAccountPhone]=useState("");
  const [views,setViews] = useState<Record<string,number>|null>(null);
  const [identity, setIdentity] = useState(""),
    [userId, setUserId] = useState(""),
    [loading, setLoading] = useState(true),
    [listings, setListings] = useState<Listing[]>([]),
    [error, setError] = useState(""),
    [admin, setAdmin] = useState(false),
    [busy, setBusy] = useState(""),
    [notice, setNotice] = useState(""),
    [statusFilter, setStatusFilter] = useState("");
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const client = supabase;
    client.auth
      .getUser()
      .then(async ({ data, error }) => {
        if (error || !data.user) return;
        setUserId(data.user.id);
        setIdentity(data.user.user_metadata?.full_name || data.user.email || "Hesab");
        setAccountPhone(data.user.user_metadata?.contact_phone || data.user.phone || "");
        const role = await client
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle();
        if(role.data?.profile_no)setProfileNumber(String(role.data.profile_no));
        setAdmin(role.data?.role === "admin");
        if(role.data?.display_name)setIdentity(role.data.display_name);
        if(role.data?.phone)setAccountPhone(role.data.phone);
        if (!balanceOnly) setListings(await loadListings("mine"));
        if(!balanceOnly)void (async()=>{try{const result=await client.rpc('own_listing_view_counts').abortSignal(AbortSignal.timeout(2500));if(!result.error && Array.isArray(result.data))setViews(Object.fromEntries(result.data.filter(row=>typeof row.listing_id==='string' && Number.isFinite(Number(row.views))).map(row=>[row.listing_id,Number(row.views)])));}catch{}})();

      })
      .catch(() =>
        setError("Məlumatları yükləmək mümkün olmadı. Yenidən yoxlayın."),
      )
      .finally(() => setLoading(false));
  }, [balanceOnly]);
  const [deleteConfirm,setDeleteConfirm]=useState("");
  async function archive(item: Listing) {
    if (!supabase || busy) return;
    setBusy(item.id);
    setError("");
    setNotice("");
    try {
      const { error } = await supabase
        .from("listings")
        .update({ status: "archived" })
        .eq("id", item.id)
        .eq("owner_id", userId)
        .eq("status",item.status)
        .select("id")
        .single();
      if (error) throw error;
      setListings((current) => current.map((x) =>
        x.id === item.id ? { ...x, status: "archived" } : x,
      ));
      setDeleteConfirm("");
      setNotice("Elan axtarışdan götürüldü və arxivdə saxlanıldı. Bərpa ödənişli xidmətdir; hazırda ödənişlər aktiv deyil.");
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
  const matchesTab=(item:Listing,status:string)=>!status || (status === "archived" ? ["archived","expired"].includes(effectiveListingStatus(item)) : effectiveListingStatus(item)===status);
  async function logout() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
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
        <div className="sectionTitle accountHeading">
          <div>
            <p className="eyebrow">ŞƏXSİ KABİNET</p>
            <h1>Hesabım</h1>
            <p className="muted">
              {identity || "Elanlarını bir yerdən idarə et."}
            </p>
            {userId && <p className="accountIdentity">{accountPhone ? formatContact(accountPhone) : <Link href="/account">Telefon nömrəni əlavə et</Link>} <span title={userId}>· ID: {profileNumber||userId.slice(0,8)}</span></p>}
          </div>

        </div>
        {loading ? (
          <p role="status">Yüklənir...</p>
        ) : !userId ? (
          <div className="empty">
            <h2>
              {!supabase ? "Giriş xidməti hazırlanır" : "Hesabına daxil ol"}
            </h2>
            <p>Elanlarını və onların vəziyyətini burada görə bilərsən.</p>
            <Link className="add" href={balanceOnly ? "/login?next=/balance" : "/login?next=/profile"}>
              Daxil ol / Qeydiyyatdan keç
            </Link>
          </div>
        ) : (
          <><div className="cabinetLayout">
            <aside className="cabinetSidebar">
              {!balanceOnly && <BalancePreview compact/>}
            <nav className="cabinetNav cabinetCards" aria-label="Şəxsi kabinet">
              <Link href="/profile" aria-current={!balanceOnly && section === "listings" ? "page" : undefined}>
                <NavigationIcon name="home"/><span>Mənim elanlarım
              </span></Link>
              
              <Link href="/account"><NavigationIcon name="account"/><span>Profil</span></Link>
              <Link href="/balance" aria-current={balanceOnly ? "page" : undefined}>Balans</Link>
              <a href="/profile?section=transactions" aria-current={section === "transactions" ? "page" : undefined}><NavigationIcon name="search"/><span>Əməliyyat tarixçəsi</span></a>
              <a href="/profile?section=cards" aria-current={section === "cards" ? "page" : undefined}><NavigationIcon name="account"/><span>Mənim kartlarım</span></a>
              <a href="/profile?section=limits" aria-current={section === "limits" ? "page" : undefined}><NavigationIcon name="search"/><span>Limitlər</span></a>
              {admin && <Link href="/admin">Admin paneli</Link>}
              <button type="button" className="textButton cabinetLogout" onClick={logout}>Hesabdan çıx</button>
            </nav>
            </aside>
            <div className="cabinetContent">
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
              <details className="listingManagementHelp"><summary>Elanı necə idarə edim?</summary><p>Kirayəyə verilib və ya artıq mövcud deyil? “Elanı sil” seç: elan saytda görünməyəcək, məlumatları arxivdə qalacaq. Bərpa ödənişlidir və ödəniş xidməti açılanadək bağlıdır.</p></details>
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
                        <PhotoMark src={x.images?.[0]} />
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
                        <p className="listingViews" title="Sayğac aktivləşdirildikdən sonra eyni IP/brauzerdən təkrar baxışlar gündə bir dəfə sayılır.">{views ? `Baxış: ${views[x.id] ?? 0}` : "Baxış statistikası hələ aktiv deyil"}</p>
                        <small>{new Date(x.created_at).toLocaleDateString("az-AZ")}</small>
                        {x.expires_at && <p className="muted">Bitmə tarixi: {new Date(x.expires_at).toLocaleDateString("az-AZ")}</p>}
                      </div>
                      <div className="accountItemActions">
                        {!["archived","expired"].includes(effectiveListingStatus(x)) && <PromotionOptions eligible={effectiveListingStatus(x) === "published"} />}
                        {["expired", "archived"].includes(effectiveListingStatus(x)) && <button type="button" className="secondary" disabled={!!busy} onClick={() => renew(x)}>{busy === x.id ? "Gözləyin..." : "Bərpa et"}</button>}
                        {!["archived","expired"].includes(effectiveListingStatus(x)) && <Link className="secondary" href={`/edit/${x.id}`}>Redaktə et</Link>}
                        <Link
                          className="secondary"
                          href={
                            effectiveListingStatus(x) === "published"
                              ? `/listings/${x.id}`
                              : `/profile/listings/${x.id}`
                          }
                        >
                          Elana bax
                        </Link>
                        {!["archived","expired"].includes(effectiveListingStatus(x)) && (
                          <button
                            className="secondary"
                            disabled={!!busy}
                            onClick={() => setDeleteConfirm(x.id)}
                          >
                            {busy === x.id ? "Gözləyin..." : "Elanı sil"}
                          </button>
                        )}
                      </div>
                    {deleteConfirm===x.id && <div className="deleteListingConfirm" role="group" aria-label="Elanı silməyi təsdiqlə"><p>Elan saytdan götürüləcək və hesabının arxivində saxlanılacaq. Bərpa ödənişlidir; hazırda ödənişlər bağlıdır.</p><button type="button" className="secondary" disabled={!!busy} onClick={()=>archive(x)}>Bəli, elanı sil</button><button type="button" className="textButton" disabled={!!busy} onClick={()=>setDeleteConfirm("")}>Ləğv et</button></div>}
                    </article>
                  ))}
              </div>
              </>}
            </div>
          </div></>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}
