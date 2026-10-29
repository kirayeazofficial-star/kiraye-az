"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";

const tiles = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
const pinHtml = '<svg width="34" height="44" viewBox="0 0 34 44" aria-hidden="true"><path d="M17 43s15-14.6 15-26A15 15 0 0 0 2 17c0 11.4 15 26 15 26z" fill="#ff5a1f" stroke="#fff" stroke-width="2.5"/><circle cx="17" cy="17" r="5.5" fill="#fff"/></svg>';

// Map of a listing (read-only) or a picker (editable): tap/click puts the pin, the pin can be dragged.
// Leaflet is loaded only in the browser. Approximate locations show a soft circle instead of a pin.
export default function LocationMap({ lat, lng, exact = true, editable = false, centre, zoom = 15, onPick, className = "" }: {
  lat: number | null; lng: number | null; exact?: boolean; editable?: boolean; centre?: [number, number]; zoom?: number;
  onPick?: (point: [number, number]) => void; className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const placeRef = useRef<((point: [number, number]) => void) | null>(null);
  const pick = useRef(onPick);
  pick.current = onPick;
  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then(L => {
      if (cancelled || !box.current || map.current) return;
      const touch = window.matchMedia("(pointer: coarse)").matches;
      const start: [number, number] = lat !== null && lng !== null ? [lat, lng] : centre ?? [40.4093, 49.8671];
      const instance = L.map(box.current, { center: start, zoom: lat !== null ? (exact || editable ? zoom : 14) : 12, scrollWheelZoom: false, dragging: editable || !touch, attributionControl: true, zoomControl: true });
      L.tileLayer(tiles, { attribution, subdomains: "abcd", maxZoom: 19 }).addTo(instance);
      const icon = L.divIcon({ html: pinHtml, className: "kzMapPin", iconSize: [34, 44], iconAnchor: [17, 43] });
      const place = (point: [number, number]) => {
        if (marker.current) marker.current.setLatLng(point);
        else {
          marker.current = L.marker(point, { icon, draggable: editable, keyboard: false }).addTo(instance);
          marker.current.on("dragend", () => { const p = marker.current!.getLatLng(); pick.current?.([p.lat, p.lng]); });
        }
      };
      placeRef.current = place;
      if (lat !== null && lng !== null) {
        if (exact || editable) place([lat, lng]);
        else L.circle([lat, lng], { radius: 650, color: "#ff5a1f", weight: 1.5, fillColor: "#ff5a1f", fillOpacity: 0.15 }).addTo(instance);
      }
      if (editable) instance.on("click", event => { const point: [number, number] = [event.latlng.lat, event.latlng.lng]; place(point); pick.current?.(point); });
      map.current = instance;
    });
    return () => { cancelled = true; map.current?.remove(); map.current = null; marker.current = null; placeRef.current = null; };
    // The map is created once; later prop changes are applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Picker: follow outside changes (city changed, pin cleared).
  useEffect(() => {
    const instance = map.current;
    if (!instance || !editable) return;
    if (lat === null || lng === null) { marker.current?.remove(); marker.current = null; if (centre) instance.setView(centre, 12); return; }
    const current = marker.current?.getLatLng();
    if (!current || Math.abs(current.lat - lat) > 1e-7 || Math.abs(current.lng - lng) > 1e-7) { placeRef.current?.([lat, lng]); instance.setView([lat, lng], Math.max(instance.getZoom(), 15)); }
  }, [lat, lng, centre, editable]);
  return <div ref={box} className={`kzMap ${className}`} role="region" aria-label={editable ? "Xəritədə yeri seçin" : "Xəritədə yerləşmə"} />;
}
