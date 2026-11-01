"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { MapPinOff } from "lucide-react";
import type { Map as LeafletMap } from "leaflet";
import { money, periodName, type Listing } from "../../lib/marketplace";

const tiles = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const esc = (value: string) => value.replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

// Listings on a map: a price tag for every listing that has a location; tapping it opens a small card.
export default function ListingsMap({ items }: { items: Listing[] }) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const points = items.filter(item => typeof item.lat === "number" && typeof item.lng === "number");
  useEffect(() => {
    let cancelled = false;
    if (!points.length) return;
    void import("leaflet").then(L => {
      if (cancelled || !box.current) return;
      map.current?.remove();
      const instance = L.map(box.current, { center: [40.4093, 49.8671], zoom: 11, scrollWheelZoom: false });
      L.tileLayer(tiles, { attribution, maxZoom: 19 }).addTo(instance);
      const bounds: [number, number][] = [];
      for (const item of points) {
        const at: [number, number] = [item.lat!, item.lng!];
        bounds.push(at);
        const icon = L.divIcon({ className: "kzPriceTag", html: `<span>${esc(money(item.price))} ₼</span>`, iconSize: undefined });
        L.marker(at, { icon }).addTo(instance).bindPopup(`<a class="kzMapCard" href="/listings/${item.id}">${item.images?.[0] ? `<img src="${esc(item.images[0])}" alt="">` : ""}<strong>${esc(money(item.price))} ₼ / ${esc(periodName(item.rental_period))}</strong><span>${esc(item.title)}</span><small>${esc(item.city)}${item.district ? `, ${esc(item.district)}` : ""}</small></a>`, { closeButton: false, maxWidth: 240 });
      }
      if (bounds.length > 1) instance.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      else if (bounds.length === 1) instance.setView(bounds[0], 14);
      map.current = instance;
    });
    return () => { cancelled = true; map.current?.remove(); map.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.map(item => item.id).join(",")]);
  if (!points.length) return <div className="kzMapEmpty"><MapPinOff aria-hidden="true" size={22} strokeWidth={1.9} /><div><strong>Xəritədə göstəriləcək elan yoxdur</strong><small>Bu elanların heç birində yer qeyd olunmayıb. Siyahıya qayıdın.</small></div></div>;
  return <div className="kzListingsMap">
    <div ref={box} className="kzMap kzMapBig" role="region" aria-label="Elanlar xəritədə" />
    <p className="kzMuted">{points.length ? `Xəritədə ${points.length} elan göstərilir. Yerini qeyd etməyən elanlar siyahıdadır.` : "Bu elanların heç birində yer qeyd olunmayıb."}</p>
  </div>;
}
