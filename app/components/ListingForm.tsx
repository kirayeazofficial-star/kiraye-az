"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { supabase } from "../../lib/supabase";
import {
  amenities,
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
  const submitLock = useRef(false);
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
    [category, setCategory] = useState("property"),
    [initial, setInitial] = useState<Listing | null>(null),
    [existingImages, setExistingImages] = useState<string[]>([]),
    [loadError, setLoadError] = useState(false);
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth
      .getUser()
      .then(async ({ data }) => {
        setUser(data.user?.id ?? "");
        setLoginPhone(data.user?.phone ?? "");
        if (listingId && data.user && supabase) {
          const result = await supabase
            .from("listings")
            .select("*")
            .eq("id", listingId)
            .eq("owner_id", data.user.id)
            .maybeSingle();
          if (result.error || !result.data) {
            setLoadError(true);
            setError(
              "Bu elanı redaktə etmək mümkün deyil. Elan sizə aid olmaya bilər.",
            );
            return;
          }
          setInitial(result.data as Listing);
          setCategory(result.data.category);
          setExistingImages(result.data.images ?? []);
        }
      })
      .catch(() => setError("Hesabı yoxlamaq mümkün olmadı."))
      .finally(() => setLoading(false));
  }, [listingId]);
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [files]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !user || busy || submitLock.current) return;
    setError("");
    const form = new FormData(e.currentTarget),
      title = String(form.get("title") ?? "").trim(),
      description = String(form.get("description") ?? "").trim(),
      contact = String(form.get("contact") ?? "").trim();
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
      min_days: Number(form.get("min_days") || 1),
      available_from: String(form.get("available_from") || "") || null,
      available_until: String(form.get("available_until") || "") || null,
    };
    const rentalError = validateRentalDetails(rental);
    if (rentalError) {
      setError(rentalError);
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
      const profile = await supabase
        .from("profiles")
        .upsert({ id: user }, { onConflict: "id", ignoreDuplicates: true });
      if (profile.error)
        throw new Error("Hesab məlumatlarını hazırlamaq mümkün olmadı.");
      const images: string[] = [...existingImages];
      for (const file of files) {
        const ext =
          file.type === "image/png"
            ? "png"
            : file.type === "image/webp"
              ? "webp"
              : "jpg";
        const path = `${user}/${crypto.randomUUID()}.${ext}`;
        const uploaded = await supabase.storage
          .from("listing-images")
          .upload(path, file, { contentType: file.type, upsert: false });
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
        district: String(form.get("district") ?? "").trim(),
        price,
        rental_period: form.get("rental_period"),
        images,
        status: "pending",
        ...rental,
        rooms:
          isProperty(category) && form.get("rooms")
            ? Number(form.get("rooms"))
            : null,
        area_m2:
          isProperty(category) && form.get("area_m2")
            ? Number(form.get("area_m2"))
            : null,
        attributes: ["car", "motorcycle"].includes(category)
          ? {
              brand: String(form.get("brand") || "").trim(),
              model: String(form.get("model") || "").trim(),
              year: form.get("year") ? Number(form.get("year")) : undefined,
              gearbox: String(form.get("gearbox") || ""),
            }
          : isProperty(category)
            ? { amenities: form.getAll("amenities").map(String) }
            : {},
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
      if (result.error)
        throw new Error(
          "Elan göndərilmədi. Məlumatları yoxlayıb yenidən cəhd edin.",
        );
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
        {loading ? (
          <p role="status">Hesab yoxlanılır...</p>
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
            {error} <Link href="/profile">Kabinetə qayıt</Link>
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
              Daxil ol / Qeydiyyatdan keç
            </Link>
          </section>
        ) : (
          <div className="formLayout">
            <form
              ref={formRef}
              className="listingForm"
              onSubmit={submit}
              onInput={() => {
                if (preview) updatePreview();
              }}
            >
              <fieldset disabled={busy}>
                <nav className="publishSteps" aria-label="Elan bölmələri">
                  <a href="#listing-info">1. Məlumatlar</a>
                  <a href="#listing-photos">2. Şəkillər</a>
                  <a href="#listing-contact">3. Əlaqə</a>
                </nav>
                <h2 id="listing-info">
                  01 <span>Elanın məlumatları</span>
                </h2>
                <label>
                  Kateqoriya
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option value={c.id} key={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Elanın başlığı
                  <input
                    name="title"
                    defaultValue={initial?.title}
                    required
                    minLength={10}
                    maxLength={120}
                    placeholder="Məsələn: Nizami metrosu yaxınlığında 2 otaqlı mənzil"
                  />
                </label>
                <div className="formGrid">
                  <label>
                    Şəhər
                    <select name="city" defaultValue={initial?.city}>
                      {cities.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Rayon / qəsəbə
                    <input
                      name="district"
                      defaultValue={initial?.district}
                      maxLength={80}
                      placeholder="Məsələn: Nəsimi"
                    />
                  </label>
                </div>
                <div className="formGrid">
                  <label>
                    Qiymət (₼)
                    <input
                      name="price"
                      defaultValue={initial?.price}
                      required
                      type="number"
                      min="0.01"
                      max="1000000"
                      step="0.01"
                      placeholder="45"
                    />
                  </label>
                  <label>
                    Kirayə müddəti
                    <select
                      name="rental_period"
                      defaultValue={initial?.rental_period}
                    >
                      <option value="daily">Günlük</option>
                      <option value="monthly">Aylıq</option>
                    </select>
                  </label>
                </div>
                {["property", "villa", "commercial"].includes(category) && (
                  <div className="formGrid">
                    <label>
                      Otaq sayı
                      <input
                        name="rooms"
                        defaultValue={initial?.rooms ?? undefined}
                        type="number"
                        min="1"
                        max="100"
                      />
                    </label>
                    <label>
                      Sahə (m²)
                      <input
                        name="area_m2"
                        defaultValue={initial?.area_m2 ?? undefined}
                        type="number"
                        min="1"
                        max="1000000"
                      />
                    </label>
                  </div>
                )}
                {["car", "motorcycle"].includes(category) && (
                  <>
                    <div className="formGrid">
                      <label>
                        Marka
                        <input
                          name="brand"
                          maxLength={40}
                          defaultValue={initial?.attributes?.brand}
                          placeholder="Məsələn: Hyundai"
                        />
                      </label>
                      <label>
                        Model
                        <input
                          name="model"
                          maxLength={60}
                          defaultValue={initial?.attributes?.model}
                          placeholder="Elantra"
                        />
                      </label>
                    </div>
                    <div className="formGrid">
                      <label>
                        Buraxılış ili
                        <input
                          name="year"
                          type="number"
                          min="1950"
                          max={new Date().getFullYear() + 1}
                          defaultValue={initial?.attributes?.year}
                        />
                      </label>
                      <label>
                        Sürətlər qutusu
                        <select
                          name="gearbox"
                          defaultValue={initial?.attributes?.gearbox}
                        >
                          <option value="">Seçilməyib</option>
                          <option>Avtomat</option>
                          <option>Mexaniki</option>
                        </select>
                      </label>
                    </div>
                  </>
                )}
                {isProperty(category) && (
                  <div className="amenitiesField">
                    <p>İmkanlar</p>
                    {amenities.map((a) => (
                      <label className="checkLabel" key={a}>
                        <input
                          type="checkbox"
                          name="amenities"
                          value={a}
                          defaultChecked={initial?.attributes?.amenities?.includes(
                            a,
                          )}
                        />
                        <span>{a}</span>
                      </label>
                    ))}
                  </div>
                )}
                <div className="formGrid">
                  <label>
                    Depozit (₼)
                    <input
                      name="deposit"
                      type="number"
                      min="0"
                      max="1000000"
                      step="0.01"
                      defaultValue={initial?.deposit ?? 0}
                    />
                  </label>
                  <label>
                    Minimum kirayə (gün)
                    <input
                      name="min_days"
                      type="number"
                      min="1"
                      max="365"
                      required
                      defaultValue={initial?.min_days ?? 1}
                    />
                  </label>
                </div>
                <div className="formGrid">
                  <label>
                    Bu tarixdən mövcuddur
                    <input
                      name="available_from"
                      type="date"
                      defaultValue={initial?.available_from ?? ""}
                    />
                  </label>
                  <label>
                    Bu tarixədək mövcuddur
                    <input
                      name="available_until"
                      type="date"
                      defaultValue={initial?.available_until ?? ""}
                    />
                  </label>
                </div>
                <p className="muted">
                  Tarixlər rezervasiya yaratmır. Kirayə şərtləri tərəflər
                  arasında dəqiqləşdirilir.
                </p>
                <label>
                  Ətraflı təsvir
                  <textarea
                    name="description"
                    defaultValue={initial?.description}
                    required
                    minLength={30}
                    maxLength={5000}
                    rows={5}
                    placeholder="Vəziyyəti, imkanları, kirayə şərtlərini və digər vacib məlumatları yazın."
                  />
                </label>
                <h2 id="listing-photos">
                  02 <span>Şəkillər</span>
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
                        selected.length + files.length + existingImages.length >
                          6 ||
                        selected.some(
                          (f) =>
                            f.size > 5 * 1024 * 1024 ||
                            !["image/jpeg", "image/png", "image/webp"].includes(
                              f.type,
                            ),
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
                  {files.length + existingImages.length} / 6 şəkil · İlk şəkil
                  elanın üz qabığıdır.
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
                <h2 id="listing-contact">
                  03 <span>Əlaqə</span>
                </h2>
                <label>
                  Telefon nömrəsi
                  <input
                    name="contact"
                    defaultValue={initial?.contact || loginPhone}
                    type="tel"
                    required
                    maxLength={25}
                    placeholder="050 123 45 67"
                  />
                  <small>Bu nömrə elanla birlikdə açıq göstəriləcək.</small>
                </label>
                <label className="checkLabel">
                  <input type="checkbox" required />{" "}
                  <span>
                    <Link href="/rules" target="_blank">
                      Elan qaydalarını
                    </Link>{" "}
                    qəbul edirəm və məlumatların düzgünlüyünü təsdiq edirəm.
                  </span>
                </label>
                {error && (
                  <p className="error" role="alert">
                    {error}
                  </p>
                )}
                <button
                  type="button"
                  className="secondary wide previewToggle"
                  aria-expanded={!!preview}
                  disabled={busy}
                  onClick={() => (preview ? setPreview(null) : updatePreview())}
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
                          existingImages[0] || previews[0] || "/placeholder.svg"
                        }
                        alt="Elanın üz qabığı"
                      />
                      <div>
                        <strong>
                          {preview.price > 0 && Number.isFinite(preview.price)
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
