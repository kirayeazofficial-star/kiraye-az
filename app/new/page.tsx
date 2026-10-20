"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { supabase } from "../../lib/supabase";
import { categories, cities } from "../../lib/marketplace";

export default function NewListing() {
  const [user, setUser] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(false),
    [files, setFiles] = useState<File[]>([]),
    [previews, setPreviews] = useState<string[]>([]),
    [category, setCategory] = useState("property");
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth
      .getUser()
      .then(({ data }) => setUser(data.user?.id ?? ""))
      .catch(() => setError("Hesabı yoxlamaq mümkün olmadı."))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [files]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !user || busy) return;
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
    if (!files.length) {
      setError("Ən azı bir şəkil əlavə edin.");
      return;
    }
    setBusy(true);
    const paths: string[] = [];
    let saved = false;
    try {
      const profile = await supabase
        .from("profiles")
        .upsert({ id: user }, { onConflict: "id", ignoreDuplicates: true });
      if (profile.error)
        throw new Error("Hesab məlumatlarını hazırlamaq mümkün olmadı.");
      const images: string[] = [];
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
      const price = Number(form.get("price"));
      if (!Number.isFinite(price) || price <= 0 || price > 1000000)
        throw new Error("Qiymət 0 ilə 1 000 000 ₼ arasında olmalıdır.");
      const result = await supabase
        .from("listings")
        .insert({
          owner_id: user,
          category,
          title,
          description,
          contact,
          city: form.get("city"),
          district: String(form.get("district") ?? "").trim(),
          price,
          rental_period: form.get("rental_period"),
          images,
          status: "pending",
          rooms: form.get("rooms") ? Number(form.get("rooms")) : null,
          area_m2: form.get("area_m2") ? Number(form.get("area_m2")) : null,
        });
      if (result.error)
        throw new Error(
          "Elan göndərilmədi. Məlumatları yoxlayıb yenidən cəhd edin.",
        );
      saved = true;
      setSuccess(true);
    } catch (err) {
      if (paths.length && !saved)
        await supabase.storage.from("listing-images").remove(paths);
      setError(err instanceof Error ? err.message : "Xəta baş verdi.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Header />
      <main className="wrap formPage">
        <p className="breadcrumb">
          <Link href="/">Ana səhifə</Link> / Yeni elan
        </p>
        <div className="sectionTitle">
          <div>
            <p className="eyebrow">ƏŞYALARINA YENİ BİR FÜRSƏT VER</p>
            <h1>Elan yerləşdir</h1>
            <p className="muted">
              Dəqiq məlumat və aydın şəkillər daha çox maraq yaradır.
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
            <form className="listingForm" onSubmit={submit}>
              <fieldset disabled={busy}>
                <h2>
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
                    required
                    minLength={10}
                    maxLength={120}
                    placeholder="Məsələn: Nizami metrosu yaxınlığında 2 otaqlı mənzil"
                  />
                </label>
                <div className="formGrid">
                  <label>
                    Şəhər
                    <select name="city">
                      {cities.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Rayon / qəsəbə
                    <input
                      name="district"
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
                    <select name="rental_period">
                      <option value="daily">Günlük</option>
                      <option value="monthly">Aylıq</option>
                    </select>
                  </label>
                </div>
                {["property", "villa", "commercial"].includes(category) && (
                  <div className="formGrid">
                    <label>
                      Otaq sayı
                      <input name="rooms" type="number" min="1" max="100" />
                    </label>
                    <label>
                      Sahə (m²)
                      <input
                        name="area_m2"
                        type="number"
                        min="1"
                        max="1000000"
                      />
                    </label>
                  </div>
                )}
                <label>
                  Ətraflı təsvir
                  <textarea
                    name="description"
                    required
                    minLength={30}
                    maxLength={5000}
                    rows={5}
                    placeholder="Vəziyyəti, imkanları, kirayə şərtlərini və digər vacib məlumatları yazın."
                  />
                </label>
                <h2>
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
                        selected.length > 6 ||
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
                      setFiles(selected);
                      setError("");
                    }}
                  />
                </label>
                <div className="uploadPreviews">
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
                    </div>
                  ))}
                </div>
                <h2>
                  03 <span>Əlaqə</span>
                </h2>
                <label>
                  Telefon nömrəsi
                  <input
                    name="contact"
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
                <button className="add wide" disabled={busy}>
                  {busy
                    ? "Göndərilir, gözləyin..."
                    : "Elanı yoxlamaya göndər →"}
                </button>
              </fieldset>
            </form>
            <aside className="tips">
              <span>✧</span>
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
