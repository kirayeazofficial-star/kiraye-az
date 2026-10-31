"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Clock, ExternalLink, ImagePlus, Store as StoreIcon, TriangleAlert } from "lucide-react";
import { squareAvatar } from "../../lib/avatar-image";
import { bannerJpeg } from "../../lib/banner-image";
import { useAutoClear } from "../../lib/use-auto-clear";

type Plan = { id: string; name: string; price: string; listing_limit: number | null; free_bumps: number; featured: boolean };
type Store = { slug: string; name: string; description: string; logo_url: string | null; cover_url: string | null; open_from: string | null; open_to: string | null; phone: string; address: string; hours: string; plan: string; status: string; active_until: string | null; reject_reason: string | null };
type Terms = { listing_limit: number | null; free_bumps: number; bumps_left: number } | null;
const day = (value: string | null) => value ? new Date(value).toLocaleDateString("ru-RU") : "";

// Cabinet → "Mağaza": choose a package, fill in the store page, see where the application stands.
export default function StoreSettings() {
  const [store, setStore] = useState<Store | null>(null), [plans, setPlans] = useState<Plan[]>([]), [loading, setLoading] = useState(true), [terms, setTerms] = useState<Terms>(null);
  const [plan, setPlan] = useState("business"), [logo, setLogo] = useState<File | null>(null), [preview, setPreview] = useState(""), [cover, setCover] = useState<File | null>(null), [coverPreview, setCoverPreview] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  useAutoClear(notice, () => setNotice(""));
  const load = () => fetch("/api/stores?mine=1", { cache: "no-store" }).then(r => r.json()).then(data => { setStore(data.store); setPlans(data.plans || []); setTerms(data.terms || null); if (data.store) setPlan(data.store.plan); }).catch(() => setError("Məlumat yüklənmədi.")).finally(() => setLoading(false));
  useEffect(() => { void load(); }, []);
  useEffect(() => { if (!logo) return; const url = URL.createObjectURL(logo); setPreview(url); return () => URL.revokeObjectURL(url); }, [logo]);
  useEffect(() => { if (!cover) return; const url = URL.createObjectURL(cover); setCoverPreview(url); return () => URL.revokeObjectURL(url); }, [cover]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError("");
    try {
      const body = new FormData(event.currentTarget);
      body.set("plan", plan);
      if (logo) body.set("logo", await squareAvatar(logo, 400), "logo.jpg"); else body.delete("logo");
      if (cover) body.set("cover", await bannerJpeg(cover), "cover.jpg"); else body.delete("cover");
      const response = await fetch("/api/stores", { method: "POST", body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error === "SLUG_TAKEN" ? "Bu ünvan artıq başqa mağazadadır. Başqa ad seçin." : data.error === "INVALID_NAME" ? "Mağazanın adı ən azı 3 hərf olmalıdır." : "Mağaza saxlanmadı. Yenidən cəhd edin.");
      setLogo(null); setCover(null); setNotice(data.status === "pending" ? "Müraciət göndərildi. Administrasiya yoxlayıb aktivləşdirəndə mağazanız açılacaq." : "Dəyişikliklər saxlanıldı.");
      await load();
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Mağaza saxlanmadı."); }
    finally { setBusy(false); }
  }
  if (loading) return <section className="kzPanel"><p role="status">Yüklənir…</p></section>;
  const status = store?.status, active = status === "active" && store?.active_until && Date.parse(store.active_until) > Date.now();
  return <section className="kzStore">
    {store && <div className={`kzStoreStatus ${active ? "ok" : status}`}>
      <span>{active ? <Check aria-hidden="true" size={18} strokeWidth={2.4} /> : status === "pending" ? <Clock aria-hidden="true" size={18} strokeWidth={2.2} /> : <TriangleAlert aria-hidden="true" size={18} strokeWidth={2.2} />}</span>
      <div>
        <strong>{active ? `Mağaza aktivdir — ${day(store.active_until)} tarixinədək` : status === "pending" ? "Müraciət yoxlanılır" : status === "rejected" ? "Müraciət rədd edilib" : "Mağazanın müddəti bitib"}</strong>
        <small>{active ? `${terms ? `Paketiniz: ${terms.listing_limit ? `hər kateqoriyada ${terms.listing_limit} elan` : "limitsiz elan"}${terms.free_bumps ? `, bu ay ${terms.bumps_left} / ${terms.free_bumps} pulsuz irəli çək qalıb` : ""}. Bu şərtlər müddət bitənədək dəyişmir.` : "Elanlarınızda «Mağaza» nişanı görünür, limitiniz paketə uyğun artıb."}` : status === "pending" ? "Administrasiya müraciətinizi yoxlayıb ödəniş və aktivləşdirmə üçün sizinlə əlaqə saxlayacaq." : status === "rejected" ? store.reject_reason || "Məlumatları düzəldib yenidən göndərin." : "Yenidən aktivləşdirmək üçün müraciəti təkrar göndərin."}</small>
      </div>
      {active && <Link className="kzButtonGhost kzIconBtn" href={`/magaza/${store.slug}`}><ExternalLink aria-hidden="true" size={15} strokeWidth={2} />Mağazaya bax</Link>}
    </div>}
    {!store && <div className="kzStoreIntro"><span><StoreIcon aria-hidden="true" size={22} strokeWidth={2} /></span><div><strong>Öz mağazanızı açın</strong><small>Mağaza səhifəsi, loqo, ünvan və iş saatları, elanlarda «Mağaza» nişanı və daha çox elan limiti. Rent a car, alət icarəsi, geyim salonu, telefon dükanı — hər kəs aça bilər.</small></div></div>}
    <div className="kzPlans" role="radiogroup" aria-label="Paket">
      {plans.map(item => <label key={item.id} className={`kzPlan${plan === item.id ? " on" : ""}${item.featured ? " featured" : ""}`}>
        <input type="radio" name="plan-choice" checked={plan === item.id} onChange={() => setPlan(item.id)} />
        {item.featured && <em>Ən çox görünən</em>}
        <strong>{item.name}</strong>
        <b>{Number(item.price).toLocaleString("ru-RU")} ₼ <small>/ ay</small></b>
        <ul>
          <li><Check aria-hidden="true" size={14} strokeWidth={2.4} />{item.listing_limit ? `Hər kateqoriyada ${item.listing_limit} elan` : "Limitsiz elan"}</li>
          <li><Check aria-hidden="true" size={14} strokeWidth={2.4} />Mağaza səhifəsi və nişan</li>
          {item.free_bumps > 0 && <li><Check aria-hidden="true" size={14} strokeWidth={2.4} />Ayda {item.free_bumps} pulsuz irəli çək</li>}
          {item.featured && <li><Check aria-hidden="true" size={14} strokeWidth={2.4} />Ana səhifədə «Mağazalar» blokunda öndə</li>}
        </ul>
      </label>)}
    </div>
    <form className="kzPanel kzStoreForm" onSubmit={save}>
      <label className="kzStoreCoverPick">{coverPreview || store?.cover_url ? <img src={coverPreview || store!.cover_url!} alt="" /> : <span><ImagePlus aria-hidden="true" size={22} strokeWidth={1.75} />Örtük şəkli (geniş, məsələn 1600×400)</span>}
        <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={event => setCover(event.target.files?.[0] || null)} /></label>
      <div className="kzStoreLogo">
        <label className="kzStoreLogoPick">{preview || store?.logo_url ? <img src={preview || store!.logo_url!} alt="" /> : <ImagePlus aria-hidden="true" size={24} strokeWidth={1.75} />}
          <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={event => setLogo(event.target.files?.[0] || null)} /></label>
        <small>Loqo (kvadrat şəkil)</small>
      </div>
      <label>Mağazanın adı<input name="name" required minLength={3} maxLength={60} defaultValue={store?.name} placeholder="Məsələn: Rent Car Bakı" /></label>
      <label>Səhifənin ünvanı<div className="kzSlug"><span>kirayeal.az/magaza/</span><input name="slug" maxLength={40} defaultValue={store?.slug} placeholder="rent-car-baki" /></div></label>
      <label>Haqqında<textarea name="description" rows={3} maxLength={600} defaultValue={store?.description} placeholder="Nə kirayə verirsiniz, hansı şərtlərlə, nəyə görə sizi seçməlidirlər?" /></label>
      <div className="formGrid">
        <label>Telefon<input name="phone" maxLength={32} defaultValue={store?.phone} placeholder="+994 50 000 00 00" /></label>
        <div className="kzStoreHours"><span>İş saatları (hər gün)</span><div><input type="time" name="open_from" defaultValue={store?.open_from || "09:00"} aria-label="Açılır" /><b>—</b><input type="time" name="open_to" defaultValue={store?.open_to || "19:00"} aria-label="Bağlanır" /></div></div>
      </div>
      <label>Ünvan<input name="address" maxLength={120} defaultValue={store?.address} placeholder="Bakı, Nəsimi r., ..." /></label>
      {error && <p className="kzFormError" role="alert">{error}</p>}{notice && <p className="kzFormNotice" role="status">{notice}</p>}
      <button className="kzButton" disabled={busy}>{busy ? "Göndərilir…" : store ? "Yadda saxla" : "Müraciət göndər"}</button>
      <p className="muted">Ödəniş sistemi qoşulana qədər mağazanı administrasiya aktivləşdirir. Müraciətdən sonra sizinlə əlaqə saxlanılacaq.</p>
    </form>
  </section>;
}
