"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { searchCatalog, PAGE_SIZE } from "../lib/catalog";
import { supabase } from "../lib/supabase";
import { matchesRentalFilters } from "../lib/rental-details";
import ListingDetails from "./components/ListingDetails";
import CategoryIcon from "./components/CategoryIcon";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ListingCard from "./components/ListingCard";
import {
  categories,
  cities,
  Listing,
  examples,
  readFavorites,
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
    [page, setPage] = useState(1),
    [advanced, setAdvanced] = useState(false),
    [rooms, setRooms] = useState(""),
    [area, setArea] = useState(""),
    [brand, setBrand] = useState(""),
    [gearbox, setGearbox] = useState(""),
    [noDeposit, setNoDeposit] = useState(false),
    [from, setFrom] = useState(""),
    [until, setUntil] = useState(""),
    [total, setTotal] = useState(0),
    [retry, setRetry] = useState(0),
    [layout, setLayout] = useState("grid");
  useEffect(() => {
    setFavorites(readFavorites());
    setOnlyFavorites(
      new URLSearchParams(window.location.search).has("favorites"),
    );
    const syncFavorites = () => setFavorites(readFavorites());
    window.addEventListener("kiraye:favorites", syncFavorites);
    return () => window.removeEventListener("kiraye:favorites", syncFavorites);
  }, []);
  const favoriteIds = onlyFavorites ? favorites.join(",") : "";
  useEffect(() => {
    if (!supabase) {
      setDemo(true);
      setLoading(false);
      setNotice(
        "Hazırda nümunə elanlara baxırsınız. Real elanlar xidmət aktivləşdirildikdən sonra görünəcək.",
      );
      return;
    }
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      searchCatalog({
        category,
        city,
        period,
        query,
        min,
        max,
        sort,
        page,
        rooms,
        area,
        brand,
        gearbox,
        noDeposit,
        from,
        until,
        favorites: onlyFavorites
          ? favoriteIds
            ? favoriteIds.split(",")
            : []
          : null,
      })
        .then(({ items, total }) => {
          if (active) {
            setListings(items);
            setTotal(total);
            setDemo(false);
            setNotice("");
          }
        })
        .catch(() => {
          if (active) {
            setListings([]);
            setTotal(0);
            setDemo(false);
            setNotice(
              "Elanları yükləmək mümkün olmadı. Bağlantını yoxlayıb yenidən cəhd et.",
            );
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    category,
    city,
    period,
    query,
    min,
    max,
    sort,
    page,
    rooms,
    area,
    brand,
    gearbox,
    noDeposit,
    from,
    until,
    onlyFavorites,
    favoriteIds,
    retry,
  ]);
  useEffect(() => {
    setPage(1);
  }, [
    query,
    city,
    category,
    period,
    min,
    max,
    sort,
    onlyFavorites,
    rooms,
    area,
    brand,
    gearbox,
    noDeposit,
    from,
    until,
  ]);
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
            "[role=dialog] button:not([disabled]), [role=dialog] a[href], [role=dialog] input:not([disabled]), [role=dialog] select:not([disabled]), [role=dialog] textarea:not([disabled])",
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
  const filtered = useMemo(() => {
    if (!demo) return listings;
    return examples
      .filter(
        (x) =>
          (!category || x.category === category) &&
          (!city || x.city === city) &&
          (!period || x.rental_period === period) &&
          (!min || x.price >= Number(min)) &&
          (!max || x.price <= Number(max)) &&
          (!onlyFavorites || favorites.includes(x.id)) &&
          matchesRentalFilters(x, {
            rooms,
            area,
            brand,
            gearbox,
            noDeposit,
            from,
            until,
          }) &&
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
      );
  }, [
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
    rooms,
    area,
    brand,
    gearbox,
    noDeposit,
    from,
    until,
  ]);
  function favorite(id: string) {
    const next = favorites.includes(id)
      ? favorites.filter((x) => x !== id)
      : [...favorites, id];
    setFavorites(next);
    try {
      localStorage.setItem("kiraye-favorites", JSON.stringify(next));
      window.dispatchEvent(new Event("kiraye:favorites"));
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
    setRooms("");
    setArea("");
    setBrand("");
    setGearbox("");
    setNoDeposit(false);
    setFrom("");
    setUntil("");
  }
  return (
    <>
      <Header />
      <main>
        <section className="catalogIntro">
          <div>
            <p>Azərbaycan üzrə kirayə elanları</p>
            <h1>Kirayə elanları</h1>
            <span>Ev, avtomobil və avadanlıq — günlük və aylıq kirayə təklifləri.</span>
          </div>
          <Link className="introAction" href="/new">
            Elan yerləşdir →
          </Link>
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
                  : `${demo ? filtered.length : total} ${demo ? "nümunə " : ""}elan tapıldı`}
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
          <div className="viewControls">
            <button
              className="secondary"
              aria-pressed={layout === "grid"}
              onClick={() => setLayout("grid")}
            >
              ▦ Kartlar
            </button>
            <button
              className="secondary"
              aria-pressed={layout === "list"}
              onClick={() => setLayout("list")}
            >
              ☰ Siyahı
            </button>
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
            <button
              className="filterToggleButton"
              aria-expanded={advanced}
              onClick={() => setAdvanced(!advanced)}
            >
              Ətraflı filtrlər
            </button>
            <button className="textButton" onClick={reset}>
              Filtrləri təmizlə
            </button>
          </div>
          {advanced && (
            <div className="advancedFilters">
              <label>
                Otaq sayı
                <select
                  aria-label="Otaq sayı"
                  value={rooms}
                  onChange={(e) => setRooms(e.target.value)}
                >
                  <option value="">İstənilən</option>
                  <option value="1">1 otaq</option>
                  <option value="2">2 otaq</option>
                  <option value="3">3 otaq</option>
                  <option value="4+">4 və daha çox</option>
                </select>
              </label>
              <label>
                Minimum sahə (m²)
                <input
                  aria-label="Minimum sahə"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  type="number"
                  min="0"
                />
              </label>
              <label>
                Avtomobil markası
                <input
                  aria-label="Avtomobil markası"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Hyundai"
                />
              </label>
              <label>
                Sürətlər qutusu
                <select
                  aria-label="Sürətlər qutusu"
                  value={gearbox}
                  onChange={(e) => setGearbox(e.target.value)}
                >
                  <option value="">İstənilən</option>
                  <option>Avtomat</option>
                  <option>Mexaniki</option>
                </select>
              </label>
              <label>
                Başlanğıc tarixi
                <input
                  aria-label="Başlanğıc tarixi"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </label>
              <label>
                Son tarix
                <input
                  aria-label="Son tarix"
                  type="date"
                  min={from || undefined}
                  value={until}
                  onChange={(e) => setUntil(e.target.value)}
                />
              </label>
              <label className="checkLabel">
                <input
                  type="checkbox"
                  checked={noDeposit}
                  onChange={(e) => setNoDeposit(e.target.checked)}
                />{" "}
                Depozitsiz
              </label>
              <p className="homeHelp">
                Tarix filtri elan sahibinin göstərdiyi aralığa əsaslanır.
                Mövcudluğu əlaqə saxlayaraq dəqiqləşdir.
              </p>
            </div>
          )}
          {notice && (
            <p className="notice" role="status">
              {notice}
              {!demo && (
                <button
                  className="textButton"
                  onClick={() => setRetry(retry + 1)}
                >
                  Yenidən yoxla
                </button>
              )}
            </p>
          )}
          {loading ? (
            <div className="grid">
              {Array.from({ length: 8 }, (_, i) => i).map((i) => (
                <div className="skeleton" key={i} />
              ))}
            </div>
          ) : (
            <div className={layout === "list" ? "grid catalogList" : "grid"}>
              {filtered.map((x) => (
                <ListingCard
                  key={x.id}
                  item={x}
                  favorite={favorites.includes(x.id)}
                  onFavorite={() => favorite(x.id)}
                  onOpen={() => {
                    setDetail(x);
                  }}
                />
              ))}
            </div>
          )}
          {!loading && !filtered.length && (
            <div className="empty">
              <span>⌕</span>
              <h3>Uyğun elan tapılmadı</h3>
              <p>Başqa sözlə axtar və ya öz kirayə elanını yerləşdir.</p>
              <Link className="add" href="/new">
                + Elan yerləşdir
              </Link>
              <button className="add" onClick={reset}>
                Bütün elanlara bax
              </button>
            </div>
          )}
          {!demo && total > PAGE_SIZE && (
            <nav className="pagination" aria-label="Elan səhifələri">
              <button
                className="secondary"
                disabled={page === 1 || loading}
                onClick={() => {
                  setPage(page - 1);
                  document.getElementById("elanlar")?.scrollIntoView();
                }}
              >
                ← Əvvəlki
              </button>
              <span>
                {page} / {Math.ceil(total / PAGE_SIZE)}
              </span>
              <button
                className="secondary"
                disabled={page * PAGE_SIZE >= total || loading}
                onClick={() => {
                  setPage(page + 1);
                  document.getElementById("elanlar")?.scrollIntoView();
                }}
              >
                Növbəti →
              </button>
            </nav>
          )}
        </section>
        <section className="publishBanner wrap">
          <div>
            <p className="eyebrow">İSTİFADƏ ETMƏDİYİN ƏŞYA GƏLİRİN OLSUN</p>
            <h2>Səndə var, başqasına lazımdır.</h2>
            <p>Elanını yerləşdir, kirayə götürmək istəyənlərlə əlaqə qur.</p>
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
            <ListingDetails key={detail.id} item={detail} compact />
          </section>
        </div>
      )}
    </>
  );
}
