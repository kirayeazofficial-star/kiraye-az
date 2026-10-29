"use client";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Pencil, Trash2 } from "lucide-react";
import { bannerJpeg } from "../../lib/banner-image";

type Banner = { id: string; title: string; image_url: string; link_url: string | null; placement: "home" | "listing"; active: boolean; starts_at: string | null; ends_at: string | null; sort_order: number; clicks: number };
const placements = { home: "Ana səhifə (kateqoriyaların altında)", listing: "Elan səhifəsi (təsvirin altında)" };
const empty = { id: "", title: "", link_url: "", placement: "home" as Banner["placement"], starts_at: "", ends_at: "", sort_order: "0", active: true };
const day = (value: string | null) => value ? value.slice(0, 10) : "";
const show = (value: string | null) => value ? value.slice(0, 10).split("-").reverse().join(".") : "—";

export default function BannerManager() {
  const [items, setItems] = useState<Banner[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [form, setForm] = useState(empty), [file, setFile] = useState<File | null>(null), [preview, setPreview] = useState(""), [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try { const response = await fetch("/api/admin/banners", { cache: "no-store" }); const data = await response.json(); if (!response.ok) throw new Error(); setItems(data.items); setError(""); }
    catch { setError("Məlumatları yükləmək mümkün olmadı. Yenidən cəhd edin."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (!file) return; const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url); }, [file]);
  function start(banner?: Banner) {
    setForm(banner ? { id: banner.id, title: banner.title, link_url: banner.link_url || "", placement: banner.placement, starts_at: day(banner.starts_at), ends_at: day(banner.ends_at), sort_order: String(banner.sort_order), active: banner.active } : empty);
    setFile(null); setPreview(banner?.image_url || ""); setOpen(true); setNotice(""); setError("");
  }
  async function save(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    if (!form.id && !file) { setError("Banner şəklini seçin."); return; }
    setBusy(true); setError("");
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, String(value)));
      if (file) body.append("file", await bannerJpeg(file), "banner.jpg");
      const response = await fetch("/api/admin/banners", { method: "POST", body }); const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error === "TOO_LARGE" ? "Şəkil 3 MB-dan böyük olmamalıdır." : "Banner saxlanmadı. Yenidən cəhd edin.");
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
    <p className="kzAdHint">Tövsiyə olunan ölçü: 1600 × 300 piksel. JPG, PNG və ya WebP, 3 MB-dan kiçik. Telefonda kənarlar bir az kəsilir — yazını mərkəzdə saxlayın.</p>
    {error && <p className="kzAdError" role="alert">{error}</p>}{notice && <p className="kzAdNotice" role="status">{notice}</p>}
    {open && <form className="kzBannerForm" onSubmit={save}>
      <button type="button" className="kzBannerPick" onClick={() => fileInput.current?.click()}>{preview ? <img src={preview} alt="" /> : <span><ImagePlus aria-hidden="true" size={28} strokeWidth={1.5} />Şəkil seç</span>}</button>
      <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={event => setFile(event.target.files?.[0] || null)} />
      <div className="kzBannerFields">
        <label>Ad (yalnız paneldə görünür)<input value={form.title} maxLength={120} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="Məs. Avto icarə — noyabr" /></label>
        <label>Keçid (istəyə bağlı)<input value={form.link_url} maxLength={500} onChange={event => setForm({ ...form, link_url: event.target.value })} placeholder="https://... və ya /kiraye-masin" /></label>
        <label>Yer<select value={form.placement} onChange={event => setForm({ ...form, placement: event.target.value as Banner["placement"] })}>{Object.entries(placements).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Başlanğıc<input type="date" value={form.starts_at} onChange={event => setForm({ ...form, starts_at: event.target.value })} /></label>
        <label>Son tarix<input type="date" value={form.ends_at} onChange={event => setForm({ ...form, ends_at: event.target.value })} /></label>
        <label>Sıra<input type="number" min={0} max={999} value={form.sort_order} onChange={event => setForm({ ...form, sort_order: event.target.value })} /></label>
        <label className="kzBannerCheck"><input type="checkbox" checked={form.active} onChange={event => setForm({ ...form, active: event.target.checked })} />Aktivdir</label>
      </div>
      <div className="kzAdCenter start"><button className="kzAdBtn primary" disabled={busy}>{busy ? "Saxlanılır…" : form.id ? "Yadda saxla" : "Əlavə et"}</button><button type="button" className="kzAdBtn" onClick={() => setOpen(false)}>Ləğv et</button></div>
    </form>}
    {loading ? <p className="kzAdMuted" role="status">Yüklənir…</p> : !items.length ? <div className="kzAdEmpty"><strong>Hələ banner yoxdur</strong><p>Reklam bannerini əlavə edin — ana səhifədə və ya elan səhifəsində göstəriləcək.</p></div> :
      <div className="kzAdList">{items.map(banner => <article className="kzAdRow kzBannerRow" key={banner.id}>
        <img className="kzBannerThumb" src={banner.image_url} alt="" />
        <div className="kzAdRowMain">
          <div className="kzAdRowTop"><span className={`status ${banner.active ? "published" : "archived"}`}>{banner.active ? "Aktiv" : "Söndürülüb"}</span><span className="kzAdMuted">{placements[banner.placement].split(" (")[0]}</span></div>
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
