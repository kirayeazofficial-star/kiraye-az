"use client";
import { ChevronLeft, ChevronRight, LayoutGrid, Plus, SlidersHorizontal, X } from "lucide-react";
import { matchesSearch, rentalSearchIntent } from "../../lib/search-query";
import { readSavedSearches, saveSearch, removeSavedSearch, type SavedSearch } from "../../lib/saved-searches";
import CatalogFilters from "./CatalogFilters";
import SortMenu from "./SortMenu";
import { useCallback } from "react";
import AzerbaijaniDateInput from "./AzerbaijaniDateInput";
import { useLanguage } from "./LanguageProvider";
import { rentalCategorySpecs } from "../../lib/rental-category-specs";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { searchCatalog, PAGE_SIZE } from "../../lib/catalog";
import { matchesRentalFilters, isProperty } from "../../lib/rental-details";
import {
  carModels,
  motorcycleModels,
  bicycleModels,
  equipmentModels,
} from "../../lib/listing-form-options";
import CategoryVisual from "./CategoryVisual";
import ListingSuggestions from "./ListingSuggestions";
import BannerStrip from "./BannerStrip";
import SideBanners from "./SideBanners";
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
  useEffect(() => {
    const search = (event: Event) => {
      const value = String((event as CustomEvent<string>).detail || "").slice(0, 120);
      const intent = rentalSearchIntent(value);
      if (intent.categories.length === 1) changeCategory(intent.categories[0]);
      setQuery(value);
      setOnlyFavorites(false);
      requestAnimationFrame(() => document.getElementById("elanlar")?.scrollIntoView({ behavior: "smooth" }));
    };
    const refresh = () => { setFavorites(readFavorites()); setRetry(value => value + 1); };
    window.addEventListener("kiraye:search", search);
    window.addEventListener("kiraye:refresh", refresh);
    return () => { window.removeEventListener("kiraye:search", search); window.removeEventListener("kiraye:refresh", refresh); };
  }, []);
  const closeFilters = useCallback(() => setAdvanced(false), []);
  const favoriteIds = onlyFavorites ? favorites.join(",") : "";
  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      searchCatalog({
        // The Premium block above already shows premium listings: keep them out of the plain list.
        notPremium: !ownerFilter && !onlyFavorites && !category && !query,
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
              "Məlumatları yükləmək mümkün olmadı. Yenidən cəhd edin.",
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
  ].filter(
    (filter): filter is { label: string; clear: () => void } => !!filter,
  );
  const browsing = !ownerFilter && !onlyFavorites && !category && !query;
  return (
    <>
      <Header />
      <main className={`kzMain kzHome${onlyFavorites ? " favoritesView" : ""}`}>
        <h1 className="srOnly">Kirayə elanları — ev, maşın, avadanlıq kirayəsi Azərbaycanda</h1>
        <section className="kzCategories" aria-label={t("Kateqoriyalar")}>
          <button type="button" className="kzCategoryCatalog" onClick={() => window.dispatchEvent(new Event("kiraye:catalog"))}>
            <span className="kzCatalogTile" aria-hidden="true"><LayoutGrid size={40} strokeWidth={1.75} /></span>
            <span>{t("Kataloq")}</span>
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={category === c.id ? "active" : ""}
              aria-pressed={category === c.id}
              onClick={() => {
                changeCategory(c.id === category ? "" : c.id);
                document.getElementById("elanlar")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <CategoryVisual id={c.id} />
              <span>{t(c.name)}</span>
            </button>
          ))}
        </section>
        {browsing && <BannerStrip placement="home" />}
        <SideBanners />
        {browsing && <ListingSuggestions premiumOnly/>}
        <section className="kzSection" id="elanlar">
          <div className="kzSectionHead">
            <div>
              <h2>
                {onlyFavorites
                  ? t("Seçilmiş elanlar")
                  : category
                    ? t(categoryName(category))
                    : t(ownerFilter ? "İstifadəçinin elanları" : browsing ? "Son elanlar" : "Kirayə elanları")}
              </h2>
              <p className="kzMuted" role="status" aria-live="polite">
                {loading
                  ? t("Elanlar yüklənir...")
                  : `${demo ? filtered.length : total} ${demo ? t("nümunə") + " " : ""}${t("elan tapıldı")}`}
              </p>
            </div>
            <SortMenu
              label={t("Sıralama")}
              value={sort}
              onChange={setSort}
              options={[{ value: "new", label: t("Əvvəlcə yenilər") }, { value: "low", label: t("Əvvəlcə ucuz") }, { value: "high", label: t("Əvvəlcə bahalı") }]}
            />
          </div>
          <div className="kzToolbar" aria-label="Kirayə filtrləri">
            <button
              type="button"
              className="kzChip kzChipStrong"
              aria-expanded={advanced}
              onClick={() => setAdvanced(!advanced)}
            >
              <SlidersHorizontal aria-hidden="true" size={16} strokeWidth={2} />
              {t("Filtrlər")}{activeFilters.length > 0 && <b>{activeFilters.length}</b>}
            </button>
            {(["daily", "weekly", "monthly"] as const).map(value => <button
              key={value}
              type="button"
              className={`kzChip${period === value ? " active" : ""}`}
              aria-pressed={period === value}
              onClick={() => { setPeriod(period === value ? "" : value); setMin(""); setMax(""); }}
            >
              {t(value === "daily" ? "Günlük" : value === "weekly" ? "Həftəlik" : "Aylıq")}
            </button>)}
            <button
              type="button"
              className={`kzChip${noDeposit ? " active" : ""}`}
              aria-pressed={noDeposit}
              onClick={() => setNoDeposit(!noDeposit)}
            >
              {t("Depozitsiz")}
            </button>
            {savedSearches.map(item=><span className="kzChip kzSaved" key={item.id}><button type="button" onClick={()=>restoreFilters(item)}>{item.label}</button><button type="button" aria-label={`${item.label} axtarışını sil`} onClick={()=>setSavedSearches(removeSavedSearch(item.id))}><X aria-hidden="true" size={13} strokeWidth={2.25} /></button></span>)}
          </div>
          {activeFilters.length > 0 && (
            <div className="kzActiveFilters" aria-label="Seçilmiş filtrlər">
              {activeFilters.map((filter) => (
                <button
                  type="button"
                  key={filter.label}
                  onClick={filter.clear}
                  aria-label={`${filter.label} filtrini sil`}
                >
                  {filter.label}
                  <X aria-hidden="true" size={14} strokeWidth={2.25} />
                </button>
              ))}
              <button type="button" className="kzLinkButton" onClick={reset}>{t("Filtrləri təmizlə")}</button>
            </div>
          )}
          {period && <p className="kzHint">
            {period === "daily"
              ? "Qiymətlər bir günlük kirayə üçündür."
              : period === "weekly" ? "Qiymətlər bir həftəlik kirayə üçündür." : "Qiymətlər bir aylıq kirayə üçündür."}
          </p>}
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
            <p className="kzNotice" role="status">
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
            <div className="kzGrid">
              {Array.from({ length: 12 }, (_, i) => i).map((i) => (
                <div className="kzSkeleton" key={i} />
              ))}
            </div>
          ) : (
            <div className="kzGrid">
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
            onlyFavorites && !query ? <div className="kzEmpty">
              <h3>{t("Seçilmiş elan yoxdur")}</h3>
              <p>{t("Bəyəndiyin elanın şəklindəki ürək işarəsinə toxun — elan burada saxlanacaq.")}</p>
              <a className="kzButton" href="/">{t("Elanlara bax")}</a>
            </div> :
            <div className="kzEmpty">
              <h3>{t("Uyğun elan tapılmadı")}</h3>
              <p>{t("Başqa sözlə axtar və ya öz kirayə elanını yerləşdir.")}</p>
              <Link className="kzButton" href="/new">
                <Plus className="kzI kzIL" aria-hidden="true" size={16} strokeWidth={2.25} />{t("Elan yerləşdir")}</Link>
              <button className="kzButtonGhost" onClick={reset}>
                {t("Bütün elanlara bax")}</button>
            </div>
          )}
          {!demo && total > PAGE_SIZE && (
            <nav className="kzPagination" aria-label="Elan səhifələri">
              <button
                disabled={page === 1 || loading}
                onClick={() => {
                  setPage(page - 1);
                  document.getElementById("elanlar")?.scrollIntoView();
                }}
              >
                <ChevronLeft className="kzI kzIL" aria-hidden="true" size={16} strokeWidth={2.25} />{t("Əvvəlki")}</button>
              <span>
                {page} / {Math.ceil(total / PAGE_SIZE)}
              </span>
              <button
                disabled={page * PAGE_SIZE >= total || loading}
                onClick={() => {
                  setPage(page + 1);
                  document.getElementById("elanlar")?.scrollIntoView();
                }}
              >
                {t("Növbəti")}<ChevronRight className="kzI kzIR" aria-hidden="true" size={16} strokeWidth={2.25} /></button>
            </nav>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
