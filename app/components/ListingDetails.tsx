"use client";
import { publicDate, publicMonthYear } from "../../lib/public-date";
import ListingSuggestions from "./ListingSuggestions";
import ImageViewer from "./ImageViewer";
import NavigationIcon from './NavigationIcon';
import PromotionBadges from "./PromotionBadges";
import PhotoMark from "./PhotoMark";
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
import { supabase } from "../../lib/supabase";
export default function ListingDetails({
  item,
  compact = false,
}: {
  item: Listing;
  compact?: boolean;
}) {
  const [phoneShown,setPhoneShown]=useState(false);
  const [publicInfo,setPublicInfo]=useState<{seller_name?:string;views?:number}|null>(null);
  useEffect(()=>{setPhoneShown(false);setPublicInfo(null);if(!supabase||item.demo||item.status!=="published")return;let active=true;Promise.resolve(supabase.rpc('public_listing_info',{p_listing_id:item.id}).abortSignal(AbortSignal.timeout(3000))).then(({data,error})=>{if(active&&!error&&data&&typeof data==='object'&&!Array.isArray(data))setPublicInfo(data);}).catch(()=>{});return()=>{active=false;};},[item.id,item.status,item.demo]);
  const [isOwner,setIsOwner]=useState(false);
  const [ownerReady,setOwnerReady]=useState(false);
  useEffect(()=>{if(!supabase){setOwnerReady(true);return;}let active=true,authChanged=false;setOwnerReady(false);const {data}=supabase.auth.onAuthStateChange((_event,session)=>{authChanged=true;if(active){setIsOwner(!!session&&session.user.id===item.owner_id);setOwnerReady(true);}});supabase.auth.getUser().then(({data})=>{if(active&&!authChanged){setIsOwner(!!data.user&&data.user.id===item.owner_id);setOwnerReady(true);}}).catch(()=>{if(active&&!authChanged)setOwnerReady(true);});return()=>{active=false;data.subscription.unsubscribe();};},[item.owner_id]);
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
      try{const session=await supabase?.auth.getSession();if(!active||session?.data.session?.user.id===item.owner_id)return;
        const headers:Record<string,string>={'Content-Type':'application/json'};
        if(session?.data.session?.access_token)headers.Authorization=`Bearer ${session.data.session.access_token}`;
        await fetch('/api/listing-view',{method:'POST',headers,body:JSON.stringify({id:item.id}),keepalive:true});
      }catch{/* Statistics never interrupt browsing. */}
    },1500);
    return()=>{active=false;clearTimeout(timer);};
  },[item.id,item.owner_id,item.status,item.demo]);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const imageCount = item.images?.length ?? 0;
  const selectedImage = Math.min(image, Math.max(0, imageCount - 1));
  useEffect(() => { setImage(0); setViewerOpen(false); }, [item.id]);
  useEffect(() => setFavorite(readFavorites().includes(item.id)), [item.id]);
  function moveImage(direction: number) {
    if (imageCount > 1) setImage((current) =>
      (Math.min(current, imageCount - 1) + direction + imageCount) % imageCount,
    );
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
    if (!supabase) {
      setNotice("Şikayət xidməti hazır deyil.");
      return;
    }
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        setNotice("Şikayət göndərmək üçün hesabınıza daxil olun.");
        return;
      }
      if (data.user.id === item.owner_id) {
        setNotice(
          "Öz elanına şikayət göndərə bilməzsən. Dəyişiklik üçün kabinetdə Redaktə et seç.",
        );
        return;
      }
      const message = String(form.get("message") ?? "").trim();
      if (message.length < 10 || message.length > 1000) {
        setNotice("Əlavə məlumat 10–1000 simvol olmalıdır.");
        return;
      }
      const result = await supabase.from("listing_reports").insert({
        listing_id: item.id,
        reporter_id: data.user.id,
        reason: form.get("reason"),
        message,
        status: "open",
      });
      if (result.error?.code === "23505") {
        setReported(true);
        setNotice("Bu elan üçün şikayətiniz artıq qeydə alınıb.");
        return;
      }
      if (result.error) throw result.error;
      setReported(true);
      setReport(false);
      setNotice("Şikayətiniz qeydə alındı. İdarəçi yoxlayacaq.");
    } catch (error) {
      const code = (error as { code?: string })?.code;
      setNotice(
        code === "42501"
          ? "Bu elan üçün şikayət icazəsi yoxdur. Hesabını və elanın yayımlandığını yoxla."
          : code === "42P01" || code === "PGRST205"
            ? "Şikayət xidməti bazada aktivləşdirilməyib. Sayt idarəçisi quraşdırmanı tamamlamalıdır."
            : "Şikayət göndərilmədi. Bir az sonra yenidən yoxlayın.",
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
        <div className="galleryStage"
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
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/placeholder.svg";
          }}
        />
        </button>
        <PhotoMark src={item.images?.[selectedImage]} />
        <PromotionBadges item={item}/>
        {imageCount > 1 && <>
          <button type="button" className="galleryArrow previous" aria-label="Əvvəlki şəkil" onClick={() => moveImage(-1)}>‹</button>
          <button type="button" className="galleryArrow next" aria-label="Növbəti şəkil" onClick={() => moveImage(1)}>›</button>
          <span className="galleryCounter" aria-live="polite" aria-atomic="true">{selectedImage + 1} / {imageCount}</span>
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
        index={selectedImage} onChange={setImage} onClose={() => setViewerOpen(false)}/>}
      <div className="listingInfo">
        <span className="tag">
          {categoryName(item.category)}
          {item.demo ? " · Nümunə elan" : ""}
        </span>
        {compact ? (
          <h2 id="detail-title">{item.title}</h2>
        ) : (
          <h1>{item.title}</h1>
        )}
        <p className="muted">
          ⌖ {item.city}
          {item.district ? `, ${item.district}` : ""} ·{" "}
          {item.demo
            ? "Nümunə"
            : `Elan tarixi: ${publicDate(item.created_at)}`}
        </p>
        {!item.demo && <div className="publicListingMeta">{item.listing_no&&<span>Elan № {item.listing_no}</span>}{publicInfo?.views!==undefined&&Number.isFinite(Number(publicInfo.views))&&<span>Baxış sayı: {Number(publicInfo.views)}</span>}</div>}
        {!item.demo && item.owner_id && <section className="sellerCard"><strong>{publicInfo?.seller_name||item.attributes?.contact_name||'Elan sahibi'}</strong><a href={`/?owner=${encodeURIComponent(item.owner_id)}#elanlar`}>İstifadəçinin bütün elanları</a></section>}
        {!item.demo && item.seller_since && Number.isFinite(Date.parse(item.seller_since)) && (
          <p className="muted">Elan sahibi {publicMonthYear(item.seller_since)} tarixindən qeydiyyatdadır.</p>
        )}
        <strong className="detailPrice">
          {money(item.price)} ₼{" "}
          <small>/ {periodName(item.rental_period)}</small>
        </strong>
        {phone && !item.demo ? (
          <div className="contactActions">
            {ownerReady&&(isOwner?<Link className="secondary" href={`/edit/${item.id}`}>Elanı redaktə et</Link>:<Link className="secondary" href={`/messages?listing=${encodeURIComponent(item.id)}`}>Mesaj yaz</Link>)}
            {phoneShown ? <a className="add" href={`tel:${phone}`}>Zəng et · {formatContact(item.contact)}</a> : <button type="button" className="add" onClick={()=>setPhoneShown(true)} aria-label="Nömrəni göstər">Nömrəni göstər · {partiallyHiddenContact(item.contact)}</button>}
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
        {phoneShown && <p className="phoneSafety" role="status">Diqqət: beh göndərməmişdən əvvəl sövdələşmənin təhlükəsiz olduğundan əmin ol. Kartının PIN/CVV-sini və SMS kodunu paylaşma.</p>}
        <div className="detailTools">
          <button
            className="secondary"
            aria-pressed={favorite}
            onClick={toggleFavorite}
          >
            <NavigationIcon name="heart" filled={favorite}/>{favorite ? "Seçilmişlərdə" : "Seçilmişlərə əlavə et"}
          </button>
          <button className="secondary" onClick={share}>
            Keçidi paylaş
          </button>
          {compact && (
            <Link href={`/listings/${item.id}`} className="secondary">
              Ayrıca səhifədə aç →
            </Link>
          )}
        </div>
        <h3>Elan haqqında</h3>
        <p className="description">{item.description}</p>
        {!!item.attributes?.amenities?.length && (
          <div className="amenityTags">
            {item.attributes.amenities.map((a) => (
              <span key={a}>✓ {a}</span>
            ))}
          </div>
        )}
        <dl className="detailSpecs">
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
        </dl>
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
        <RentalEstimator key={item.id} item={item} />
        <p className="safetyNote">
          Kirayə götürəcəyin əşyanı, nəqliyyatı və ya əmlakı görmədən beh göndərmə. Tarix, depozit və qaytarılma şərtlərini
          yazılı razılaşdır. Platforma hazırda ödəniş qəbul etmir.
        </p>
        {!item.demo && !reported && (
          <button className="textButton" onClick={() => setReport(!report)}>
            {report ? "Şikayəti bağla" : "Bu elandan şikayət et"}
          </button>
        )}
        {report && !reported && (
          <form className="reportForm" onSubmit={sendReport}>
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
      {!compact && item.status === "published" && !item.demo && <ListingSuggestions item={item}/>}
    </div>
  );
}
