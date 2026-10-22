"use client";
import { rentalCategorySpecs } from "../lib/rental-category-specs";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { searchCatalog, PAGE_SIZE } from "../lib/catalog";
import { supabase } from "../lib/supabase";
import { matchesRentalFilters, isProperty } from "../lib/rental-details";
import {
  carModels,
  motorcycleModels,
  bicycleModels,
  equipmentModels,
} from "../lib/listing-form-options";
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
    [allCategories, setAllCategories] = useState(false),
    [rooms, setRooms] = useState(""),
    [area, setArea] = useState(""),
    [brand, setBrand] = useState(""),
    [gearbox, setGearbox] = useState(""),
    [noDeposit, setNoDeposit] = useState(false),
    [from, setFrom] = useState(""),
    [until, setUntil] = useState(""),
    [total, setTotal] = useState(0),
    [retry, setRetry] = useState(0);
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
  const brandOptions = Object.keys(
    category === "car"
      ? carModels
      : category === "motorcycle"
        ? motorcycleModels
        : category === "bicycle"
          ? bicycleModels
          : {},
  );
  if (category === "equipment") {
    brandOptions.push(
      ...Array.from(
        new Set(
          Object.values(equipmentModels).flatMap((brands) =>
            Object.keys(brands),
          ),
        ),
      ),
    );
  }
  if (rentalCategorySpecs[category]) {
    const extraBrands = Object.values(rentalCategorySpecs[category].kinds).flatMap(kind => Object.keys(kind.models));
    brandOptions.push(...extraBrands.filter((name, index) => !brandOptions.includes(name) && extraBrands.indexOf(name) === index));
  }
  function changeCategory(value: string) {
    setCategory(value);
    setRooms("");
    setArea("");
    setBrand("");
    setGearbox("");
  }
  function reset() {
    setAllCategories(false);
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
  const activeFilters = [
    category && {
      label: categoryName(category),
      clear: () => changeCategory(""),
    },
    query && { label: `Axtarış: ${query}`, clear: () => setQuery("") },
    city && { label: city, clear: () => setCity("") },
    period && {
      label: period === "daily" ? "Günlük kirayə" : "Aylıq kirayə",
      clear: () => {
        setPeriod("");
        setMin("");
        setMax("");
      },
    },
    min && { label: `Ən azı ${min} ₼`, clear: () => setMin("") },
    max && { label: `Ən çox ${max} ₼`, clear: () => setMax("") },
    rooms && { label: `${rooms} otaq`, clear: () => setRooms("") },
    area && { label: `Ən azı ${area} m²`, clear: () => setArea("") },
    brand && { label: brand, clear: () => setBrand("") },
    gearbox && { label: gearbox, clear: () => setGearbox("") },
    noDeposit && { label: "Depozitsiz", clear: () => setNoDeposit(false) },
    from && { label: `Başlanğıc: ${from}`, clear: () => setFrom("") },
    until && { label: `Son tarix: ${until}`, clear: () => setUntil("") },
    onlyFavorites && {
      label: "Yalnız seçilmişlər",
      clear: () => setOnlyFavorites(false),
    },
  ].filter(
    (filter): filter is { label: string; clear: () => void } => !!filter,
  );
  return (
    <>
      <Header />
      <main className="rentalHome">
        <section className="catalogIntro">
          <div>
            <p className="heroKicker">
              <span aria-hidden="true">↗</span> Günlük və aylıq kirayə
            </p>
            <h1>
              Almağa tələsmə.
              <br />
              <em>Kirayələ.</em>
            </h1>
            <span>
              Ev, nəqliyyat, avadanlıq — ehtiyacına uyğun olanı tap, sahibi ilə
              birbaşa danış.
            </span>
          </div>
          <div className="heroNote">
            <span aria-hidden="true">⌂</span>
            <strong>Bir ünvan. Çox seçim.</strong>
            <p>
              Şəhəri seç, qiymətləri müqayisə et,
              <br />
              kirayəni birbaşa razılaşdır.
            </p>
          </div>
        </section>
        <section className="wrap categorySection">
          <div className="sectionTitle">
            <div>
              <p className="eyebrow">HƏR EHTİYACA BİR SEÇİM</p>
              <h2>Nə kirayələmək istəyirsən?</h2>
            </div>
            <button
              className="textButton"
              aria-expanded={allCategories}
              aria-controls="all-categories"
              onClick={() => {
                changeCategory("");
                setAllCategories(!allCategories);
              }}
            >
              {allCategories
                ? "Kateqoriyaları bağla ×"
                : "Bütün kateqoriyalar →"}
            </button>
          </div>
          {allCategories && (
            <div
              className="allCategories"
              id="all-categories"
              aria-label="Bütün kateqoriyalar"
            >
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  changeCategory("");
                  setAllCategories(false);
                  document
                    .getElementById("elanlar")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Bütün elanlara bax
              </button>
              {categories.map((item) => (
                <button
                  type="button"
                  className="secondary"
                  key={item.id}
                  onClick={() => {
                    changeCategory(item.id);
                    setAllCategories(false);
                    setAdvanced(true);
                    document
                      .getElementById("kiraye-axtaris")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}
          <div className="categories">
            {categories.map((c) => (
              <button
                key={c.id}
                aria-label={`${c.name} elanlarına bax`}
                className={category === c.id ? "active" : ""}
                aria-pressed={category === c.id}
                onClick={() => {
                  changeCategory(c.id === category ? "" : c.id);
                  document
                    .getElementById("kiraye-axtaris")
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
        <div className="searchWrap" id="kiraye-axtaris">
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
                onChange={(e) => {
                  setPeriod(e.target.value);
                  setMin("");
                  setMax("");
                }}
              >
                <option value="">İstənilən müddət</option>
                <option value="daily">Günlük</option>
                <option value="monthly">Aylıq</option>
              </select>
            </label>
            <button className="add">Elanları axtar →</button>
          </form>
        </div>
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
              <p className="muted" role="status" aria-live="polite">
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
          <div className="filterRow" aria-label="Kirayə filtrləri">
            <button
              className={`pill ${noDeposit ? "active" : ""}`}
              aria-pressed={noDeposit}
              onClick={() => setNoDeposit(!noDeposit)}
            >
              Depozitsiz kirayə
            </button>
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
          <p className="rentalSearchHint">
            {period === "daily"
              ? "Qiymətlər bir günlük kirayə üçündür."
              : period === "monthly"
                ? "Qiymətlər bir aylıq kirayə üçündür."
                : "Günlük və aylıq qiymətləri ayrıca müqayisə etmək üçün kirayə müddətini seç."}
          </p>
          {activeFilters.length > 0 && (
            <div className="activeFilters" aria-label="Seçilmiş filtrlər">
              {activeFilters.map((filter) => (
                <button
                  key={filter.label}
                  className="filterChip"
                  onClick={filter.clear}
                  aria-label={`${filter.label} filtrini sil`}
                >
                  {filter.label}
                  <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
          )}
          {advanced && (
            <div className="advancedFilters">
              <label>
                Kateqoriya
                <select
                  aria-label="Filtr kateqoriyası"
                  value={category}
                  onChange={(e) => changeCategory(e.target.value)}
                >
                  <option value="">Bütün kateqoriyalar</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              {period && (
                <>
                  <label>
                    Minimum qiymət (₼ / {period === "daily" ? "gün" : "ay"})
                    <input
                      aria-label="Minimum qiymət"
                      type="number"
                      min="0"
                      value={min}
                      onChange={(event) => setMin(event.target.value)}
                    />
                  </label>
                  <label>
                    Maksimum qiymət (₼ / {period === "daily" ? "gün" : "ay"})
                    <input
                      aria-label="Maksimum qiymət"
                      type="number"
                      min="0"
                      value={max}
                      onChange={(event) => setMax(event.target.value)}
                    />
                  </label>
                </>
              )}
              {["property", "villa"].includes(category) && (
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
              )}
              {isProperty(category) && (
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
              )}
              {brandOptions.length > 0 && (
                <label>
                  {category === "car"
                    ? "Avtomobil markası"
                    : category === "bicycle"
                      ? "Velosiped markası"
                      : category === "motorcycle"
                        ? "Motosiklet markası"
                        : "Marka"}
                  <select
                    aria-label={
                      category === "car" ? "Avtomobil markası" : "Marka"
                    }
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                  >
                    <option value="">İstənilən</option>
                    {brandOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {["car", "motorcycle"].includes(category) && (
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
              )}
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
            <div className="grid">
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
