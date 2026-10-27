"use client";
import NavigationIcon from "./NavigationIcon";
import { matchesSearch, rentalSearchIntent } from "../../lib/search-query";
import { readSavedSearches, saveSearch, removeSavedSearch, type SavedSearch } from "../../lib/saved-searches";
import CatalogFilters from "./CatalogFilters";
import { useCallback } from "react";
import AzerbaijaniDateInput from "./AzerbaijaniDateInput";
import { useLanguage } from "./LanguageProvider";
import { readSearchHistory, rememberSearch, clearSearchHistory } from "../../lib/search-history";
import { rentalCategorySpecs } from "../../lib/rental-category-specs";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { searchCatalog, PAGE_SIZE } from "../../lib/catalog";
import { supabase } from "../../lib/supabase";
import { matchesRentalFilters, isProperty } from "../../lib/rental-details";
import {
  carModels,
  motorcycleModels,
  bicycleModels,
  equipmentModels,
} from "../../lib/listing-form-options";
import CategoryVisual from "./CategoryVisual";
import ListingSuggestions from "./ListingSuggestions";
import Header from "./Header";
import Footer from "./Footer";
import ListingCard from "./ListingCard";
import {
  categories,
  cities,
  Listing,
  examples,
  readFavorites,
  categoryName,
  periodName,
} from "../../lib/marketplace";

export default function Home() {
  const {t} = useLanguage();
  const [listings, setListings] = useState<Listing[]>([]),
    [loading, setLoading] = useState(true),
    [notice, setNotice] = useState(""),
    [demo, setDemo] = useState(false);
  const [savedSearches,setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [category, setCategory] = useState(""),
    [query, setQuery] = useState(""),
    [city, setCity] = useState(""),
    [period, setPeriod] = useState(""),
    [min, setMin] = useState(""),
    [max, setMax] = useState(""),
    [sort, setSort] = useState("new"),
    [favorites, setFavorites] = useState<string[]>([]),
    [onlyFavorites, setOnlyFavorites] = useState(false),
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
    const params=new URLSearchParams(window.location.search);
    const initialCategory=params.get("category");if(categories.some(item=>item.id===initialCategory))setCategory(initialCategory!);
    const owner=params.get("owner");if(owner && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(owner))setOwnerFilter(owner);
    const initialQuery=params.get("q");if(initialQuery)setQuery(initialQuery.slice(0,120));
    setSearchHistory(readSearchHistory());
    setSavedSearches(readSavedSearches());
    setFavorites(readFavorites());
    setOnlyFavorites(
      new URLSearchParams(window.location.search).has("favorites"),
    );
    const syncFavorites = () => setFavorites(readFavorites());
    window.addEventListener("kiraye:favorites", syncFavorites);
    return () => window.removeEventListener("kiraye:favorites", syncFavorites);
  }, []);
  const [ownerFilter,setOwnerFilter]=useState("");
  const [moreCategories, setMoreCategories] = useState(true);
  const closeFilters = useCallback(() => setAdvanced(false), []);
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
        owner:ownerFilter,
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
    ownerFilter,
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
  const filtered = useMemo(() => {
    if (!demo) return listings;
    const intent = rentalSearchIntent(query);
    return examples
      .filter(
        (x) =>
          (!category || x.category === category) &&
          (!ownerFilter || x.owner_id === ownerFilter) &&
          (!intent.categories.length || intent.categories.includes(x.category)) &&
          (!(city || intent.city) || x.city === (city || intent.city)) &&
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
          matchesSearch(`${x.title} ${x.city} ${x.district ?? ""} ${x.attributes?.brand || ""} ${x.attributes?.model || ""}`, intent.query),
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
    ownerFilter,
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
  function rememberFilters() {
    try { setSavedSearches(saveSearch({query,category,city,period,min,max,sort,rooms,area,brand,gearbox,from,until,noDeposit},[query,category&&categoryName(category),city,period&&periodName(period)].filter(Boolean).join(" · ")||"Bütün elanlar")); }
    catch { setNotice("Axtarışı bu brauzerdə saxlamaq mümkün olmadı."); }
  }
  function restoreFilters(item:SavedSearch) {
    const v=item.values;setQuery(v.query);changeCategory(v.category);setCity(v.city);setPeriod(v.period);setMin(v.min);setMax(v.max);setSort(v.sort);setRooms(v.rooms);setArea(v.area);setBrand(v.brand);setGearbox(v.gearbox);setFrom(v.from);setUntil(v.until);setNoDeposit(v.noDeposit);setPage(1);setAdvanced(false);
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
      label: t(categoryName(category)),
      clear: () => changeCategory(""),
    },
    ownerFilter && {label:"Elan sahibinin təklifləri",clear:()=>setOwnerFilter("")},
    query && { label: `Axtarış: ${query}`, clear: () => setQuery("") },
    city && { label: city, clear: () => setCity("") },
    period && {
      label: period === "daily" ? "Günlük kirayə" : period === "weekly" ? "Həftəlik kirayə" : "Aylıq kirayə",
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
    noDeposit && { label: t("Depozitsiz"), clear: () => setNoDeposit(false) },
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
            <h1>
              {t("Almağa tələsmə.")}{" "}
              <em>{t("Kirayələ.")}</em>
            </h1>
            <span>
              {t("Ev, nəqliyyat, avadanlıq — ehtiyacına uyğun olanı tap, sahibi ilə birbaşa danış.")}</span>
          </div>
        </section>
        <div className="searchWrap" id="kiraye-axtaris">
          <form
            className="searchPanel"
            onSubmit={(e) => {
              e.preventDefault();
              // Release the mobile keyboard before scrolling to results.
              if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
              const intent = rentalSearchIntent(query);
              if (intent.categories.length && !intent.categories.includes(category)) {
                changeCategory(intent.categories.length === 1 ? intent.categories[0] : "");
              }
              setSearchHistory(rememberSearch(query));
              requestAnimationFrame(() => document
                .getElementById("elanlar")
                ?.scrollIntoView({ behavior: "smooth" }));
            }}
          >
            <label className="queryField">
              <span>{t("Nə axtarırsan?")}</span>
              <input
                type="search"
                enterKeyHint="search"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                aria-label={t("Elan axtar")}
                placeholder={t("Axtarış")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <button className="add" aria-label={t("Elanları axtar →")}><span className="desktopSearchLabel">{t("Elanları axtar →")}</span><span className="mobileSearchLabel"><NavigationIcon name="search"/></span></button>
          </form>
          {!!savedSearches.length && <details className="savedSearches"><summary>{t("Saxlanmış axtarışlar")} ({savedSearches.length})</summary><div>{savedSearches.map(item=><div key={item.id}><button type="button" className="textButton" onClick={()=>restoreFilters(item)}>{item.label}</button><button type="button" className="textButton" aria-label={`${item.label} axtarışını sil`} onClick={()=>setSavedSearches(removeSavedSearch(item.id))}>×</button></div>)}</div></details>}
          {!!searchHistory.length && <details className="searchHistory">
            <summary>{t("Son axtarışların")}</summary>
            <div className="searchHistoryItems">
              {searchHistory.map(value => <button key={value} type="button" className="secondary" onClick={() => { setQuery(value); setPage(1); setSearchHistory(rememberSearch(value)); }}>{value}</button>)}
              <button type="button" className="textButton" onClick={() => { clearSearchHistory(); setSearchHistory([]); }}>{t("Tarixçəni təmizlə")}</button>
            </div>
          </details>}
        </div>
        <section className="wrap categorySection">
          <div className="sectionTitle">
            <div>
              <h2><span className="desktopCategoryTitle">{t("Nə kirayələmək istəyirsən?")}</span><span className="mobileCategoryTitle">{t("Kateqoriyalar")}</span></h2>
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
                ? t("Kateqoriyaları bağla ×")
                : t("Bütün kateqoriyalar →")}
            </button>
          </div>
          {allCategories && (
            <div
              className="allCategories"
              id="all-categories"
              aria-label={t("Bütün kateqoriyalar")}
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
                {t("Bütün elanlara bax")}</button>
              {categories.map((item) => (
                <button
                  type="button"
                  className="secondary"
                  key={item.id}
                  onClick={() => {
                    changeCategory(item.id);
                    setAllCategories(false);
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
          <div className={`categoryScroller${moreCategories ? " hasMoreCategories" : ""}`}>
          <div className="categories" onScroll={event => {
            const rail = event.currentTarget;
            setMoreCategories(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 2);
          }}>
            {categories.map((c) => (
              <button
                key={c.id}
                aria-label={`${t(c.name)} elanlarına bax`}
                className={category === c.id ? "active" : ""}
                aria-pressed={category === c.id}
                onClick={() => {
                  changeCategory(c.id === category ? "" : c.id);
                  document
                    .getElementById("kiraye-axtaris")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span className="categoryArtwork">
                  <CategoryVisual id={c.id} />
                </span>
                <strong>{t(c.name)}</strong>
              </button>
            ))}
          </div>
          </div>
        </section>
        {!ownerFilter&&<ListingSuggestions premiumOnly/>}
        <section className="wrap listingSection" id="elanlar">
          <div className="sectionTitle">
            <div>
              <h2>
                {onlyFavorites
                  ? t("Seçilmiş elanlar")
                  : category
                    ? t(categoryName(category))
                    : t(ownerFilter ? "İstifadəçinin elanları" : "Kirayə elanları")}
              </h2>
              <p className="muted" role="status" aria-live="polite">
                {loading
                  ? t("Elanlar yüklənir...")
                  : `${demo ? filtered.length : total} ${demo ? t("nümunə") + " " : ""}${t("elan tapıldı")}`}
              </p>
            </div>
            <select
              aria-label={t("Sıralama")}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="new">{t("Əvvəlcə yenilər")}</option>
              <option value="low">{t("Əvvəlcə ucuz")}</option>
              <option value="high">{t("Əvvəlcə bahalı")}</option>
            </select>
          </div>
          <div className="filterRow" aria-label="Kirayə filtrləri">
            <button
              className={`pill ${noDeposit ? "active" : ""}`}
              aria-pressed={noDeposit}
              onClick={() => setNoDeposit(!noDeposit)}
            >
              {t("Depozitsiz kirayə")}</button>
            <button
              className={`pill favoritesFilter ${onlyFavorites ? "active" : ""}`}
              aria-pressed={onlyFavorites}
              onClick={() => setOnlyFavorites(!onlyFavorites)}
            >
              ♡ {t("Seçilmişlər")} ({favorites.length})
            </button>
            <button
              className="filterToggleButton"
              aria-expanded={advanced}
              onClick={() => setAdvanced(!advanced)}
            >
              {t("Ətraflı filtrlər")}</button>
            {activeFilters.length > 0 && <button className="textButton" onClick={reset}>
              {t("Filtrləri təmizlə")}</button>}
          </div>
          {period && <p className="rentalSearchHint">
            {period === "daily"
              ? "Qiymətlər bir günlük kirayə üçündür."
              : period === "weekly" ? "Qiymətlər bir həftəlik kirayə üçündür." : period === "monthly"
                ? "Qiymətlər bir aylıq kirayə üçündür."
                : t("Günlük və aylıq qiymətləri ayrıca müqayisə etmək üçün kirayə müddətini seç.")}
          </p>}
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
            <CatalogFilters onClose={closeFilters} title={t("Ətraflı filtrlər")} done={t("Elanları göstər")}><div className="advancedFilters">
              <label>
                {t("Kateqoriya")}<select
                  aria-label="Filtr kateqoriyası"
                  value={category}
                  onChange={(e) => changeCategory(e.target.value)}
                >
                  <option value="">{t("Bütün kateqoriyalar")}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {t(c.name)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("Şəhər")}<select aria-label={t("Şəhər")} value={city} onChange={(e) => setCity(e.target.value)}>
                  <option value="">{t("Bütün şəhərlər")}</option>
                  {cities.map((name) => <option key={name}>{name}</option>)}
                </select>
              </label>
              <label>
                {t("Kirayə müddəti")}<select aria-label={t("Kirayə müddəti")} value={period} onChange={(e) => { setPeriod(e.target.value); setMin(""); setMax(""); }}>
                  <option value="">{t("İstənilən müddət")}</option>
                  <option value="daily">{t("Günlük")}</option>
                  <option value="weekly">{t("Həftəlik")}</option>
                  <option value="monthly">{t("Aylıq")}</option>
                </select>
              </label>
              {period && (
                <>
                  <label>
                    {t("Minimum qiymət")} (₼ / {t(periodName(period))})
                    <input
                      aria-label={t("Minimum qiymət")}
                      type="number"
                      min="0"
                      value={min}
                      onChange={(event) => setMin(event.target.value)}
                    />
                  </label>
                  <label>
                    {t("Maksimum qiymət")} (₼ / {t(periodName(period))})
                    <input
                      aria-label={t("Maksimum qiymət")}
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
                  {t("Otaq sayı")}<select
                    aria-label={t("Otaq sayı")}
                    value={rooms}
                    onChange={(e) => setRooms(e.target.value)}
                  >
                    <option value="">{t("İstənilən")}</option>
                    <option value="1">{t("1 otaq")}</option>
                    <option value="2">{t("2 otaq")}</option>
                    <option value="3">{t("3 otaq")}</option>
                    <option value="4+">{t("4 və daha çox")}</option>
                  </select>
                </label>
              )}
              {isProperty(category) && (
                <label>
                  {t("Minimum sahə (m²)")}<input
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
                    <option value="">{t("İstənilən")}</option>
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
                  {t("Sürətlər qutusu")}<select
                    aria-label={t("Sürətlər qutusu")}
                    value={gearbox}
                    onChange={(e) => setGearbox(e.target.value)}
                  >
                    <option value="">{t("İstənilən")}</option>
                    <option value="Avtomat">{t("Avtomat")}</option>
                    <option value="Mexaniki">{t("Mexaniki")}</option>
                  </select>
                </label>
              )}
              <AzerbaijaniDateInput label={t("Başlanğıc tarixi")} value={from} onChange={setFrom} />
              <AzerbaijaniDateInput label={t("Son tarix")} value={until} min={from || undefined} onChange={setUntil} />
              <label className="checkLabel">
                <input
                  type="checkbox"
                  checked={noDeposit}
                  onChange={(e) => setNoDeposit(e.target.checked)}
                />{" "}
                {t("Depozitsiz")}</label>
              <button type="button" className="secondary" onClick={rememberFilters}>{t("Axtarışı saxla")}</button>
              <p className="homeHelp">
                {t("Tarix filtri elan sahibinin göstərdiyi aralığa əsaslanır. Mövcudluğu əlaqə saxlayaraq dəqiqləşdir.")}</p>
            </div></CatalogFilters>
          )}
          {notice && (
            <p className="notice" role="status">
              {notice}
              {!demo && (
                <button
                  className="textButton"
                  onClick={() => setRetry(retry + 1)}
                >
                  {t("Yenidən yoxla")}</button>
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
                />
              ))}
            </div>
          )}
          {!loading && !filtered.length && (
            <div className="empty">
              <span>⌕</span>
              <h3>{t("Uyğun elan tapılmadı")}</h3>
              <p>{t("Başqa sözlə axtar və ya öz kirayə elanını yerləşdir.")}</p>
              <Link className="add" href="/new">
                {t("+ Elan yerləşdir")}</Link>
              <button className="add" onClick={reset}>
                {t("Bütün elanlara bax")}</button>
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
                {t("← Əvvəlki")}</button>
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
                {t("Növbəti →")}</button>
            </nav>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
