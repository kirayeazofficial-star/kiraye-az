"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CategoryIcon from "./components/CategoryIcon";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ListingCard from "./components/ListingCard";
import {
  categories,
  cities,
  Listing,
  examples,
  loadListings,
  readFavorites,
  money,
  periodName,
  categoryName,
} from "../lib/marketplace";

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]),
    [loading, setLoading] = useState(true),
    [notice, setNotice] = useState(""),
    [demo, setDemo] = useState(false);
  const [category, setCategory] = useState(""),
    [query, setQuery] = useState(""),
    [city, setCity] = useState(""),
    [period, setPeriod] = useState(""),
    [min, setMin] = useState(""),
    [max, setMax] = useState(""),
    [sort, setSort] = useState("new"),
    [favorites, setFavorites] = useState<string[]>([]),
    [onlyFavorites, setOnlyFavorites] = useState(false),
    [detail, setDetail] = useState<Listing | null>(null),
    [image, setImage] = useState(0),
    [page, setPage] = useState(1);
  useEffect(() => {
    setFavorites(readFavorites());
    setOnlyFavorites(
      new URLSearchParams(window.location.search).has("favorites"),
    );
    let active = true;
    loadListings()
      .then((items) => {
        if (active) setListings(items);
      })
      .catch(() => {
        if (active) {
          setDemo(true);
          setNotice(
            "Hazırda nümunə elanlara baxırsınız. Real elanlar xidmət aktivləşdirildikdən sonra görünəcək.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    setPage(1);
  }, [query, city, category, period, min, max, sort, onlyFavorites]);
  useEffect(() => {
    if (!detail) return;
    const previous = document.activeElement as HTMLElement | null;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetail(null);
      if (e.key === "Tab") {
        const items = Array.from(
          document.querySelectorAll<HTMLElement>(
            "[role=dialog] button, [role=dialog] a[href]",
          ),
        );
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = before;
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [detail]);
  const filtered = useMemo(
    () =>
      (demo ? examples : listings)
        .filter(
          (x) =>
            (!category || x.category === category) &&
            (!city || x.city === city) &&
            (!period || x.rental_period === period) &&
            (!min || x.price >= Number(min)) &&
            (!max || x.price <= Number(max)) &&
            (!onlyFavorites || favorites.includes(x.id)) &&
            `${x.title} ${x.city} ${x.district ?? ""}`
              .toLocaleLowerCase("az")
              .includes(query.toLocaleLowerCase("az")),
        )
        .sort((a, b) =>
          sort === "low"
            ? a.price - b.price
            : sort === "high"
              ? b.price - a.price
              : Date.parse(b.created_at) - Date.parse(a.created_at),
        ),
    [
      demo,
      listings,
      category,
      city,
      period,
      min,
      max,
      onlyFavorites,
      favorites,
      query,
      sort,
    ],
  );
  function favorite(id: string) {
    const next = favorites.includes(id)
      ? favorites.filter((x) => x !== id)
      : [...favorites, id];
    setFavorites(next);
    try {
      localStorage.setItem("kiraye-favorites", JSON.stringify(next));
    } catch {
      setNotice("Seçilmişləri bu brauzerdə saxlamaq mümkün olmadı.");
    }
  }
  function reset() {
    setCategory("");
    setCity("");
    setPeriod("");
    setMin("");
    setMax("");
    setQuery("");
    setOnlyFavorites(false);
  }
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="heroInner">
            <div>
              <p className="eyebrow">AZƏRBAYCANIN KİRAYƏ PLATFORMASI</p>
              <h1>
                Almaq əvəzinə,
                <br />
                <span>kirayələ.</span>
              </h1>
              <p className="lead">
                Bir günlük planlardan uzunmüddətli ehtiyaclara.
                <br />
                Ev, avtomobil və daha çoxu — bir ünvanda.
              </p>
              <div className="heroActions">
                <a href="#elanlar" className="add heroCta">
                  Kirayə elanlarını kəşf et →
                </a>
                <Link href="/new" className="heroLink">
                  Elan yerləşdir →
                </Link>
              </div>
              <div className="heroBenefits">
                <span>✓ Birbaşa əlaqə</span>
                <span>✓ Günlük və aylıq</span>
                <span>✓ Bir hesab, bütün elanlar</span>
              </div>
            </div>
            <div className="heroVisual" aria-label="Kirayə üçün rahat məkanlar">
              <div className="heroCorner">EV · AVTOMOBİL · DAHA ÇOXU</div>
              <div className="heroImage" />
              <div className="heroMiniCard">
                <CategoryIcon id="car" />
                <div>
                  <b>Yolun açıq olsun.</b>
                  <small>Səfərin üçün avtomobil tap</small>
                </div>
                <span>→</span>
              </div>
              <div className="floatingLabel">
                <span>
                  <CategoryIcon id="property" />
                </span>
                <div>
                  <b>Növbəti ünvanını tap</b>
                  <small>Bir evdən daha çoxu.</small>
                </div>
              </div>
              <span className="heroStamp">
                DAHA AĞILLI SEÇİM
                <br />
                <b>kirayələ.</b>
              </span>
            </div>
          </div>
        </section>
        <div className="searchWrap">
          <form
            className="searchPanel"
            onSubmit={(e) => {
              e.preventDefault();
              document
                .getElementById("elanlar")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <label className="queryField">
              <span>Nə axtarırsan?</span>
              <input
                aria-label="Elan axtar"
                placeholder="Ev, avtomobil, avadanlıq..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <label>
              <span>Harada?</span>
              <select
                aria-label="Şəhər"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              >
                <option value="">Bütün şəhərlər</option>
                {cities.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Kirayə müddəti</span>
              <select
                aria-label="Kirayə müddəti"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="">İstənilən müddət</option>
                <option value="daily">Günlük</option>
                <option value="monthly">Aylıq</option>
              </select>
            </label>
            <button className="add">Elanları axtar →</button>
          </form>
        </div>
        <section className="wrap categorySection">
          <div className="sectionTitle">
            <div>
              <p className="eyebrow">HƏR EHTİYACA BİR SEÇİM</p>
              <h2>Nə kirayələmək istəyirsən?</h2>
            </div>
            <button className="textButton" onClick={reset}>
              Bütün kateqoriyalar →
            </button>
          </div>
          <div className="categories">
            {categories.map((c) => (
              <button
                key={c.id}
                aria-label={`${c.name} elanlarına bax`}
                className={category === c.id ? "active" : ""}
                onClick={() => {
                  setCategory(c.id === category ? "" : c.id);
                  document
                    .getElementById("elanlar")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span className="categoryIcon">
                  <CategoryIcon id={c.id} />
                </span>
                <strong>{c.name}</strong>
                <small>Elanlara bax →</small>
              </button>
            ))}
          </div>
        </section>
        <section className="wrap listingSection" id="elanlar">
          <div className="sectionTitle">
            <div>
              <p className="eyebrow">SƏNİN ÜÇÜN SEÇİMLƏR</p>
              <h2>
                {onlyFavorites
                  ? "Seçilmiş elanlar"
                  : category
                    ? categoryName(category)
                    : "Kirayə elanları"}
              </h2>
              <p className="muted">
                {loading
                  ? "Elanlar yüklənir..."
                  : `${filtered.length} ${demo ? "nümunə " : ""}elan tapıldı`}
              </p>
            </div>
            <select
              aria-label="Sıralama"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="new">Əvvəlcə yenilər</option>
              <option value="low">Əvvəlcə ucuz</option>
              <option value="high">Əvvəlcə bahalı</option>
            </select>
          </div>
          <div className="filterRow">
            <label>
              Minimum qiymət
              <input
                aria-label="Minimum qiymət"
                type="number"
                min="0"
                placeholder="0 ₼"
                value={min}
                onChange={(e) => setMin(e.target.value)}
              />
            </label>
            <label>
              Maksimum qiymət
              <input
                aria-label="Maksimum qiymət"
                type="number"
                min="0"
                placeholder="İstənilən ₼"
                value={max}
                onChange={(e) => setMax(e.target.value)}
              />
            </label>
            <button
              className={`pill ${onlyFavorites ? "active" : ""}`}
              aria-pressed={onlyFavorites}
              onClick={() => setOnlyFavorites(!onlyFavorites)}
            >
              ♡ Seçilmişlər ({favorites.length})
            </button>
            <button className="textButton" onClick={reset}>
              Filtrləri təmizlə
            </button>
          </div>
          {notice && (
            <p className="notice" role="status">
              {notice}
            </p>
          )}
          {loading ? (
            <div className="grid">
              {[1, 2, 3].map((i) => (
                <div className="skeleton" key={i} />
              ))}
            </div>
          ) : (
            <div className="grid">
              {filtered.slice(0, page * 9).map((x) => (
                <ListingCard
                  key={x.id}
                  item={x}
                  favorite={favorites.includes(x.id)}
                  onFavorite={() => favorite(x.id)}
                  onOpen={() => {
                    setDetail(x);
                    setImage(0);
                  }}
                />
              ))}
            </div>
          )}
          {!loading && !filtered.length && (
            <div className="empty">
              <span>⌕</span>
              <h3>Uyğun elan tapılmadı</h3>
              <p>Başqa sözlə axtar və ya filtrləri dəyiş.</p>
              <button className="add" onClick={reset}>
                Bütün elanlara bax
              </button>
            </div>
          )}
          {filtered.length > page * 9 && (
            <button className="loadMore" onClick={() => setPage(page + 1)}>
              Daha çox elan göstər ↓
            </button>
          )}
        </section>
        <section className="publishBanner wrap">
          <div>
            <p className="eyebrow">İSTİFADƏ ETMƏDİYİN ƏŞYA GƏLİRİN OLSUN</p>
            <h2>Səndə var, başqasına lazımdır.</h2>
            <p>Elanını yerləşdir, kirayə vermək istəyənlərlə əlaqə qur.</p>
          </div>
          <Link href="/new" className="add">
            İlk elanını yerləşdir →
          </Link>
        </section>
        <section className="wrap how">
          <div>
            <p className="eyebrow">BİR NEÇƏ SADƏ ADDIM</p>
            <h2>Kirayə vermək asandır.</h2>
          </div>
          <div className="steps">
            {[
              [
                "01",
                "Elanını yarat",
                "Şəkilləri, qiyməti və əlaqə məlumatlarını əlavə et.",
              ],
              [
                "02",
                "Təsdiqi gözlə",
                "Elanın yoxlanıldıqdan sonra saytda yayımlanır.",
              ],
              [
                "03",
                "Birbaşa əlaqə qur",
                "Maraqlananlarla danış, şərtləri birlikdə razılaşdır.",
              ],
            ].map((s) => (
              <div key={s[0]}>
                <b>{s[0]}</b>
                <h3>{s[1]}</h3>
                <p>{s[2]}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
      {detail && (
        <div
          className="modalBack"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetail(null);
          }}
        >
          <section
            className="modal detail"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-title"
          >
            <button
              autoFocus
              className="close"
              aria-label="Bağla"
              onClick={() => setDetail(null)}
            >
              ×
            </button>
            <img
              className="detailImage"
              src={detail.images?.[image] || "/placeholder.svg"}
              alt={detail.title}
            />
            {detail.images?.length > 1 && (
              <div className="thumbnails">
                {detail.images.map((src, i) => (
                  <button
                    aria-label={`${i + 1}-ci şəkil`}
                    key={src}
                    onClick={() => setImage(i)}
                  >
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
            <span className="tag">
              {categoryName(detail.category)}
              {detail.demo ? " · Nümunə elan" : ""}
            </span>
            <h2 id="detail-title">{detail.title}</h2>
            <p className="muted">
              ⌖ {detail.city} {detail.district}
            </p>
            <strong className="detailPrice">
              {money(detail.price)} ₼{" "}
              <small>/ {periodName(detail.rental_period)}</small>
            </strong>
            <p className="description">{detail.description}</p>
            {(detail.rooms || detail.area_m2) && (
              <p>
                {detail.rooms ? `${detail.rooms} otaq · ` : ""}
                {detail.area_m2 ? `${detail.area_m2} m²` : ""}
              </p>
            )}
            {detail.contact && !detail.demo ? (
              <div className="contactActions">
                <a
                  className="add"
                  href={`tel:${detail.contact.replace(/[^+\d]/g, "")}`}
                >
                  Zəng et · {detail.contact}
                </a>
                <a
                  className="secondary"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://wa.me/${detail.contact.replace(/\D/g, "").replace(/^0/, "994")}`}
                >
                  WhatsApp
                </a>
              </div>
            ) : (
              <p className="notice">
                Nümunə elandır, real kirayə təklifi deyil.
              </p>
            )}
            <p className="safetyNote">
              Təhlükəsizliyin üçün əmlakı görmədən beh göndərmə.
            </p>
          </section>
        </div>
      )}
    </>
  );
}
