"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, ChevronRight } from "lucide-react";
type Item = { slug: string; name: string; logo_url: string | null; address: string; featured: boolean; listings: number };
// Home: active stores in a scrollable row (Premium first). Hidden while there are none.
export default function StoresStrip() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => { fetch("/api/stores").then(r => r.json()).then(data => setItems(data.items || [])).catch(() => {}); }, []);
  if (!items.length) return null;
  return <section className="kzStores" aria-label="Mağazalar">
    <div className="kzSectionHead"><h2>Mağazalar</h2><Link className="kzMoreLink" href="/profile?section=store">Mağaza aç<ChevronRight aria-hidden="true" size={16} strokeWidth={2.25} /></Link></div>
    <div className="kzStoresRow">{items.map(item => <Link key={item.slug} href={`/magaza/${item.slug}`} className={`kzStoreTile${item.featured ? " featured" : ""}`}>
      <span className="kzStoreTileLogo">{item.logo_url ? <img src={item.logo_url} alt="" loading="lazy" /> : <b>{item.name.charAt(0).toUpperCase()}</b>}</span>
      <strong>{item.name}</strong>
      <small><BadgeCheck aria-hidden="true" size={13} strokeWidth={2.4} />{item.listings} elan</small>
    </Link>)}</div>
  </section>;
}
