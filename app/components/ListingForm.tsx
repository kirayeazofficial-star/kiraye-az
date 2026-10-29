"use client";
import { Check, ChevronLeft, ChevronRight, Clock, ImagePlus, X } from "lucide-react";
import { readListingDraft, saveListingDraft, clearListingDraft, type ListingDraft } from "../../lib/listing-draft";
import { sharePreview, watermarkPhoto } from "../../lib/photo-watermark";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { listingExamples } from "../../lib/listing-form-options";
import RentalTermsFields from "./RentalTermsFields";
import DurationField from "./DurationField";
import ListingCategoryFields from "./ListingCategoryFields";
import { contactInText, contactInTextMessage } from "../../lib/contact-filter";
import { editLimitMessage, nextEditAt } from "../../lib/edit-limit";
import LocationPicker from "./LocationPicker";
import { locationCategories } from "../../lib/location";
import PhotoOrganizer, { type ListingPhoto } from "./PhotoOrganizer";

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
const limitMessage=(_next?:string|null)=>"Bu kateqoriyada pulsuz limitiniz dolub.";
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
    setPrice(base?.price == null ? "" : String(Number(base.price)));
    setDescriptionText(base?.description || "");
    manualTitle.current = !!base;
    setPhotos((base?.images || []).map(photoFromSrc));
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
    [paymentWaiting, setPaymentWaiting] = useState(false),
    [photos, setPhotoList] = useState<ListingPhoto[]>([]),
    [category, setCategory] = useState(""),
    [initial, setInitial] = useState<Listing | null>(null),
    [loadError, setLoadError] = useState(false);
  // One ordered list for saved photos (src) and newly chosen ones (file + local preview URL).
  const objectUrls=useRef(new Set<string>());
  const photoFromSrc=(src:string):ListingPhoto=>({id:src,src});
  const photoFromFile=(file:File):ListingPhoto=>{const src=URL.createObjectURL(file);objectUrls.current.add(src);return {id:src,src,file};};
  function setPhotos(next:ListingPhoto[]|((current:ListingPhoto[])=>ListingPhoto[])){
    setPhotoList(current=>{const value=typeof next==='function'?next(current):next;for(const old of current)if(old.file&&!value.some(item=>item.id===old.id)){URL.revokeObjectURL(old.src);objectUrls.current.delete(old.src);}return value;});
  }
  useEffect(()=>()=>{objectUrls.current.forEach(URL.revokeObjectURL);objectUrls.current.clear();},[]);
  const files=useMemo(()=>photos.flatMap(photo=>photo.file?[photo.file]:[]),[photos]);
  const existingImages=useMemo(()=>photos.flatMap(photo=>photo.file?[]:[photo.src]),[photos]);
  const [photoNotice,setPhotoNotice]=useState("");
  // Optional map location (homes, villas, premises).
  const [district,setDistrict]=useState(""),[metro,setMetro]=useState(""),[point,setPoint]=useState<[number,number]|null>(null),[exactLocation,setExactLocation]=useState(false);
  const hasLocation=locationCategories.includes(category);
  const [editBlockedUntil,setEditBlockedUntil]=useState<Date|null>(null);
  const contactKind=contactInText(`${title} ${descriptionText}`);
  const photoSize=(file:File)=>new Promise<{w:number;h:number}|null>(resolve=>{const url=URL.createObjectURL(file);const image=new Image();image.onload=()=>{resolve({w:image.naturalWidth,h:image.naturalHeight});URL.revokeObjectURL(url);};image.onerror=()=>{resolve(null);URL.revokeObjectURL(url);};image.src=url;});
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
  useEffect(()=>{if(!user||loading||listingId)return;let active=true;readListingDraft(user).then(value=>{if(active)setSavedDraft(value);});return()=>{active=false;};},[user,loading,listingId]);
  useEffect(()=>{const flush=()=>draftSave.current();const visibility=()=>{if(document.visibilityState==='hidden')flush();};window.addEventListener('pagehide',flush);document.addEventListener('visibilitychange',visibility);return()=>{flush();if(draftTimer.current)clearTimeout(draftTimer.current);window.removeEventListener('pagehide',flush);document.removeEventListener('visibilitychange',visibility);};},[]);
  function restoreDraft(){
    if(!savedDraft||!categories.some(item=>item.id===savedDraft.category))return;
    const form=new FormData();for(const [key,values] of Object.entries(savedDraft.fields))for(const value of values)form.append(key,value);
    const text=(key:string)=>String(form.get(key)||'');
    const attributes=readListingAttributes(savedDraft.category,form);
    setInitial({id:'',owner_id:user,category:savedDraft.category,title:text('title'),city:text('city'),price:Number(text('price'))||0,rental_period:text('rental_period')||'daily',description:text('description'),contact:'',images:[],status:'draft',created_at:'',deposit:Number(text('deposit'))||0,min_days:Number(text('min_days'))||1,rooms:Number(text('rooms'))||undefined,area_m2:Number(text('area_m2'))||undefined,attributes});
    setCategory(savedDraft.category);setTitle(text('title'));manualTitle.current=!!text('title');setCity(text('city'));setPrice(text('price'));setDescriptionText(text('description'));setRentalPeriod(text('rental_period')||'daily');setMinimumUnit(text('min_rental_unit')||'day');
    setPhotos(savedDraft.files.filter(file=>file instanceof File).slice(0,6).map(photoFromFile));setStep(Math.max(1,Math.min(4,savedDraft.step||1)));setFormVersion(value=>value+1);setSavedDraft(null);draftDirty.current=true;
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
    setPhotos([]);
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
          setPrice(result.item.price == null ? "" : String(Number(result.item.price)));
          setDescriptionText(result.item.description || "");
          manualTitle.current = true;
          setCategory(result.item.category);
          setPhotos((result.item.images ?? []).map(photoFromSrc));
          setDistrict(result.item.district || ""); setMetro(typeof result.item.attributes?.metro === "string" ? result.item.attributes.metro : "");
          setPoint(result.item.lat != null && result.item.lng != null ? [Number(result.item.lat), Number(result.item.lng)] : null); setExactLocation(!!result.item.location_exact);
          setEditBlockedUntil(nextEditAt((result.item as Listing & { edit_log?: string[] }).edit_log));
        }
      })
      .catch(() => { if (active) { setLoadError(true); setError("Hesabı yoxlamaq mümkün olmadı."); } })
      .finally(() => { if (active) { clearTimeout(timer); setLoading(false); } });
    return () => { active = false; clearTimeout(timer); };
  }, [listingId]);
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
    if (current === 2 && contactKind) {
      setError(contactInTextMessage(contactKind));
      requestAnimationFrame(() => document.querySelector<HTMLElement>('textarea[name="description"]')?.focus());
      return false;
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
    const textContact = contactInText(`${title} ${description}`);
    if (textContact) { setError(contactInTextMessage(textContact)); return; }
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
      // Upload in the order the user arranged; saved photos keep their address.
      const images: string[] = [];
      for (const photo of photos) {
        if (!photo.file) { images.push(photo.src); continue; }
        const branded = await watermarkPhoto(photo.file);
        const uploadForm=new FormData();uploadForm.set("file",branded,"listing.jpg");
        const small = await sharePreview(branded).catch(() => null);
        if (small) uploadForm.set("share",small,"share.jpg");
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
        district: hasLocation
          ? (city === "Bakı" ? district : (initial?.city === city ? initial.district || "" : ""))
          : initial?.city === form.get("city") ? initial.district || "" : "",
        lat: hasLocation ? point?.[0] ?? null : null,
        lng: hasLocation ? point?.[1] ?? null : null,
        location_exact: hasLocation && !!point && exactLocation,
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
      if(resultResponse.status===429&&listingId){const data=await resultResponse.json().catch(()=>({}));const next=data.next_edit_at?new Date(data.next_edit_at):null;if(next)setEditBlockedUntil(next);throw new Error(editLimitMessage(next));}
      if(resultResponse.status===400){const data=await resultResponse.clone().json().catch(()=>({}));if(data.error==="CONTACT_IN_TEXT")throw new Error(contactInTextMessage(contactInText(`${title} ${description}`)||"phone"));}
      if(resultResponse.status===429){const data=await resultResponse.json().catch(()=>({}));throw new Error(limitMessage(data.next_free_at));}
      if(!resultResponse.ok)throw new Error("Elanı saxlamaq mümkün olmadı. Məlumatları yoxlayıb yenidən cəhd edin.");
      const saveResult=await resultResponse.json().catch(()=>({}));
      setPaymentWaiting(!!saveResult.payment_required);
      if(saveResult.payment_required)setTimeout(()=>{window.location.href='/profile?section=listings&tab=payment';},3500);
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
        {!success && <section className="kzSafety" aria-label="Təhlükəsiz elan yerləşdirmə"><strong>Təhlükəsizlik qaydası</strong><p>Kartının PIN/CVV-sini, SMS kodunu və şifrəni heç kimə vermə. Naməlum şəxslərin ödəniş keçidlərini açma. Yalnız sənə məxsus və ya icazən olan əşyanı, düzgün məlumat və şəkillərlə yerləşdir.</p></section>}
        {loading ? (
          <section><p role="status">Hesab yoxlanılır...</p>
            <p>Hesabın yoxdur? <a href="/login?mode=signup&next=/new">Qeydiyyatdan keç</a> · <a href="/login?next=/new">Daxil ol</a></p></section>
        ) : success ? (
          <section className={`successPanel${paymentWaiting ? " waiting" : ""}`} role="status">
            <span>{paymentWaiting ? <Clock aria-hidden="true" size={18} strokeWidth={2.5} /> : <Check aria-hidden="true" size={18} strokeWidth={2.5} />}</span>
            <h2>{paymentWaiting ? "Elanınız yoxlamaya göndərilə bilmədi" : "Elan yoxlamaya göndərildi"}</h2>
            <p>{paymentWaiting ? "Bu kateqoriyada pulsuz elan limitiniz dolub. Elan saxlanıldı və «Ödəniş gözləyir» bölməsinə keçirildi. Ödənişdən sonra yoxlamaya göndəriləcək." : "Təsdiqdən sonra elan 30 gün yayımda olacaq. Nəticəni «Elanlarım» bölməsində görəcəksiniz."}</p>
            <Link className="add" href={paymentWaiting ? "/profile?section=listings&tab=payment" : "/profile?section=listings&tab=pending"}>
              {paymentWaiting ? "Ödəniş gözləyir bölməsinə keç" : "Elanlarıma keç"}
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
            {listingId && editBlockedUntil && editBlockedUntil.getTime() > Date.now() && <p className="kzEditLimit" role="status">{editLimitMessage(editBlockedUntil)}</p>}
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
                              <span>{option.label}</span>
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
                      {hasLocation && city && <LocationPicker city={city} district={district} metro={metro} point={point} exact={exactLocation}
                        onDistrict={value => { setDistrict(value); queueDraft(); }} onMetro={value => { setMetro(value); queueDraft(); }}
                        onPoint={value => { setPoint(value); queueDraft(); }} onExact={setExactLocation} />}
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
                        {contactKind && <span className="kzFieldError" role="alert">{contactInTextMessage(contactKind)}</span>}
                        {descriptionText.length > 0 && descriptionText.length < 30 && <span className="kzDescProgress" role="status">
                          <span className="kzDescBar"><span style={{ width: `${Math.round(descriptionText.length / 30 * 100)}%` }} /></span>
                          <small>Daha {30 - descriptionText.length} simvol</small>
                        </span>}
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
                                defaultValue={initial?.deposit == null ? "" : String(Number(initial.deposit))}
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
                        1–6 şəkil · JPG, PNG və ya WebP · ən azı 600×400 piksel, maksimum 5 MB
                      </p>
                      <label className="uploadZone">
                        <ImagePlus className="kzI kzIL" aria-hidden="true" size={20} strokeWidth={2} /> Şəkilləri seç
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
                            e.target.value = "";
                            setError("");
                            setPhotoNotice("");
                            // Very small pictures (often copied from the internet) look blurry when opened full screen.
                            void Promise.all(selected.map(photoSize)).then(sizes => {
                              const tooSmall = selected.filter((_, i) => sizes[i] && (Math.max(sizes[i]!.w, sizes[i]!.h) < 600 || Math.min(sizes[i]!.w, sizes[i]!.h) < 400));
                              const accepted = selected.filter(file => !tooSmall.includes(file));
                              const small = accepted.filter(file => { const size = sizes[selected.indexOf(file)]; return size && Math.max(size.w, size.h) < 1000; });
                              if (tooSmall.length) setError(`${tooSmall.length} şəkil çox kiçikdir (ən azı 600×400 piksel olmalıdır), əlavə edilmədi. Telefonun kamerası ilə çəkilmiş real şəkil seçin.`);
                              if (small.length) setPhotoNotice("Bəzi şəkillər kiçik ölçüdədir: tam ekranda bir az bulanıq görünə bilər. Mümkünsə, kamera ilə çəkilmiş orijinal şəkli seçin.");
                              if (accepted.length) setPhotos((current) => [...current, ...accepted.map(photoFromFile)]);
                            });
                          }}
                        />
                      </label>
                      <p className="photoCount" aria-live="polite">
                        {photos.length} / 6 şəkil{photos.length > 1 ? " · Sıranı dəyişmək üçün şəkli basıb saxlayıb sürüşdürün" : ""}
                      </p>
                      <p className="kzPhotoRule">Birinci şəkil elanın üz qabığıdır: kirayə verdiyin əşyanın özünü göstərsin — maşının tam görünüşü, evin otağı, əşyanın özü. Tualet, balkon, küçə, sənəd və ya ekran şəkli birinci ola bilməz.</p>
                      {photoNotice && <p className="kzPhotoNotice" role="status">{photoNotice}</p>}
                      <PhotoOrganizer photos={photos} onChange={next => { setPhotos(next); queueDraft(); }} />
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
                                photos[0]?.src ||
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
                      <button className="add wide" disabled={busy || (!!listingId && !!editBlockedUntil && editBlockedUntil.getTime() > Date.now())}>
                        {busy
                          ? "Göndərilir, gözləyin..."
                          : "Elanı yoxlamaya göndər"}
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
                      <ChevronLeft className="kzI kzIL" aria-hidden="true" size={16} strokeWidth={2.25} />Geri
                    </button>
                  )}
                  <span>{step} / 4 addım</span>
                  {step < 4 && (
                    <button type="button" className="add" onClick={nextStep}>
                      Davam et<ChevronRight className="kzI kzIR" aria-hidden="true" size={16} strokeWidth={2.25} />
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
