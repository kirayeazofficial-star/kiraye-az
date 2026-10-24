"use client";
import { watermarkPhoto } from "../../lib/photo-watermark";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  checkMonthlyListingLimit,
  listingPolicyError,
} from "../../lib/listing-policy";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { listingExamples } from "../../lib/listing-form-options";
import DurationField from "./DurationField";
import ListingCategoryFields from "./ListingCategoryFields";

import {
  readListingAttributes,
  validateListingAttributes,
} from "../../lib/listing-attributes";
import { supabase } from "../../lib/supabase";
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
    setStep(1);
    setMinimumUnit(initial?.attributes?.min_rental_unit || "day");
    setRentalPeriod(initial?.rental_period || "daily");
    setFormVersion((value) => value + 1);
    setCategory(initial?.category || "");
    setTitle(initial?.title || "");
    setCity(initial?.city || "");
    setPrice(initial?.price == null ? "" : String(initial.price));
    setDescriptionText(initial?.description || "");
    manualTitle.current = !!initial;
    setFiles([]);
    setExistingImages(initial?.images || []);
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
    [initial, setInitial] = useState<Listing | null>(null),
    [existingImages, setExistingImages] = useState<string[]>([]),
    [loadError, setLoadError] = useState(false);
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
    if (!supabase) {
      setLoading(false);
      clearTimeout(timer);
      return;
    }
    supabase.auth
      .getUser()
      .then(async ({ data }) => {
        if (!active) return;
        setUser(data.user?.id ?? "");
        setLoginPhone(data.user?.phone ?? "");
        setAccountEmail(data.user?.email || "");
        if (data.user && supabase) {
          setContactName(data.user.user_metadata?.full_name || "");
          try {
            const profile = await supabase
              .from("profiles")
              .select("display_name,phone,role")
              .eq("id", data.user.id)
              .maybeSingle();
            if (!active) return;
            setCanModerate(profile.data?.role === "admin");
            if (profile.data?.display_name)
              setContactName(profile.data.display_name);
            setLoginPhone(data.user.phone || profile.data?.phone || "");
          } catch {
            /* Optional contact defaults must not block loading an existing listing. */
          }
        }
        if (!active) return;
        if (listingId && data.user && supabase) {
          const result = await supabase
            .from("listings")
            .select("*")
            .eq("id", listingId)
            .eq("owner_id", data.user.id)
            .maybeSingle();
          if (!active) return;
          if (result.error || !result.data) {
            setLoadError(true);
            setError(
              "Bu elanı redaktə etmək mümkün deyil. Elan sizə aid olmaya bilər.",
            );
            return;
          }
          setInitial(result.data as Listing);
          setMinimumUnit(result.data.attributes?.min_rental_unit || "day");
          setRentalPeriod(result.data.rental_period);
          setTitle(result.data.title);
          setCity(result.data.city || "");
          setPrice(result.data.price == null ? "" : String(result.data.price));
          setDescriptionText(result.data.description || "");
          manualTitle.current = true;
          setCategory(result.data.category);
          setExistingImages(result.data.images ?? []);
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
    for (const field of fields || []) {
      if (!field.checkValidity()) {
        const details = field.closest("details");
        if (details) details.open = true;
        setStep(current);
        requestAnimationFrame(() => {
          field.reportValidity();
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
    if (!supabase || !user || busy || submitLock.current) return;
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
      if (!listingId || initial?.expires_at) await checkMonthlyListingLimit(user, category, listingId);
      const profile = await supabase
        .from("profiles")
        .upsert({ id: user }, { onConflict: "id", ignoreDuplicates: true });
      if (profile.error)
        throw new Error("Hesab məlumatlarını hazırlamaq mümkün olmadı.");
      const images: string[] = [...existingImages];
      for (const file of files) {
        const branded = await watermarkPhoto(file);
        const path = `${user}/branded-${crypto.randomUUID()}.jpg`;
        const uploaded = await supabase.storage
          .from("listing-images")
          .upload(path, branded, { contentType: branded.type, upsert: false });
        if (uploaded.error)
          throw new Error("Şəkil yüklənmədi. Bir az sonra yenidən yoxlayın.");
        paths.push(path);
        images.push(
          supabase.storage.from("listing-images").getPublicUrl(path).data
            .publicUrl,
        );
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
      const result = listingId
        ? await supabase
            .from("listings")
            .update(payload)
            .eq("id", listingId)
            .eq("owner_id", user)
            .select("id")
            .single()
        : await supabase.from("listings").insert(payload).select("id").single();
      if (result.error) throw new Error(listingPolicyError(result.error));
      saved = true;
      setSuccess(true);
    } catch (err) {
      if (paths.length && !saved) {
        try {
          await supabase.storage.from("listing-images").remove(paths);
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
      <main className="wrap formPage">
        <p className="breadcrumb">
          <Link href="/">Ana səhifə</Link> /{" "}
          {listingId ? "Elanı redaktə et" : "Yeni elan"}
        </p>
        <div className="sectionTitle">
          <div>
            <p className="eyebrow">KİRAYƏ ELANI</p>
            <h1>{listingId ? "Elanı redaktə et" : "Elan yerləşdir"}</h1>
            <p className="muted">
              {listingId
                ? "Dəyişikliklər saxlanıldıqdan sonra elan yenidən yoxlamaya göndəriləcək."
                : "Dəqiq məlumat və aydın şəkillər daha çox maraq yaradır."}
            </p>
          </div>
        </div>
        {!listingId && !canModerate && !loading && (
          <p className="notice">
            Elan yerləşdirmə kateqoriya üzrə limitlə tənzimlənir. Təkrar elan yaratmaq əvəzinə mövcud elanını redaktə et.
          </p>
        )}
        {!success && <aside className="notice" aria-label="Təhlükəsiz elan yerləşdirmə">
          <strong>Təhlükəsizliyinə diqqət et.</strong> Pul almaq üçün kartının PIN/CVV-sini, SMS kodunu və hesab şifrəsini heç kimə vermə. Naməlum şəxslərin göndərdiyi ödəniş keçidlərini açma. Yalnız sənə məxsus və ya yerləşdirməyə icazən olan əşyanın düzgün məlumatlarını və şəkillərini paylaş.
        </aside>}
        {loading ? (
          <section><p role="status">Hesab yoxlanılır...</p>
            <p>Hesabın yoxdur? <a href="/login?mode=signup&next=/new">Qeydiyyatdan keç</a> · <a href="/login?next=/new">Daxil ol</a></p></section>
        ) : success ? (
          <section className="successPanel" role="status">
            <span>✓</span>
            <h2>Elanın yoxlamaya göndərildi</h2>
            <p>
              Təsdiqləndikdən sonra hamı üçün görünəcək. Vəziyyətini kabinetində
              izləyə bilərsən.
            </p>
            <Link className="add" href="/profile">
              Elanlarıma keç
            </Link>
          </section>
        ) : loadError ? (
          <div className="error" role="alert">
            {error} <button type="button" className="secondary" onClick={() => window.location.reload()}>Yenidən yoxla</button> <Link href="/profile">Kabinetə qayıt</Link> <a href="/login?mode=signup&next=/new">Qeydiyyatdan keç</a>
          </div>
        ) : !supabase ? (
          <div className="notice">
            Elan qəbulu hələ aktivləşdirilməyib. Bir az sonra yenidən yoxlayın.
          </div>
        ) : !user ? (
          <section className="empty">
            <h2>Əvvəl hesabına daxil ol</h2>
            <p>Elanlarını idarə etmək üçün şəxsi hesabın olmalıdır.</p>
            <Link className="add" href="/login?next=/new">
              Daxil ol
            </Link> <a className="secondary" href="/login?mode=signup&next=/new">Qeydiyyatdan keç</a>
          </section>
        ) : (
          <div className="formLayout">
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
              onInput={() => {
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
                            : "1 günlük kirayə qiyməti"}{" "}
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
                              ₼ / {rentalPeriod === "monthly" ? "ay" : "gün"}
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
                        <small className="descriptionCounter">
                          {5000 - descriptionText.length} simvol qalıb · ən azı
                          30 simvol
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
                          type="tel"
                          required
                          maxLength={25}
                          placeholder="050 123 45 67"
                        />
                        <small>
                          Bu nömrə elanla birlikdə açıq göstəriləcək.
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
