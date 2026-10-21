"use client";
import { extraAttributeLabels } from "../../lib/listing-form-options";
import { FormEvent, useEffect, useState } from "react";
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
  const [image, setImage] = useState(0),
    [favorite, setFavorite] = useState(false),
    [notice, setNotice] = useState(""),
    [report, setReport] = useState(false),
    [busy, setBusy] = useState(false),
    [reported, setReported] = useState(false);
  useEffect(() => setFavorite(readFavorites().includes(item.id)), [item.id]);
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
      const result = await supabase.from("listing_reports").insert({
        listing_id: item.id,
        reporter_id: data.user.id,
        reason: form.get("reason"),
        message: String(form.get("message") ?? "").trim(),
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
    } catch {
      setNotice("Şikayət göndərilmədi. Bir az sonra yenidən yoxlayın.");
    } finally {
      setBusy(false);
    }
  }
  const phone = normalizePhone(item.contact || "");
  const formatDate = (value: string) =>
    new Date(`${value}T12:00:00`).toLocaleDateString("az-AZ");
  return (
    <div className={`listingDetails ${compact ? "compactDetails" : ""}`}>
      <div className="listingGallery">
        <img
          className="listingMainImage"
          src={item.images?.[image] || "/placeholder.svg"}
          alt={item.title}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/placeholder.svg";
          }}
        />
        {(item.images?.length ?? 0) > 1 && (
          <div className="thumbnails">
            {item.images.map((src, i) => (
              <button
                aria-label={`${i + 1}-ci şəkil`}
                aria-pressed={image === i}
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
            : new Date(item.created_at).toLocaleDateString("az-AZ")}
        </p>
        <strong className="detailPrice">
          {money(item.price)} ₼{" "}
          <small>/ {periodName(item.rental_period)}</small>
        </strong>
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
                : "Tələb olunmur"}
            </dd>
          </div>
          <div>
            <dt>Minimum müddət</dt>
            <dd>{item.min_days ?? 1} gün</dd>
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
            return value ? (
              <div key={key}>
                <dt>{label}</dt>
                <dd>{value}</dd>
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
        <h3>Elan haqqında</h3>
        <p className="description">{item.description}</p>
        {!!item.attributes?.amenities?.length && (
          <div className="amenityTags">
            {item.attributes.amenities.map((a) => (
              <span key={a}>✓ {a}</span>
            ))}
          </div>
        )}
        {phone && !item.demo ? (
          <div className="contactActions">
            <a className="add" href={`tel:${phone}`}>
              Zəng et · {item.contact}
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
