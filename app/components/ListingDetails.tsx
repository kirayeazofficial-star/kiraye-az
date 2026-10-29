"use client";
import { Calculator, ChevronDown, Flag, ChevronLeft, ChevronRight, MapPin, Pencil, Phone, Share2 } from "lucide-react";
import PromotionOptions from "./PromotionOptions";
import dynamic from "next/dynamic";
const ListingMap = dynamic(() => import("./LocationMap"), { ssr: false, loading: () => <div className="kzMap kzMapLoading kzMapListing" /> });
import { keyFacts } from "../../lib/listing-facts";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import { publicDate, publicMonthYear } from "../../lib/public-date";
import ListingSuggestions from "./ListingSuggestions";
import BannerStrip from "./BannerStrip";
import SideBanners from "./SideBanners";
import ImageViewer from "./ImageViewer";
import NavigationIcon from './NavigationIcon';
import PromotionBadges from "./PromotionBadges";
import PhotoMark from "./PhotoMark";
import UserAvatar from "./UserAvatar";
import { formatContact, partiallyHiddenContact } from "../../lib/contact-mask";
import { minimumRentalLabel } from "../../lib/rental-details";
import { extraAttributeLabels } from "../../lib/listing-form-options";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import RentalEstimator from "./RentalEstimator";
import {
  Listing,
  categoryName,
  money,
  periodName,
  readFavorites,
} from "../../lib/marketplace";
import { normalizePhone, reportReasons } from "../../lib/rental-details";
export default function ListingDetails({
  item,
  compact = false,
}: {
  item: Listing;
  compact?: boolean;
}) {
  const [phoneShown,setPhoneShown]=useState(false);
  const [mounted,setMounted]=useState(false);
  useEffect(()=>setMounted(true),[]);
  const [publicInfo,setPublicInfo]=useState<{seller_name?:string;seller_avatar?:string|null;views?:number;mine?:boolean}|null>(null);
  useEffect(()=>{setPhoneShown(false);setPublicInfo(null);if(item.demo||item.status!=="published")return;let active=true;fetch(`/api/listing-info?id=${encodeURIComponent(item.id)}`,{cache:'no-store'}).then(response=>response.json()).then(data=>{if(active&&data&&typeof data==='object'&&!data.error)setPublicInfo(data);}).catch(()=>{});return()=>{active=false;};},[item.id,item.status,item.demo]);
  const [isOwner,setIsOwner]=useState(false);
  const [ownerReady,setOwnerReady]=useState(false);
  useEffect(()=>{let active=true;setOwnerReady(false);fetch('/api/auth/host',{cache:'no-store'}).then(response=>response.json()).then(data=>{if(active)setIsOwner(data.user?.id===item.owner_id);}).catch(()=>{}).finally(()=>{if(active)setOwnerReady(true);});return()=>{active=false;};},[item.owner_id]);
  const effectiveOwner=isOwner||publicInfo?.mine===true;
  const [image, setImage] = useState(0),
    [favorite, setFavorite] = useState(false),
    [notice, setNotice] = useState(""),
    [report, setReport] = useState(false),
    [busy, setBusy] = useState(false),
    [reported, setReported] = useState(false);
  useEffect(()=>{
    if(item.demo||item.status!=="published")return;
    let active=true;
    const timer=setTimeout(async()=>{
      try{if(!active||effectiveOwner)return;
        await fetch('/api/listing-view',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:item.id}),keepalive:true});
      }catch{/* Statistics never interrupt browsing. */}
    },1500);
    return()=>{active=false;clearTimeout(timer);};
  },[item.id,item.owner_id,item.status,item.demo,effectiveOwner]);
  const [photoRatio, setPhotoRatio] = useState(4 / 3);
  const facts = keyFacts(item);
  // On phones a long specification list is cut after 8 rows so "Bənzər elanlar" stays within reach.
  const specsList = useRef<HTMLDListElement>(null);
  const [specsOpen, setSpecsOpen] = useState(false), [specCount, setSpecCount] = useState(0);
  useEffect(() => { setSpecCount(specsList.current?.children.length ?? 0); }, [item]);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const imageCount = item.images?.length ?? 0;
  const selectedImage = Math.min(image, Math.max(0, imageCount - 1));
  useEffect(() => { setImage(0); setViewerOpen(false); }, [item.id]);
  useEffect(() => setFavorite(readFavorites().includes(item.id)), [item.id]);
  function moveImage(direction: number) {
    // No wrap-around: at the last photo a further swipe stays on it, like the big classified sites.
    if (imageCount > 1) setImage((current) => Math.max(0, Math.min(imageCount - 1, Math.min(current, imageCount - 1) + direction)));
  }
  function toggleFavorite() {
    const saved = readFavorites();
    const next = favorite
      ? saved.filter((x) => x !== item.id)
      : [...saved, item.id];
    try {
      localStorage.setItem("kiraye-favorites", JSON.stringify(next));
      window.dispatchEvent(new Event("kiraye:favorites"));
      setFavorite(!favorite);
    } catch {
      setNotice("Seçilmişləri saxlamaq mümkün olmadı.");
    }
  }
  async function share() {
    const url = `${window.location.origin}/listings/${item.id}`;
    try {
      if (navigator.share) await navigator.share({ title: item.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setNotice("Elanın keçidi kopyalandı.");
      }
    } catch (err) {
      if (!(err instanceof Error && err.name === "AbortError"))
        setNotice(`Elanın ünvanı: ${url}`);
    }
  }
  async function sendReport(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    if (item.demo) {
      setNotice("Nümunə elana şikayət göndərilmir.");
      return;
    }
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      const message = String(form.get("message") ?? "").trim();
      if (message.length < 10 || message.length > 1000) {
        setNotice("Əlavə məlumat 10–1000 simvol olmalıdır.");
        return;
      }
      const response=await fetch('/api/listing-info',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:item.id,reason:form.get('reason'),message})}),result=await response.json();
      if(!response.ok){if(result.error==='SIGN_IN_REQUIRED')throw new Error('SIGN_IN_REQUIRED');if(result.error==='OWN_LISTING')throw new Error('OWN_LISTING');throw new Error(result.error||'REPORT_FAILED');}
      setReported(true);
      setReport(false);
      setNotice("Şikayətiniz qeydə alındı. İdarəçi yoxlayacaq.");
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      setNotice(
        code === 'SIGN_IN_REQUIRED' ? 'Şikayət göndərmək üçün hesabına daxil ol.' : code === 'OWN_LISTING' ? 'Öz elanına şikayət göndərə bilməzsən. Elanı kabinetdən redaktə et.' : 'Şikayət göndərilmədi. Bir az sonra yenidən yoxla.',
      );
    } finally {
      setBusy(false);
    }
  }
  const phone = normalizePhone(item.contact || "");
  const formatDate = (value: string) =>
    new Date(`${value}T12:00:00`).toLocaleDateString("az-AZ");
  return (
    <div className={`listingDetails ${compact ? "compactDetails" : ""}`}>
      <div className="listingGallery" role="region" aria-label="Elan şəkilləri"
        tabIndex={imageCount > 1 ? 0 : undefined}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            moveImage(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}>
        <div className="galleryStage" style={{["--ratio" as string]:String(photoRatio),["--bg" as string]:`url("${item.images?.[selectedImage]||"/placeholder.svg"}")`} as CSSProperties}
          onTouchStart={(event) => {
            swiped.current = false;
            const touch = event.touches.length === 1 ? event.touches[0] : null;
            touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
          }}
          onTouchMove={(event) => { if(event.touches.length !== 1) {touchStart.current = null; swiped.current = true;} }}
          onTouchCancel={() => { touchStart.current = null; }}
          onTouchEnd={(event) => {
            const start = touchStart.current;
            touchStart.current = null;
            const touch = event.changedTouches[0];
            if (!start || !touch) return;
            const dx = touch.clientX - start.x, dy = touch.clientY - start.y;
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.25) {
              swiped.current = true;
              moveImage(dx < 0 ? 1 : -1);
            }
          }}>
        <button type="button" className="galleryOpen" aria-label="Şəkli böyüt" onClick={() => {
          if (!swiped.current) setViewerOpen(true);
          swiped.current = false;
        }}>
        <img
          className="listingMainImage"
          src={item.images?.[selectedImage] || "/placeholder.svg"}
          alt={item.title}
          onLoad={(e) => { const img = e.currentTarget; if (selectedImage === 0 && img.naturalWidth && img.naturalHeight) setPhotoRatio(Math.min(16 / 9, Math.max(1, img.naturalWidth / img.naturalHeight))); }}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/placeholder.svg";
          }}
        />
        </button>
        <PhotoMark src={item.images?.[selectedImage]} />
        <PromotionBadges item={item}/>
        {imageCount > 1 && <>
          {selectedImage > 0 && <button type="button" className="galleryArrow previous" aria-label="Əvvəlki şəkil" onClick={() => moveImage(-1)}><ChevronLeft aria-hidden="true" size={22} strokeWidth={2} /></button>}
          {selectedImage < imageCount - 1 && <button type="button" className="galleryArrow next" aria-label="Növbəti şəkil" onClick={() => moveImage(1)}><ChevronRight aria-hidden="true" size={22} strokeWidth={2} /></button>}
          <span className="galleryCounter" aria-live="polite" aria-atomic="true">{selectedImage + 1} / {imageCount}</span>
          <button type="button" className="galleryAll" onClick={() => setViewerOpen(true)}>Bütün şəkillər</button>
        </>}
        </div>
        {imageCount > 1 && (
          <div className="thumbnails">
            {item.images.map((src, i) => (
              <button
                type="button"
                aria-label={`${i + 1}-ci şəkil`}
                aria-pressed={selectedImage === i}
                key={src}
                onClick={() => setImage(i)}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>
      {viewerOpen && <ImageViewer images={imageCount ? item.images : ["/placeholder.svg"]} title={item.title}
        index={selectedImage} onChange={setImage} onClose={() => setViewerOpen(false)}
        actions={<>
          {!effectiveOwner&&<button type="button" className={favorite ? "on" : ""} aria-label={favorite ? "Seçilmişlərdən çıxar" : "Seçilmişlərə əlavə et"} aria-pressed={favorite} onClick={toggleFavorite}><NavigationIcon name="heart" filled={favorite}/></button>}
          <button type="button" aria-label="Elanı paylaş" onClick={share}><Share2 aria-hidden="true" size={20} strokeWidth={2} /></button>
        </>}/>}
      <div className="detailHead">
        {(compact||item.demo)&&<span className="tag">
          {categoryName(item.category)}
          {item.demo ? " · Nümunə elan" : ""}
        </span>}
        <div className="kzTitleRow">
        {compact ? (
          <h2 id="detail-title">{item.title}</h2>
        ) : (
          <h1>{item.title}</h1>
        )}
        <div className="kzTitleActions">
          {!effectiveOwner&&<button type="button" aria-label={favorite ? "Seçilmişlərdən çıxar" : "Seçilmişlərə əlavə et"} aria-pressed={favorite} onClick={toggleFavorite}><NavigationIcon name="heart" filled={favorite}/></button>}
          <button type="button" aria-label="Elanı paylaş" onClick={share}><Share2 aria-hidden="true" size={20} strokeWidth={1.75} /></button>
          {!item.demo && !effectiveOwner && !reported && <button type="button" aria-label="Bu elandan şikayət et" title="Şikayət et" onClick={() => { setReport(true); requestAnimationFrame(() => document.getElementById("kz-report")?.scrollIntoView({ behavior: "smooth", block: "center" })); }}><Flag aria-hidden="true" size={19} strokeWidth={1.75} /></button>}
        </div>
        </div>
        <p className="muted">
          <MapPin className="pinIcon" aria-hidden="true" size={14} strokeWidth={2} /> {item.city}
          {item.district ? `, ${item.district}` : ""} ·{" "}
          {item.demo
            ? "Nümunə"
            : publicDate(item.created_at)}
        </p>
      </div>
      <div className="detailSide">
        <strong className="detailPrice">
          {money(item.price)} ₼{" "}
          <small>/ {periodName(item.rental_period)}</small>
        </strong>
        {facts.length > 0 && <dl className="kzKeyFacts">{facts.map(fact => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>}
        {effectiveOwner ? (
          <div className="kzOwnerBox">
            {item.status === "published" && <div className="kzPromoCards">
              <PromotionOptions kind="bump" card />
              <PromotionOptions kind="vip" card />
              <PromotionOptions kind="premium" card />
            </div>}
            <div className="kzOwnerRow">
              <Link className="kzButtonGhost" href={`/edit/${item.id}`}><Pencil aria-hidden="true" size={16} strokeWidth={1.75} />Redaktə et</Link>
            </div>
            {item.expires_at && <p className="kzOwnerMeta">Elan {new Date(item.expires_at).toLocaleDateString("ru-RU")} tarixinədək aktivdir</p>}
          </div>
        ) : phone && !item.demo ? (
          <div className="contactActions">
            {ownerReady&&<Link className="secondary" href={`/messages?listing=${encodeURIComponent(item.id)}`}>Mesaj yaz</Link>}
            {phoneShown ? <a className="add kzPhoneShown" href={`tel:${phone}`} aria-label={`Zəng et: ${formatContact(item.contact)}`}><Phone className="kzI kzIL" aria-hidden="true" size={17} strokeWidth={2.25} />{formatContact(item.contact)}</a> : <button type="button" className="add" onClick={()=>setPhoneShown(true)} aria-label="Nömrəni göstər"><Phone className="kzI kzIL" aria-hidden="true" size={17} strokeWidth={2.25} />Nömrəni göstər · {partiallyHiddenContact(item.contact)}</button>}
            <a
              className="secondary"
              href={`https://wa.me/${phone.slice(1)}?text=${encodeURIComponent(`Salam, kirayeal.az saytındakı “${item.title}” elanınızla maraqlanıram.`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
               WhatsApp
            </a>
          </div>
        ) : (
          <p className="notice">
            {item.demo
              ? "Nümunə elandır, real kirayə təklifi deyil."
              : "Əlaqə nömrəsi düzgün göstərilməyib."}
          </p>
        )}
        {phoneShown && !effectiveOwner && <p className="phoneSafety" role="status">Diqqət: beh göndərməmişdən əvvəl sövdələşmənin təhlükəsiz olduğundan əmin ol. Kartının PIN/CVV-sini və SMS kodunu paylaşma.</p>}
        {compact && (
          <div className="detailTools">
            <Link href={`/listings/${item.id}`} className="secondary">
              Ayrıca səhifədə aç<ChevronRight className="kzI kzIR" aria-hidden="true" size={16} strokeWidth={2.25} />
            </Link>
          </div>
        )}
        {!item.demo && item.owner_id && !effectiveOwner && <section className="sellerCard">
          <UserAvatar src={publicInfo?.seller_avatar} name={publicInfo?.seller_name||item.attributes?.contact_name||'E'} className="sellerAvatar"/>
          <div>
            <strong>{publicInfo?.seller_name||item.attributes?.contact_name||'Elan sahibi'}</strong>
            {typeof item.attributes?.owner_type === "string" && item.attributes.owner_type && <span className="kzOwnerType">{item.attributes.owner_type}</span>}
            {item.seller_since && Number.isFinite(Date.parse(item.seller_since)) && <small>{publicMonthYear(item.seller_since)} tarixindən saytdadır</small>}
            <a href={`/?owner=${encodeURIComponent(item.owner_id)}#elanlar`}>Bütün elanları<ChevronRight className="kzI kzIR" aria-hidden="true" size={16} strokeWidth={2.25} /></a>
          </div>
        </section>}
      </div>
      <div className="listingInfo">
        <h3>Elan haqqında</h3>
        <p className="description">{item.description}</p>
        {!item.demo && <div className="publicListingMeta footMeta">{item.listing_no&&<span>Elan № {item.listing_no}</span>}{(()=>{const updated=(item as Listing&{updated_at?:string}).updated_at||item.created_at;return updated&&Number.isFinite(Date.parse(updated))?<span>Yeniləndi: {publicDate(updated)}</span>:null;})()}{/* A small number makes a listing look unpopular: visitors see the count from 15 views, the owner always. */}{publicInfo?.views!==undefined&&Number.isFinite(Number(publicInfo.views))&&(effectiveOwner||Number(publicInfo.views)>=15)&&<span>Baxış sayı: {Number(publicInfo.views)}</span>}</div>}

        <dl ref={specsList} className={`detailSpecs${specsOpen ? "" : " kzSpecsCollapsed"}`}>
          <div>
            <dt>Kateqoriya</dt>
            <dd>{categoryName(item.category)}</dd>
          </div>
          <div>
            <dt>Şəhər</dt>
            <dd>{item.city}{item.district ? `, ${item.district}` : ""}</dd>
          </div>
          <div>
            <dt>Qiymət</dt>
            <dd>{money(item.price)} ₼ / {periodName(item.rental_period)}</dd>
          </div>
          {item.rooms && (
            <div>
              <dt>Otaq</dt>
              <dd>{item.rooms}</dd>
            </div>
          )}
          {item.area_m2 && (
            <div>
              <dt>Sahə</dt>
              <dd>{item.area_m2} m²</dd>
            </div>
          )}
          <div>
            <dt>Depozit</dt>
            <dd>
              {Number(item.deposit) > 0
                ? `${money(item.deposit!)} ₼`
                : item.deposit === 0
                  ? "Tələb olunmur"
                  : "Sahibindən dəqiqləşdir"}
            </dd>
          </div>
          <div>
            <dt>Minimum müddət</dt>
            <dd>{minimumRentalLabel(item)}</dd>
          </div>
          {item.attributes?.brand && (
            <div>
              <dt>Marka / model</dt>
              <dd>
                {item.attributes.brand} {item.attributes.model}
              </dd>
            </div>
          )}
          {item.attributes?.year && (
            <div>
              <dt>Buraxılış ili</dt>
              <dd>{item.attributes.year}</dd>
            </div>
          )}
          {item.attributes?.gearbox && (
            <div>
              <dt>Sürətlər qutusu</dt>
              <dd>{item.attributes.gearbox}</dd>
            </div>
          )}
          {Object.entries(extraAttributeLabels).map(([key, label]) => {
            const value =
              item.attributes?.[key as keyof typeof extraAttributeLabels];
            return value &&
              key !== "contact_name" ? (
              <div key={key}>
                <dt>{key === "total_floors" && item.category === "villa" ? "Mərtəbə sayı" : label}</dt>
                <dd>{key === "kind" && item.category === "property" && value === "Bağ evi" ? "Həyət evi" : key === "delivery_fee" ? `${money(Number(value))} ₼` : key === "delivery_method" && value === "Hər ikisi" ? "Özün götür və ya çatdırılma" : value}</dd>
              </div>
            ) : null;
          })}
          {/* Amenities as one row of the list (on phones inside "Bütün xüsusiyyətlər") instead of a block of chips. */}
          {!!item.attributes?.amenities?.length && (
            <div className="kzSpecWide">
              <dt>Şərait</dt>
              <dd>{item.attributes.amenities.join(", ")}</dd>
            </div>
          )}
        </dl>
        {specCount > 8 && <button type="button" className="kzSpecsMore" aria-expanded={specsOpen} onClick={() => setSpecsOpen(!specsOpen)}>{specsOpen ? "Daha az göstər" : `Bütün xüsusiyyətlər (${specCount})`}<ChevronDown aria-hidden="true" size={16} strokeWidth={2.25} /></button>}
        {(item.available_from || item.available_until) && (
          <p className="notice">
            Elan sahibinin göstərdiyi mövcudluq:{" "}
            {item.available_from
              ? formatDate(item.available_from)
              : "İstənilən tarix"}{" "}
            —{" "}
            {item.available_until
              ? formatDate(item.available_until)
              : "Son tarix yoxdur"}
            . Tarixi əlaqə saxlayaraq dəqiqləşdir.
          </p>
        )}
        {(() => {
          // Yerləşmə: district / metro chips (search links) and the map; approximate points show an area.
          const metro = typeof item.attributes?.metro === "string" ? item.attributes.metro : "";
          const hasPoint = item.lat != null && item.lng != null;
          if (!item.district && !metro && !hasPoint) return null;
          return <section className="kzLocation" aria-label="Yerləşmə">
            <h3>Yerləşmə</h3>
            {(item.district || metro) && <div className="kzLocationChips">
              {item.district && <Link href={`/?q=${encodeURIComponent(item.district)}#elanlar`}>{item.district} r.</Link>}
              {metro && <Link href={`/?q=${encodeURIComponent(metro)}#elanlar`}>{metro} m.</Link>}
            </div>}
            {hasPoint && <>
              <ListingMap lat={Number(item.lat)} lng={Number(item.lng)} exact={!!item.location_exact} className="kzMapListing" />
              <div className="kzLocationFoot">
                <span>{item.location_exact ? `${item.city}${item.district ? `, ${item.district} r.` : ""}` : "Təxmini ərazi göstərilir. Dəqiq ünvanı elan sahibindən öyrənin."}</span>
                <a href={`https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`} target="_blank" rel="noopener noreferrer">Xəritədə bax</a>
              </div>
            </>}
          </section>;
        })()}
        <details className="kzEstimate"><summary><Calculator aria-hidden="true" size={18} strokeWidth={1.75} />Kirayə xərcini hesabla</summary><RentalEstimator key={item.id} item={item} /></details>
        <p className="safetyNote">
          Kirayə götürəcəyin əşyanı, nəqliyyatı və ya əmlakı görmədən beh göndərmə. Tarix, depozit və qaytarılma şərtlərini
          yazılı razılaşdır. Platforma hazırda ödəniş qəbul etmir.
        </p>
        {!item.demo && !effectiveOwner && !reported && (
          <button className="textButton" onClick={() => setReport(!report)}>
            {report ? "Şikayəti bağla" : "Bu elandan şikayət et"}
          </button>
        )}
        {report && !reported && (
          <form id="kz-report" className="reportForm" onSubmit={sendReport}>
            <h3>Şikayət göndər</h3>
            <label>
              Səbəb
              <select name="reason">
                {reportReasons.map((reason) => (
                  <option key={reason}>{reason}</option>
                ))}
              </select>
            </label>
            <label>
              Əlavə məlumat
              <textarea
                name="message"
                minLength={10}
                maxLength={1000}
                required
                rows={3}
                placeholder="Problemi qısa təsvir et. Şəxsi məlumat yazma."
              />
            </label>
            <button className="secondary" disabled={busy}>
              {busy ? "Göndərilir..." : "Şikayəti göndər"}
            </button>
          </form>
        )}
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
      </div>
      {mounted && !compact && !effectiveOwner && phone && !item.demo && createPortal(<div className="stickyContact" role="group" aria-label="Əlaqə">
        {phoneShown ? <a className="add kzPhoneShown" href={`tel:${phone}`} aria-label={`Zəng et: ${formatContact(item.contact)}`}><Phone className="kzI kzIL" aria-hidden="true" size={17} strokeWidth={2.25} />{formatContact(item.contact)}</a> : <button type="button" className="add" onClick={()=>setPhoneShown(true)}><Phone className="kzI kzIL" aria-hidden="true" size={17} strokeWidth={2.25} />Nömrəni göstər</button>}
        {ownerReady&&<Link className="messageAction" href={`/messages?listing=${encodeURIComponent(item.id)}`}>Mesaj yaz</Link>}
      </div>, document.body)}
      {/* Similar listings right after the details, before the banner, so a visitor who does not like this one moves on. */}
      {!compact && item.status === "published" && !item.demo && <ListingSuggestions item={item}/>}
      {!compact && <div className="kzListingBanner"><BannerStrip placement="listing" /></div>}
      {!compact && <SideBanners />}
    </div>
  );
}
