"use client";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Pencil, Trash2 } from "lucide-react";
import AzerbaijaniDateInput from "./AzerbaijaniDateInput";
import { bannerJpeg } from "../../lib/banner-image";

type Banner = { id: string; title: string; image_url: string; media_type?: string; link_url: string | null; placement: "home" | "listing" | "left" | "right"; active: boolean; starts_at: string | null; ends_at: string | null; sort_order: number; clicks: number };
const placements = { home: "Ana səhifə", listing: "Elan səhifəsi", left: "Kompüter: sol tərəf", right: "Kompüter: sağ tərəf" };
const placementHints = { home: "Ana səhifədə kateqoriyaların altında, bütün ziyarətçilərə görünür.", listing: "Hər elanın səhifəsində, elan haqqında məlumatın altında görünür.", left: "Geniş kompüter ekranında səhifənin solunda, sürüşdürəndə yerində qalır. Telefonda görünmür. Şaquli şəkil: 160×600 və ya 300×900.", right: "Geniş kompüter ekranında səhifənin sağında, sürüşdürəndə yerində qalır. Telefonda görünmür. Şaquli şəkil: 160×600 və ya 300×900." };
const isVideo = (banner: { image_url: string; media_type?: string }) => banner.media_type === "video" || /\.(mp4|webm)$/i.test(banner.image_url);
const empty = { id: "", title: "", link_url: "", placement: "home" as Banner["placement"], starts_at: "", ends_at: "", sort_order: "0", active: true };
const day = (value: string | null) => value ? value.slice(0, 10) : "";
const show = (value: string | null) => value ? value.slice(0, 10).split("-").reverse().join(".") : "—";

export default function BannerManager() {
  const [items, setItems] = useState<Banner[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [form, setForm] = useState(empty), [file, setFile] = useState<File | null>(null), [preview, setPreview] = useState(""), [previewVideo, setPreviewVideo] = useState(false), [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try { const response = await fetch("/api/admin/banners", { cache: "no-store" }); const data = await response.json(); if (!response.ok) throw new Error(); setItems(data.items); setError(""); }
    catch { setError("Məlumatları yükləmək mümkün olmadı. Yenidən cəhd edin."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (!file) return; const url = URL.createObjectURL(file); setPreview(url); setPreviewVideo(file.type.startsWith("video/")); return () => URL.revokeObjectURL(url); }, [file]);
  function start(banner?: Banner) {
    setForm(banner ? { id: banner.id, title: banner.title, link_url: banner.link_url || "", placement: banner.placement, starts_at: day(banner.starts_at), ends_at: day(banner.ends_at), sort_order: String(banner.sort_order), active: banner.active } : empty);
    setFile(null); setPreview(banner?.image_url || ""); setPreviewVideo(!!banner && isVideo(banner)); setOpen(true); setNotice(""); setError("");
  }
  async function save(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    if (!form.id && !file) { setError("Banner üçün şəkil və ya video seçin."); return; }
    if (file?.type.startsWith("video/") && file.size > 20 * 1024 * 1024) { setError("Video 20 MB-dan böyük olmamalıdır."); return; }
    setBusy(true); setError("");
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, String(value)));
      if (file) { if (file.type.startsWith("video/")) body.append("file", file, file.name); else body.append("file", await bannerJpeg(file), "banner.jpg"); }
      const response = await fetch("/api/admin/banners", { method: "POST", body }); const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error === "TOO_LARGE" ? "Fayl çox böyükdür: şəkil 3 MB, video 20 MB-dan böyük olmamalıdır." : data.error === "INVALID_IMAGE" ? "Bu fayl növü qəbul edilmir. JPG, PNG, WebP şəkil və ya MP4 video seçin." : response.status === 413 ? "Fayl serverin qəbul etdiyi ölçüdən böyükdür. Daha kiçik video seçin." : "Banner saxlanmadı. Yenidən cəhd edin.");
      setOpen(false); setNotice(form.id ? "Banner yeniləndi." : "Banner əlavə edildi."); await load();
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Banner saxlanmadı."); }
    finally { setBusy(false); }
  }
  async function toggle(banner: Banner) {
    setItems(current => current.map(item => item.id === banner.id ? { ...item, active: !banner.active } : item));
    const response = await fetch("/api/admin/banners", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: banner.id, active: !banner.active }) }).catch(() => null);
    if (!response?.ok) { setError("Dəyişiklik saxlanmadı."); await load(); }
  }
  async function remove(banner: Banner) {
    if (!window.confirm("Banner silinsin?")) return;
    const response = await fetch("/api/admin/banners", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: banner.id }) }).catch(() => null);
    if (response?.ok) { setNotice("Banner silindi."); await load(); } else setError("Banner silinmədi.");
  }
  return <section className="kzAdPanel">
    <header className="kzAdPanelHead"><h2>Bannerlər</h2><div className="kzAdActions"><button type="button" className="kzAdBtn primary" onClick={() => start()}><ImagePlus aria-hidden="true" size={16} strokeWidth={2} />Banner əlavə et</button></div></header>
    <div className="kzAdHint kzBannerGuide"><p><strong>Şəkil:</strong> 1600 × 300 piksel, JPG, PNG və ya WebP, 3 MB-a qədər.</p><p><strong>Video:</strong> MP4, eni 1600 × 300 və ya 1280 × 240, 5–15 saniyə, səssiz, 20 MB-a qədər. Video öz-özünə, səssiz və təkrarla oynayır.</p><p>Telefonda banner kiçik görünür — yazını iri, az sözlə yazın.</p></div>
    {error && <p className="kzAdError" role="alert">{error}</p>}{notice && <p className="kzAdNotice" role="status">{notice}</p>}
    {open && <form className="kzBannerForm" onSubmit={save}>
      <button type="button" className="kzBannerPick" onClick={() => fileInput.current?.click()}>{preview ? previewVideo ? <video src={preview} muted loop autoPlay playsInline /> : <img src={preview} alt="" /> : <span><ImagePlus aria-hidden="true" size={28} strokeWidth={1.5} />Şəkil və ya video seç</span>}</button>
      <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" hidden onChange={event => setFile(event.target.files?.[0] || null)} />
      <div className="kzBannerFields">
        <label>Ad (yalnız paneldə görünür)<input value={form.title} maxLength={120} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="Məs. Avto icarə — noyabr" /></label>
        <label>Keçid (istəyə bağlı)<input value={form.link_url} maxLength={500} onChange={event => setForm({ ...form, link_url: event.target.value })} placeholder="https://... və ya /kiraye-masin" /></label>
        <label>Harada göstərilsin<select value={form.placement} onChange={event => setForm({ ...form, placement: event.target.value as Banner["placement"] })}>{Object.entries(placements).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><small>{placementHints[form.placement]}</small></label>
        <AzerbaijaniDateInput label="Başlanğıc tarixi" value={form.starts_at} onChange={value => setForm({ ...form, starts_at: value })} />
        <AzerbaijaniDateInput label="Son tarix" value={form.ends_at} min={form.starts_at || undefined} onChange={value => setForm({ ...form, ends_at: value })} />
        <label>Növbə<input type="number" inputMode="numeric" min={0} max={999} value={form.sort_order} onChange={event => setForm({ ...form, sort_order: event.target.value })} /><small>Eyni yerdə bir neçə banner varsa, kiçik rəqəm birinci göstərilir. Bilmirsinizsə 0 qoyun.</small></label>
        <label className="kzBannerCheck"><input type="checkbox" checked={form.active} onChange={event => setForm({ ...form, active: event.target.checked })} />Aktivdir</label>
      </div>
      <div className="kzAdCenter start"><button className="kzAdBtn primary" disabled={busy}>{busy ? "Saxlanılır…" : form.id ? "Yadda saxla" : "Əlavə et"}</button><button type="button" className="kzAdBtn" onClick={() => setOpen(false)}>Ləğv et</button></div>
    </form>}
    {loading ? <p className="kzAdMuted" role="status">Yüklənir…</p> : !items.length ? <div className="kzAdEmpty"><strong>Hələ banner yoxdur</strong><p>Reklam bannerini əlavə edin — ana səhifədə və ya elan səhifəsində göstəriləcək.</p></div> :
      <div className="kzAdList">{items.map(banner => <article className="kzAdRow kzBannerRow" key={banner.id}>
        {isVideo(banner) ? <video className="kzBannerThumb" src={banner.image_url} muted loop autoPlay playsInline preload="metadata" /> : <img className="kzBannerThumb" src={banner.image_url} alt="" />}
        <div className="kzAdRowMain">
          <div className="kzAdRowTop"><span className={`status ${banner.active ? "published" : "archived"}`}>{banner.active ? "Aktiv" : "Söndürülüb"}</span><span className="kzAdMuted">{placements[banner.placement]}{isVideo(banner) ? " · Video" : ""}</span></div>
          <h3>{banner.title || "Adsız banner"}</h3>
          <p className="kzAdMuted">{banner.starts_at || banner.ends_at ? `${show(banner.starts_at)} — ${show(banner.ends_at)}` : "Müddətsiz"} · Klik: {banner.clicks}{banner.link_url ? ` · ${banner.link_url}` : ""}</p>
        </div>
        <div className="kzAdRowActions">
          <label className="kzSwitch"><input type="checkbox" checked={banner.active} onChange={() => void toggle(banner)} /><span />{banner.active ? "Açıq" : "Bağlı"}</label>
          <button type="button" className="kzAdBtn" onClick={() => start(banner)}><Pencil aria-hidden="true" size={15} strokeWidth={2} />Dəyiş</button>
          <button type="button" className="kzAdBtn danger" onClick={() => void remove(banner)}><Trash2 aria-hidden="true" size={15} strokeWidth={2} />Sil</button>
        </div>
      </article>)}</div>}
  </section>;
}
