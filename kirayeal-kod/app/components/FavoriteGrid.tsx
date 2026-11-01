"use client";
import { useEffect, useState, type ReactNode } from "react";
import { readFavorites, type Listing } from "../../lib/marketplace";
import ListingCard from "./ListingCard";
// Listing cards with the same heart (favourites) button as the main catalogue, kept in sync with it.
export default function FavoriteGrid({ items, lead }: { items: Listing[]; lead?: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setFavorites(readFavorites());
    sync();
    window.addEventListener("kiraye:favorites", sync); window.addEventListener("storage", sync);
    return () => { window.removeEventListener("kiraye:favorites", sync); window.removeEventListener("storage", sync); };
  }, []);
  function toggle(id: string) {
    const next = favorites.includes(id) ? favorites.filter(x => x !== id) : [...favorites, id];
    setFavorites(next);
    try { localStorage.setItem("kiraye-favorites", JSON.stringify(next)); window.dispatchEvent(new Event("kiraye:favorites")); } catch { /* private mode: heart still toggles for this page */ }
  }
  return <div className="kzGrid">{lead}{items.map(item => <ListingCard key={item.id} item={item} favorite={favorites.includes(item.id)} onFavorite={item.demo ? undefined : () => toggle(item.id)} />)}</div>;
}
