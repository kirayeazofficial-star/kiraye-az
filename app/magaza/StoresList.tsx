"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Store } from "lucide-react";
import { paidVisible, useSiteFlags } from "../../lib/use-site-flags";
type Item = { slug: string; name: string; logo_url: string | null; address: string; featured: boolean; listings: number };
// All active stores. When there are none, a clear note instead of an empty page.
export default function StoresList() {
  const [items, setItems] = useState<Item[] | null>(null);
  const flags = useSiteFlags();
  useEffect(() => { fetch("/api/stores", { cache: "no-store" }).then(r => r.json()).then(data => setItems(data.items || [])).catch(() => setItems([])); }, []);
  if (!items) return <p className="kzStoresNote" role="status">Yüklənir…</p>;
  if (!items.length) return <div className="kzStoresEmpty">
    <span aria-hidden="true"><Store size={28} strokeWidth={1.8} /></span>
    <strong>Hələ aktiv mağaza yoxdur</strong>
    {flags && !paidVisible(flags)
      ? <p>Mağaza müraciətləri müvəqqəti qəbul olunmur. Ödəniş sistemi qoşulduqdan sonra bu bölmədən öz mağazanızı aça biləcəksiniz.</p>
      : <><p>Mağazalar bölməsi tezliklə dolacaq. Çox elan verirsinizsə, öz mağazanızı aça bilərsiniz.</p>
        <Link className="kzButton" href="/profile?section=store">Mağaza aç</Link></>}
  </div>;
  return <div className="kzStoresGrid">{items.map(item => <Link key={item.slug} href={`/magaza/${item.slug}`} className={`kzStoreTile${item.featured ? " featured" : ""}`}>
    <span className="kzStoreTileLogo">{item.logo_url ? <img src={item.logo_url} alt="" loading="lazy" /> : <b>{item.name.charAt(0).toUpperCase()}</b>}</span>
    <strong>{item.name}</strong>
    <small><BadgeCheck aria-hidden="true" size={13} strokeWidth={2.4} />{item.listings} elan</small>
  </Link>)}</div>;
}
