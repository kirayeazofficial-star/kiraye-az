"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { categoryName, type Listing } from "../../lib/marketplace";
import FavoriteGrid from "./FavoriteGrid";
import SortMenu from "./SortMenu";

// A store's listings: categories with counts, price range, search inside the store and sorting.
export default function StoreListings({ name, items }: { name: string; items: Listing[] }) {
  const [query, setQuery] = useState(""), [category, setCategory] = useState(""), [min, setMin] = useState(""), [max, setMax] = useState(""), [sort, setSort] = useState("new");
  const categories = useMemo(() => Object.entries(items.reduce<Record<string, number>>((all, item) => ({ ...all, [item.category]: (all[item.category] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]), [items]);
  const shown = useMemo(() => {
    const words = query.trim().toLocaleLowerCase("az").split(/\s+/).filter(Boolean);
    const list = items.filter(item => (!category || item.category === category)
      && (!min || Number(item.price) >= Number(min)) && (!max || Number(item.price) <= Number(max))
      && words.every(word => `${item.title} ${item.description}`.toLocaleLowerCase("az").includes(word)));
    return sort === "low" ? [...list].sort((a, b) => Number(a.price) - Number(b.price)) : sort === "high" ? [...list].sort((a, b) => Number(b.price) - Number(a.price)) : list;
  }, [items, query, category, min, max, sort]);
  const reset = () => { setCategory(""); setMin(""); setMax(""); setQuery(""); };
  return <section className="kzStoreList">
    <h2 className="kzSellerTitle">{name} təklifləri ({items.length})</h2>
    <div className="kzStoreListGrid">
      <aside className="kzStoreSide">
        <div className="kzStoreCats" role="group" aria-label="Kateqoriyalar">
          <button type="button" className={!category ? "on" : ""} onClick={() => setCategory("")}>Bütün kateqoriyalar <small>{items.length}</small></button>
          {categories.map(([id, count]) => <button key={id} type="button" className={category === id ? "on" : ""} onClick={() => setCategory(id)}>{categoryName(id)} <small>{count}</small></button>)}
        </div>
        <div className="kzStorePrice">
          <div className="kzStorePriceHead"><strong>Qiymət, AZN</strong>{(category || min || max || query) && <button type="button" onClick={reset}>Sıfırla</button>}</div>
          <div><input type="number" inputMode="decimal" min="0" placeholder="min." value={min} onChange={event => setMin(event.target.value)} aria-label="Minimum qiymət" /><input type="number" inputMode="decimal" min="0" placeholder="maks." value={max} onChange={event => setMax(event.target.value)} aria-label="Maksimum qiymət" /></div>
        </div>
      </aside>
      <div className="kzStoreMain">
        <div className="kzStoreTools">
          <label className="kzStoreSearch"><Search aria-hidden="true" size={17} strokeWidth={2} /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Mağazada axtarış" aria-label="Mağazada axtarış" /></label>
          <SortMenu label="Sıralama" value={sort} onChange={setSort} options={[{ value: "new", label: "Tarixə görə" }, { value: "low", label: "Əvvəlcə ucuz" }, { value: "high", label: "Əvvəlcə bahalı" }]} />
        </div>
        {shown.length ? <FavoriteGrid items={shown} /> : <p className="kzNotice">Bu filtrlərə uyğun elan yoxdur.</p>}
      </div>
    </div>
  </section>;
}
