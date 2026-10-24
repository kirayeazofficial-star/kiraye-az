"use client";
import PhotoMark from "./PhotoMark";
import PromotionOptions from "./PromotionOptions";
import { formatContact } from "../../lib/contact-mask";
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
  const [isOwner,setIsOwner]=useState(false);
  useEffect(()=>{if(!supabase)return;let active=true;supabase.auth.getUser().then(({data})=>{if(active)setIsOwner(!!data.user && data.user.id===item.owner_id);}).catch(()=>{});const {data}=supabase.auth.onAuthStateChange((_event,session)=>{if(active)setIsOwner(!!session&&session.user.id===item.owner_id);});return()=>{active=false;data.subscription.unsubscribe();};},[item.owner_id]);
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
        await fetch('/api/listing-view',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:item.id}),keepalive:true});
      }catch{/* Statistics never interrupt browsing. */}
    },1500);
    return()=>{active=false;clearTimeout(timer);};
  },[item.id,item.owner_id,item.status,item.demo]);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const imageCount = item.images?.length ?? 0;
  const selectedImage = Math.min(image, Math.max(0, imageCount - 1));
  useEffect(() => { setImage(0); }, [item.id]);
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
            const touch = event.touches.length === 1 ? event.touches[0] : null;
            touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
          }}
          onTouchCancel={() => { touchStart.current = null; }}
          onTouchEnd={(event) => {
            const start = touchStart.current;
            touchStart.current = null;
            const touch = event.changedTouches[0];
            if (!start || !touch) return;
            const dx = touch.clientX - start.x, dy = touch.clientY - start.y;
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.25)
              moveImage(dx < 0 ? 1 : -1);
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
        <PhotoMark src={item.images?.[selectedImage]} />
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
            : `Elan tarixi: ${new Date(item.created_at).toLocaleDateString("az-AZ")}`}
        </p>
        {!item.demo && item.seller_since && Number.isFinite(Date.parse(item.seller_since)) && (
          <p className="muted">Elan sahibi {new Date(item.seller_since).toLocaleDateString("az-AZ", { month: "long", year: "numeric", timeZone: "Asia/Baku" })} tarixindən qeydiyyatdadır.</p>
        )}
        <strong className="detailPrice">
          {money(item.price)} ₼{" "}
          <small>/ {periodName(item.rental_period)}</small>
        </strong>
        {isOwner && !item.demo && <div className="detailPromotion"><PromotionOptions eligible={item.status === "published"} /></div>}
        {phone && !item.demo ? (
          <div className="contactActions">
            <a className="add" href={`tel:${phone}`}>
              Zəng et · {formatContact(item.contact)}
            </a>
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
        <div className="detailTools">
          <button
            className="secondary"
            aria-pressed={favorite}
            onClick={toggleFavorite}
          >
            {favorite ? "♥ Seçilmişlərdə" : "♡ Seçilmişlərə əlavə et"}
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
                <dt>{label}</dt>
                <dd>{key === "delivery_fee" ? `${money(Number(value))} ₼` : key === "delivery_method" && value === "Hər ikisi" ? "Özün götür və ya çatdırılma" : value}</dd>
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
          Əmlakı görmədən beh göndərmə. Tarix, depozit və qaytarılma şərtlərini
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
    </div>
  );
}
