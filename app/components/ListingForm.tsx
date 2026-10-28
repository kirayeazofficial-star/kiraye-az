"use client";
import { Check } from "lucide-react";
import { readListingDraft, saveListingDraft, clearListingDraft, type ListingDraft } from "../../lib/listing-draft";
import { watermarkPhoto } from "../../lib/photo-watermark";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { listingExamples } from "../../lib/listing-form-options";
import RentalTermsFields from "./RentalTermsFields";
import DurationField from "./DurationField";
import ListingCategoryFields from "./ListingCategoryFields";

import {
  readListingAttributes,
  validateListingAttributes,
} from "../../lib/listing-attributes";
import {
  isProperty,
  normalizePhone,
  validateRentalDetails,
} from "../../lib/rental-details";
import {
  categories,
  cities,
  money,
  periodName,
  type Listing,
} from "../../lib/marketplace";

const limitDate=(value:string)=>{const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Baku",day:"2-digit",month:"2-digit",year:"numeric"}).formatToParts(new Date(value));const part=(type:string)=>parts.find(item=>item.type===type)?.value||"";return `${part("day")}.${part("month")}.${part("year")}`;};
const limitMessage=(next?:string|null)=>`Bu kateqoriya üzrə pulsuz limitiniz bitib.${next?` Növbəti pulsuz yerləşdirmə: ${limitDate(next)}.`:""}`;
export default function ListingForm({ listingId }: { listingId?: string }) {
  const [step, setStep] = useState(1);
  const [canModerate, setCanModerate] = useState(false);
  const [rentalPeriod, setRentalPeriod] = useState("daily");
  const submitLock = useRef(false);
  const manualTitle = useRef(false);
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [price, setPrice] = useState("");
  const [descriptionText, setDescriptionText] = useState("");
  const [formVersion, setFormVersion] = useState(0);
  const [contactName, setContactName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [minimumUnit, setMinimumUnit] = useState("day");
  function suggestTitle(value: string) {
    if (!manualTitle.current) setTitle(value.slice(0, 120));
  }
  function resetForm() {
    draftDirty.current=false;
    if(!listingId){void clearListingDraft(user);setSavedDraft(null);setInitial(null);}
    const base=listingId?initial:null;
    setStep(1);
    setMinimumUnit(base?.attributes?.min_rental_unit || "day");
    setRentalPeriod(base?.rental_period || "daily");
    setFormVersion((value) => value + 1);
    setCategory(base?.category || "");
    setTitle(base?.title || "");
    setCity(base?.city || "");
    setPrice(base?.price == null ? "" : String(base.price));
    setDescriptionText(base?.description || "");
    manualTitle.current = !!base;
    setFiles([]);
    setExistingImages(base?.images || []);
    setPreview(null);
    setError("");
  }
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<{
    title: string;
    city: string;
    price: number;
    period: string;
    description: string;
  } | null>(null);
  function updatePreview() {
    if (!formRef.current) return;
    const form = new FormData(formRef.current);
    setPreview({
      title: String(form.get("title") || "Elanın başlığı"),
      city: String(form.get("city") || ""),
      price: Number(form.get("price")),
      period: String(form.get("rental_period") || "daily"),
      description: String(form.get("description") || ""),
    });
  }
  const [user, setUser] = useState(""),
    [loginPhone, setLoginPhone] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(false),
    [files, setFiles] = useState<File[]>([]),
    [previews, setPreviews] = useState<string[]>([]),
    [category, setCategory] = useState(""),
    [categoryLimit, setCategoryLimit] = useState<{remaining:number;next_free_at:string|null}|null>(null),
    [initial, setInitial] = useState<Listing | null>(null),
    [existingImages, setExistingImages] = useState<string[]>([]),
    [loadError, setLoadError] = useState(false);
  const [savedDraft,setSavedDraft]=useState<ListingDraft|null>(null);
  const [draftNotice,setDraftNotice]=useState("");
  const draftDirty=useRef(false),draftTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const draftSave=useRef(()=>{});
  draftSave.current=()=>{
    if(listingId||!user||success||busy||!draftDirty.current||!category||!formRef.current)return;
    const form=new FormData(formRef.current),fields:Record<string,string[]>={};
    for(const [key,value] of form.entries())if(typeof value==='string'&&!['contact','contact_name'].includes(key))(fields[key] ||= []).push(value);
    const draft:ListingDraft={version:1,updatedAt:Date.now(),category,step,fields,files};
    void saveListingDraft(user,draft).then(mode=>setDraftNotice(mode==='text'&&files.length?'Mətn saxlanıldı; şəkilləri yenidən seçmək lazım ola bilər.':'Qaralama bu cihazda saxlanıldı.')).catch(()=>setDraftNotice('Bu brauzerdə qaralamanı saxlamaq mümkün olmadı.'));
  };
  function queueDraft(){if(listingId)return;draftDirty.current=true;setSavedDraft(null);if(draftTimer.current)clearTimeout(draftTimer.current);draftTimer.current=setTimeout(()=>draftSave.current(),350);}
  // Warn before the form is filled when the category has no free placements left.
  useEffect(() => {
    if (!category || listingId) { setCategoryLimit(null); return; }
    let active = true;
    fetch("/api/listings/limits", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(data => {
      if (!active || !data) return;
      const state = (data.items || []).find((item: { category: string }) => item.category === category);
      setCategoryLimit(state ? { remaining: state.remaining, next_free_at: state.next_free_at } : null);
    }).catch(() => {});
    return () => { active = false; };
  }, [category, listingId]);
  useEffect(()=>{if(!user||loading||listingId)return;let active=true;readListingDraft(user).then(value=>{if(active)setSavedDraft(value);});return()=>{active=false;};},[user,loading,listingId]);
  useEffect(()=>{const flush=()=>draftSave.current();const visibility=()=>{if(document.visibilityState==='hidden')flush();};window.addEventListener('pagehide',flush);document.addEventListener('visibilitychange',visibility);return()=>{flush();if(draftTimer.current)clearTimeout(draftTimer.current);window.removeEventListener('pagehide',flush);document.removeEventListener('visibilitychange',visibility);};},[]);
  function restoreDraft(){
    if(!savedDraft||!categories.some(item=>item.id===savedDraft.category))return;
    const form=new FormData();for(const [key,values] of Object.entries(savedDraft.fields))for(const value of values)form.append(key,value);
    const text=(key:string)=>String(form.get(key)||'');
    const attributes=readListingAttributes(savedDraft.category,form);
    setInitial({id:'',owner_id:user,category:savedDraft.category,title:text('title'),city:text('city'),price:Number(text('price'))||0,rental_period:text('rental_period')||'daily',description:text('description'),contact:'',images:[],status:'draft',created_at:'',deposit:Number(text('deposit'))||0,min_days:Number(text('min_days'))||1,rooms:Number(text('rooms'))||undefined,area_m2:Number(text('area_m2'))||undefined,attributes});
    setCategory(savedDraft.category);setTitle(text('title'));manualTitle.current=!!text('title');setCity(text('city'));setPrice(text('price'));setDescriptionText(text('description'));setRentalPeriod(text('rental_period')||'daily');setMinimumUnit(text('min_rental_unit')||'day');
    setFiles(savedDraft.files.filter(file=>file instanceof File).slice(0,6));setStep(Math.max(1,Math.min(4,savedDraft.step||1)));setFormVersion(value=>value+1);setSavedDraft(null);draftDirty.current=true;
    setDraftNotice(savedDraft.photosMissing?'Mətn bərpa edildi. Şəkilləri yenidən seç.':'Qaralama bərpa edildi.');
  }
  useEffect(() => {
    setLoading(true);
    setInitial(null);
    setStep(1);
    setCategory("");
    setTitle("");
    setDescriptionText("");
    setCity("");
    setPrice("");
    setExistingImages([]);
    setFiles([]);
    setError("");
    setLoadError(false);
    setSuccess(false);
    setPreview(null);
    setRentalPeriod("daily");
    setMinimumUnit("day");
    manualTitle.current = false;
    setFormVersion((value) => value + 1);
    let active = true;
    const timer = setTimeout(() => {
      if (!active) return;
      active = false;
      setLoading(false);
      setLoadError(true);
      setError("Hesab yoxlaması gecikir. Bağlantını yoxlayıb yenidən cəhd et.");
    }, 15000);
    fetch("/api/auth/host",{cache:"no-store"})
      .then(async response => {
        const data=await response.json(),account=data.user;
        if (!active) return;
        setUser(account?.id ?? "");
        setLoginPhone(account?.phone || "");
        setAccountEmail(account?.email || "");
        if (account) {
          setContactName(account.display_name || "");
          try {
            const profileResponse=await fetch("/api/account/profile",{cache:"no-store"});
            const profile=await profileResponse.json();
            if (!active) return;
            setCanModerate(profile.profile?.role === "admin" || !!profile.profile?.staff_role);
            if (profile.profile?.display_name)setContactName(profile.profile.display_name);
            setLoginPhone(profile.profile?.phone || account.phone || "");
          } catch {
            /* Optional contact defaults must not block loading an existing listing. */
          }
        }
        if (!active) return;
        if (listingId && account) {
          const listingResponse=await fetch(`/api/listings?id=${encodeURIComponent(listingId)}`,{cache:"no-store"});
          const result=await listingResponse.json();
          if (!active) return;
          if (!listingResponse.ok || !result.item) {
            setLoadError(true);
            setError(
              "Bu elanı redaktə etmək mümkün deyil. Elan sizə aid olmaya bilər.",
            );
            return;
          }
          if(["archived","expired"].includes(result.item.status)){setLoadError(true);setError("Arxivdəki elanı bərpa etmək ödənişli xidmətdir. Ödənişlər hazırda aktiv deyil. Elana kabinetindən baxa bilərsən.");return;}
          setInitial(result.item as Listing);
          setMinimumUnit(result.item.attributes?.min_rental_unit || "day");
          setRentalPeriod(result.item.rental_period);
          setTitle(result.item.title);
          setCity(result.item.city || "");
          setPrice(result.item.price == null ? "" : String(result.item.price));
          setDescriptionText(result.item.description || "");
          manualTitle.current = true;
          setCategory(result.item.category);
          setExistingImages(result.item.images ?? []);
        }
      })
      .catch(() => { if (active) { setLoadError(true); setError("Hesabı yoxlamaq mümkün olmadı."); } })
      .finally(() => { if (active) { clearTimeout(timer); setLoading(false); } });
    return () => { active = false; clearTimeout(timer); };
  }, [listingId]);
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [files]);
  function goToStep(next: number) {
    queueDraft();
    setStep(next);
    setError("");
    requestAnimationFrame(() => {
      document
        .getElementById("posting-progress")
        ?.scrollIntoView({ behavior: "instant", block: "start" });
      formRef.current
        ?.querySelector<HTMLElement>(`[data-post-step="${next}"] h2`)
        ?.focus({ preventScroll: true });
    });
  }
  function validateStep(current: number) {
    const section = formRef.current?.querySelector(
      `[data-post-step="${current}"]`,
    );
    const fields = section?.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >("input,select,textarea");
    formRef.current?.querySelectorAll('[aria-invalid="true"]').forEach(field=>field.removeAttribute('aria-invalid'));
    for (const field of fields || []) {
      if (!field.checkValidity()) {
        const details = field.closest("details");
        if (details) details.open = true;
        setStep(current);
        field.setAttribute('aria-invalid','true');
        const label=field.getAttribute('aria-label')||field.closest('label')?.childNodes[0]?.textContent?.trim()||'Məcburi sahə';
        const minimum='minLength' in field?field.minLength:0;
        const message=field.validity.valueMissing?`${label} boş qalıb. Bu sahəni doldur.`:field.validity.tooShort?`${label} ən azı ${minimum} simvol olmalıdır.`:field.validationMessage;
        setError(message);
        requestAnimationFrame(() => {
          field.scrollIntoView({behavior:'smooth',block:'center'});
          field.focus();
        });
        return false;
      }
    }
    if (current === 2 && formRef.current) {
      const form = new FormData(formRef.current);
      const message =
        validateListingAttributes(
          category,
          readListingAttributes(category, form),
        ) ||
        validateRentalDetails({
          deposit: Number(form.get("deposit") || 0),
          min_days:
            Number(form.get("min_days") || 1) *
            ({ day: 1, month: 30, year: 365 }[minimumUnit] || 1),
          available_from: initial?.available_from ?? null,
          available_until: initial?.available_until ?? null,
        });
      if (message) {
        setError(message);
        return false;
      }
    }
    if (current === 3 && !files.length && !existingImages.length) {
      setError("Ən azı bir şəkil əlavə et.");
      return false;
    }
    return true;
  }
  function nextStep() {
    if (validateStep(step)) goToStep(Math.min(4, step + 1));
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user || busy || submitLock.current) return;
    if (step < 4) {
      nextStep();
      return;
    }
    for (let current = 1; current <= 4; current++) {
      if (!validateStep(current)) {
        setStep(current);
        return;
      }
    }
    setError("");
    const form = new FormData(e.currentTarget),
      title = String(form.get("title") ?? "").trim(),
      description = String(form.get("description") ?? "").trim(),
      contact = String(form.get("contact") ?? "").trim();
    if (!categories.some((item) => item.id === category)) {
      setError("Kateqoriya seçin.");
      return;
    }
    if (title.length < 10 || description.length < 30) {
      setError("Başlıq ən azı 10, təsvir ən azı 30 simvol olmalıdır.");
      return;
    }
    if (
      !/^(?:\+994|00994|994|0)(?:50|51|55|70|77|99|10|60|12)\d{7}$/.test(
        contact.replace(/[\s()-]/g, ""),
      )
    ) {
      setError(
        "Düzgün Azərbaycan əlaqə nömrəsi yazın. Məsələn: 050 123 45 67.",
      );
      return;
    }
    const rental = {
      deposit: Number(form.get("deposit") || 0),
      min_days:
        Number(form.get("min_days") || 1) *
        ({ day: 1, month: 30, year: 365 }[minimumUnit] || 1),
      available_from: initial?.available_from ?? null,
      available_until: initial?.available_until ?? null,
    };
    const rentalError = validateRentalDetails(rental);
    if (rentalError) {
      setError(rentalError);
      return;
    }
    const attributes = readListingAttributes(category, form);
    const attributeError = validateListingAttributes(category, attributes);
    if (attributeError) {
      setError(attributeError);
      return;
    }
    if (files.length + existingImages.length > 6) {
      setError("Cəmi maksimum 6 şəkil seçə bilərsiniz.");
      return;
    }
    if (!files.length && !existingImages.length) {
      setError("Ən azı bir şəkil əlavə edin.");
      return;
    }
    const price = Number(form.get("price"));
    if (!Number.isFinite(price) || price <= 0 || price > 1000000) {
      setError("Qiymət 0 ilə 1 000 000 ₼ arasında olmalıdır.");
      return;
    }
    submitLock.current = true;
    setBusy(true);
    const paths: string[] = [];
    let saved = false;
    try {
      const images: string[] = [...existingImages];
      for (const file of files) {
        const branded = await watermarkPhoto(file);
        const uploadForm=new FormData();uploadForm.set("file",branded,"listing.jpg");
        const uploadResponse=await fetch("/api/uploads",{method:"POST",body:uploadForm});
        const uploaded=await uploadResponse.json();
        if (!uploadResponse.ok || !uploaded.path)
          throw new Error("Şəkil yüklənmədi. Bir az sonra yenidən yoxlayın.");
        paths.push(uploaded.path);images.push(uploaded.path);
      }
      const payload = {
        owner_id: user,
        category,
        title,
        description,
        contact: normalizePhone(contact)!,
        city: form.get("city"),
        district:
          initial?.city === form.get("city") ? initial.district || "" : "",
        price,
        rental_period: form.get("rental_period"),
        images,
        status: "pending",
        ...rental,
        rooms:
          ["property", "villa"].includes(category) && form.get("rooms")
            ? Number(form.get("rooms"))
            : null,
        area_m2:
          isProperty(category) && form.get("area_m2")
            ? Number(form.get("area_m2"))
            : null,
        attributes,
      };
      const resultResponse=await fetch("/api/listings",{method:listingId?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(listingId?{...payload,id:listingId}:payload)});
      if(resultResponse.status===429&&listingId)throw new Error("Elanı gündə yalnız bir dəfə redaktə etmək olar. Sabah yenidən cəhd edin.");
      if(resultResponse.status===429){const data=await resultResponse.json().catch(()=>({}));throw new Error(limitMessage(data.next_free_at));}
      if(!resultResponse.ok)throw new Error("Elanı saxlamaq mümkün olmadı. Məlumatları yoxlayıb yenidən cəhd edin.");
      saved = true;
      draftDirty.current=false;
      if(!listingId)void clearListingDraft(user);
      setSuccess(true);
    } catch (err) {
      if (paths.length && !saved) {
        try {
          await Promise.all(paths.map(path=>fetch("/api/uploads",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({path})})));
        } catch {
          /* Preserve the original submission error. */
        }
      }
      setError(err instanceof Error ? err.message : "Xəta baş verdi.");
    } finally {
      submitLock.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <Header />
      <main className={`wrap formPage${!user ? " guestFormPage" : ""}`}>
        <p className="breadcrumb">
          <Link href="/">Ana səhifə</Link> /{" "}
          {listingId ? "Elanı redaktə et" : "Yeni elan"}
        </p>
        <div className="sectionTitle">
          <div>
            
            <h1>{listingId ? "Elanı redaktə et" : "Elan yerləşdir"}</h1>
            <p className="muted">
              {listingId
                ? "Dəyişikliklər saxlanıldıqdan sonra elan yenidən yoxlamaya göndəriləcək."
                : "Dəqiq məlumat və aydın şəkillər daha çox maraq yaradır."}
            </p>
          </div>
        </div>
        {!loading && !success && !loadError && !user && (
          <section className="guestPublishPrompt" aria-labelledby="guest-publish-title">
            <div>
              <h2 id="guest-publish-title">Əvvəl hesabına daxil ol</h2>
              <p>Elanlarını şəxsi hesabından idarə et.</p>
            </div>
            <div className="guestPublishActions">
              <Link className="add" href="/login?next=/new">Daxil ol</Link>
              <Link className="secondary" href="/login?mode=signup&next=/new">Qeydiyyatdan keç</Link>
            </div>
          </section>
        )}
        {!listingId && user && !canModerate && !loading && (
          <p className="notice">
            Hər kateqoriyada 30 gün ərzində 3 pulsuz elan yerləşdirə bilərsən. Limit dolubsa, mövcud elanı redaktə edə və ya limit boşalanda yeni elan yerləşdirə bilərsən.
          </p>
        )}
        {!success && <section className="kzSafety" aria-label="Təhlükəsiz elan yerləşdirmə"><strong>Təhlükəsizlik qaydası</strong><p>Kartının PIN/CVV-sini, SMS kodunu və şifrəni heç kimə vermə. Naməlum şəxslərin ödəniş keçidlərini açma. Yalnız sənə məxsus və ya icazən olan əşyanı, düzgün məlumat və şəkillərlə yerləşdir.</p></section>}
        {loading ? (
          <section><p role="status">Hesab yoxlanılır...</p>
            <p>Hesabın yoxdur? <a href="/login?mode=signup&next=/new">Qeydiyyatdan keç</a> · <a href="/login?next=/new">Daxil ol</a></p></section>
        ) : success ? (
          <section className="successPanel" role="status">
            <span><Check aria-hidden="true" size={18} strokeWidth={2.5} /></span>
            <h2>Elan yoxlamaya göndərildi</h2>
            <p>Təsdiqdən sonra elan 30 gün yayımda olacaq. Nəticəni «Elanlarım» bölməsində görəcəksiniz.</p>
            <Link className="add" href="/profile">
              Elanlarıma keç
            </Link>
          </section>
        ) : loadError ? (
          <div className="error" role="alert">
            {error} <button type="button" className="secondary" onClick={() => window.location.reload()}>Yenidən yoxla</button> <Link href="/profile">Kabinetə qayıt</Link> <a href="/login?mode=signup&next=/new">Qeydiyyatdan keç</a>
          </div>
        ) : !user ? null : (
          <div className="formLayout">
            {savedDraft && <aside className="draftResume"><p>Yarımçıq elanın var. Davam etmək istəyirsən?</p><button type="button" className="secondary" onClick={restoreDraft}>Qaralamaya davam et</button><button type="button" className="textButton" onClick={()=>{void clearListingDraft(user);setSavedDraft(null);}}>Qaralamanı sil</button></aside>}
            {!listingId && draftNotice && <p className="draftNotice" role="status">{draftNotice}</p>}
            <form
              ref={formRef}
              className="listingForm"
              autoComplete="off"
              noValidate
              onSubmit={submit}
              onWheelCapture={(event) => {
                const field = event.target;
                if (
                  field instanceof HTMLInputElement &&
                  field.type === "number" &&
                  document.activeElement === field
                )
                  field.blur();
              }}
              onChangeCapture={queueDraft}
              onInput={() => {
                queueDraft();
                if (preview) updatePreview();
              }}
            >
              <fieldset disabled={busy} key={formVersion}>
                <div className="formReset">
                  <button
                    type="button"
                    className="textButton"
                    onClick={resetForm}
                  >
                    Sıfırla
                  </button>
                </div>
                <nav
                  className="publishSteps"
                  id="posting-progress"
                  aria-label="Elan bölmələri"
                >
                  {["Kateqoriya", "Məlumat və qiymət", "Şəkillər", "Əlaqə"].map(
                    (label, index) => (
                      <button
                        key={label}
                        type="button"
                        aria-current={step === index + 1 ? "step" : undefined}
                        disabled={index + 1 > step}
                        onClick={() => goToStep(index + 1)}
                      >
                        <span>{index + 1}</span>
                        {label}
                      </button>
                    ),
                  )}
                </nav>
                <section data-post-step="1" hidden={step !== 1}>
                  <h2 tabIndex={-1}>Nəyi kirayəyə verirsən?</h2>
                  <p className="muted">
                    Kateqoriyanı seç. Yalnız elanına uyğun suallar göstəriləcək.
                  </p>
                  <label>
                    Kateqoriya <span className="requiredMark">*</span>
                    <select
                      aria-label="Kateqoriya"
                      required
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        setRentalPeriod(
                          isProperty(e.target.value) ? "monthly" : "daily",
                        );
                        if (!manualTitle.current) setTitle("");
                      }}
                    >
                      <option value="" disabled>
                        Kateqoriya seçin
                      </option>
                      {categories.map((c) => (
                        <option value={c.id} key={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {!category && (
                    <p className="muted">
                      Əvvəl kateqoriyanı seç — uyğun xanalar açılacaq.
                    </p>
                  )}
                  {category && !listingId && categoryLimit && categoryLimit.remaining <= 0 && (
                    <p className="kzLimitWarning" role="alert">{limitMessage(categoryLimit.next_free_at)}</p>
                  )}
                </section>
                {category && (
                  <>
                    <section data-post-step="2" hidden={step !== 2}>
                      <h2 id="listing-info" tabIndex={-1}>
                        Elan məlumatları
                      </h2>
                      <p className="muted">
                        Əsas xüsusiyyətləri seç, şəhəri və kirayə qiymətini yaz.
                      </p>
                      <ListingCategoryFields
                        key={category}
                        category={category}
                        initial={initial}
                        suggest={suggestTitle}
                      />
                      <h3 className="formSubheading">Şəhər və qiymət</h3>
                      <label>
                        Şəhər <span className="requiredMark">*</span>
                        <select
                          aria-label="Şəhər"
                          name="city"
                          required
                          value={city}
                          onChange={(event) => setCity(event.target.value)}
                          autoComplete="off"
                        >
                          <option value="" disabled>
                            Şəhər seçin
                          </option>
                          {initial?.city && !cities.includes(initial.city) && (
                            <option>{initial.city}</option>
                          )}
                          {cities.map((city) => (
                            <option key={city}>{city}</option>
                          ))}
                        </select>
                      </label>
                      <div className="rentalPriceBlock">
                        <p className="fieldLabel">
                          Qiyməti hansı müddət üçün göstərirsən?
                        </p>
                        <div className="rentalPeriodChoice">
                          {[
                            {
                              value: "daily",
                              label: "Günlük",
                              hint: "1 gün üçün",
                            },
                            {value:"weekly",label:"Həftəlik",hint:"1 həftə üçün"},
                            {
                              value: "monthly",
                              label: "Aylıq",
                              hint: "1 ay üçün",
                            },
                          ].map((option) => (
                            <label
                              key={option.value}
                              className={
                                rentalPeriod === option.value ? "selected" : ""
                              }
                            >
                              <input
                                type="radio"
                                name="rental_period"
                                value={option.value}
                                checked={rentalPeriod === option.value}
                                onChange={() => setRentalPeriod(option.value)}
                              />
                              <span>
                                {option.label}
                                <small>{option.hint}</small>
                              </span>
                            </label>
                          ))}
                        </div>
                        <label>
                          {rentalPeriod === "monthly"
                            ? "1 aylıq kirayə qiyməti"
                            : rentalPeriod === "weekly" ? "1 həftəlik kirayə qiyməti" : "1 günlük kirayə qiyməti"}{" "}
                          <span className="requiredMark">*</span>
                          <div className="priceInputWrap">
                            <input
                              aria-label="Qiymət (₼)"
                              name="price"
                              value={price}
                              onChange={(event) => setPrice(event.target.value)}
                              autoComplete="off"
                              required
                              type="number"
                              inputMode="decimal"
                              min="0.01"
                              max="1000000"
                              step="0.01"
                              placeholder={
                                rentalPeriod === "monthly"
                                  ? "Məsələn, 600"
                                  : "Məsələn, 40"
                              }
                            />
                            <span>
                              ₼ / {periodName(rentalPeriod)}
                            </span>
                          </div>
                        </label>
                        <small>
                          Elan bu qiymətlə göstəriləcək. Depozit varsa, aşağıda
                          ayrıca qeyd et.
                        </small>
                      </div>
                      <h3 className="formSubheading">Məzmun</h3>
                      <label>
                        Elanın başlığı <span className="requiredMark">*</span>
                        <input
                          aria-label="Elanın başlığı"
                          name="title"
                          value={title}
                          onChange={(event) => {
                            setTitle(event.target.value);
                            manualTitle.current = !!event.target.value;
                          }}
                          required
                          minLength={10}
                          maxLength={120}
                          placeholder={listingExamples[category]?.title}
                        />
                      </label>
                      <label>
                        Ətraflı təsvir <span className="requiredMark">*</span>
                        <textarea
                          aria-label="Ətraflı təsvir"
                          name="description"
                          value={descriptionText}
                          onChange={(event) =>
                            setDescriptionText(event.target.value)
                          }
                          required
                          minLength={30}
                          maxLength={5000}
                          rows={5}
                          placeholder={listingExamples[category]?.description}
                        />
                        <small className={`descriptionCounter${descriptionText.length>0&&descriptionText.length<30?' isIncomplete':''}`}>
                          {descriptionText.length < 30
                            ? `Təsviri tamamlamaq üçün daha ${30-descriptionText.length} simvol yaz.`
                            : `${descriptionText.length} simvol yazılıb · kifayətdir.`}
                        </small>
                      </label>
                      <details
                        className="optionalRentalTerms"
                        open={
                          initial &&
                          (initial.deposit ||
                            (initial.min_days && initial.min_days > 1) ||
                            initial.available_from ||
                            initial.available_until)
                            ? true
                            : undefined
                        }
                      >
                        <summary>
                          Əlavə kirayə şərtləri <span>(istəyə bağlı)</span>
                        </summary>
                        <div className="formGrid">
                          <label>
                            Depozit (₼)
                            <div className="currencyControl">
                              <input
                                aria-label="Depozit (₼)"
                                name="deposit"
                                type="number"
                                min="0"
                                max="1000000"
                                step="0.01"
                                defaultValue={initial?.deposit ?? ""}
                              />
                              <span aria-hidden="true">₼</span>
                            </div>
                          </label>
                          <DurationField
                            label="Minimum kirayə müddəti"
                            name="min_days"
                            initialValue={String(
                              initial?.attributes?.min_rental_value ||
                                initial?.min_days ||
                                "",
                            )}
                            unit={minimumUnit}
                            onUnitChange={setMinimumUnit}
                            includeYear
                          />
                        </div>
                        <RentalTermsFields key={category} category={category} attributes={initial?.attributes} />
                        <p className="muted">
                          Məsələn: 20 gün və ya 1 ay. Rəqəmi yaz, yanından
                          vahidi seç. Ən çox 365 gün / 12 ay / 1 il.
                        </p>
                      </details>
                    </section>
                    <section data-post-step="3" hidden={step !== 3}>
                      <h2 id="listing-photos" tabIndex={-1}>
                        Şəkillər
                      </h2>
                      <p className="muted">
                        1–6 şəkil · JPG, PNG və ya WebP · hər biri maksimum 5 MB
                      </p>
                      <label className="uploadZone">
                        ↑ Şəkilləri seç
                        <input
                          aria-label="Elan şəkilləri"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          onChange={(e) => {
                            const selected = Array.from(e.target.files ?? []);
                            if (
                              selected.length +
                                files.length +
                                existingImages.length >
                                6 ||
                              selected.some(
                                (f) =>
                                  f.size > 5 * 1024 * 1024 ||
                                  ![
                                    "image/jpeg",
                                    "image/png",
                                    "image/webp",
                                  ].includes(f.type),
                              )
                            ) {
                              setError(
                                "1–6 ədəd JPG, PNG və ya WebP şəkli seçin. Hər şəkil maksimum 5 MB ola bilər.",
                              );
                              e.target.value = "";
                              return;
                            }
                            setFiles((current) => [...current, ...selected]);
                            e.target.value = "";
                            setError("");
                          }}
                        />
                      </label>
                      <p className="photoCount" aria-live="polite">
                        {files.length + existingImages.length} / 6 şəkil · İlk
                        şəkil elanın üz qabığıdır.
                      </p>
                      <div className="uploadPreviews">
                        {existingImages.map((src, i) => (
                          <div key={src}>
                            <img src={src} alt={`${i + 1}-ci mövcud şəkil`} />
                            <button
                              type="button"
                              aria-label={`${i + 1}-ci mövcud şəkli sil`}
                              onClick={() =>
                                setExistingImages(
                                  existingImages.filter((x) => x !== src),
                                )
                              }
                            >
                              ×
                            </button>
                            {i > 0 && (
                              <button
                                type="button"
                                className="coverButton"
                                onClick={() =>
                                  setExistingImages([
                                    src,
                                    ...existingImages.filter((_, n) => n !== i),
                                  ])
                                }
                              >
                                Üz qabığı et
                              </button>
                            )}
                          </div>
                        ))}
                        {previews.map((src, i) => (
                          <div key={src}>
                            <img src={src} alt={`${i + 1}-ci seçilən şəkil`} />
                            <button
                              type="button"
                              aria-label={`${i + 1}-ci şəkli sil`}
                              onClick={() =>
                                setFiles(files.filter((_, n) => n !== i))
                              }
                            >
                              ×
                            </button>
                            {i > 0 && !existingImages.length && (
                              <button
                                type="button"
                                className="coverButton"
                                onClick={() =>
                                  setFiles([
                                    files[i],
                                    ...files.filter((_, n) => n !== i),
                                  ])
                                }
                              >
                                Üz qabığı et
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                    <section data-post-step="4" hidden={step !== 4}>
                      <h2 id="listing-contact" tabIndex={-1}>
                        Əlaqə və göndəriş
                      </h2>
                      <p className="muted">
                        Kirayə götürmək istəyənlər bu nömrə ilə səninlə əlaqə
                        saxlayacaq.
                      </p>
                      <label>
                        Adınız
                        <input
                          name="contact_name"
                          maxLength={80}
                          autoComplete="name"
                          defaultValue={
                            initial?.attributes?.contact_name || contactName
                          }
                        />
                      </label>
                      {accountEmail && (
                        <label>
                          E-poçt
                          <input
                            type="email"
                            aria-label="E-poçt"
                            value={accountEmail}
                            readOnly
                            autoComplete="email"
                          />
                          <small>
                            Hesabına bağlı ünvan. E-poçtun elanda açıq
                            göstərilmir.
                          </small>
                        </label>
                      )}
                      <label>
                        Telefon nömrəsi <span className="requiredMark">*</span>
                        <input
                          name="contact"
                          defaultValue={initial?.contact || loginPhone}
                          readOnly
                          type="tel"
                          required
                          maxLength={25}
                          placeholder="050 123 45 67"
                        />
                        <small>
                          Yeni elanda hesabın əsas telefonu istifadə olunur. Telefonu Profil bölməsindən dəyişə bilərsiniz. Mövcud elanın nömrəsi avtomatik dəyişdirilmir.
                        </small>
                      </label>
                      <label className="checkLabel">
                        <input type="checkbox" required />{" "}
                        <span>
                          <Link href="/rules" target="_blank">
                            Elan qaydalarını
                          </Link>{" "}
                          qəbul edirəm və məlumatların düzgünlüyünü təsdiq
                          edirəm.
                        </span>
                      </label>
                      <button
                        type="button"
                        className="secondary wide previewToggle"
                        aria-expanded={!!preview}
                        disabled={busy}
                        onClick={() =>
                          preview ? setPreview(null) : updatePreview()
                        }
                      >
                        {preview ? "Önbaxışı bağla" : "Elana önbaxış"}
                      </button>
                      {preview && (
                        <section
                          className="postingPreview"
                          aria-label="Elanın önbaxışı"
                        >
                          <p className="muted">
                            Yalnız önbaxışdır. Elan hələ göndərilməyib.
                          </p>
                          <div>
                            <img
                              src={
                                existingImages[0] ||
                                previews[0] ||
                                "/placeholder.svg"
                              }
                              alt="Elanın üz qabığı"
                            />
                            <div>
                              <strong>
                                {preview.price > 0 &&
                                Number.isFinite(preview.price)
                                  ? `${money(preview.price)} ₼ / ${periodName(preview.period)}`
                                  : "Qiymət yazılmayıb"}
                              </strong>
                              <h3>{preview.title}</h3>
                              <p>{preview.city}</p>
                            </div>
                          </div>
                          <p className="description">{preview.description}</p>
                        </section>
                      )}
                      <button className="add wide" disabled={busy}>
                        {busy
                          ? "Göndərilir, gözləyin..."
                          : "Elanı yoxlamaya göndər →"}
                      </button>
                    </section>
                  </>
                )}
                {error && (
                  <p className="error" role="alert">
                    {error}
                  </p>
                )}
                <div className="wizardActions">
                  {step > 1 && (
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => goToStep(step - 1)}
                    >
                      ← Geri
                    </button>
                  )}
                  <span>{step} / 4 addım</span>
                  {step < 4 && (
                    <button type="button" className="add" onClick={nextStep}>
                      Davam et →
                    </button>
                  )}
                </div>
              </fieldset>
            </form>
            <aside className="tips">
              <h3>Yaxşı elan daha tez seçilir</h3>
              <p>Öz çəkdiyin, aydın və işıqlı şəkillərdən istifadə et.</p>
              <p>
                Qiyməti düzgün göstər. Depozit və digər şərtləri təsvirdə qeyd
                et.
              </p>
              <p>Şəxsi sənəd və bank kartı məlumatlarını paylaşma.</p>
              <hr />
              <small>Elanlar yayımlanmadan əvvəl yoxlanılır.</small>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
