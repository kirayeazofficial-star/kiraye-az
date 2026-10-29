"use client";
import { Crosshair, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { azerbaijanCentre, bakuDistricts, bakuMetro, cityCentres } from "../../lib/location";

const LocationMap = dynamic(() => import("./LocationMap"), { ssr: false, loading: () => <div className="kzMap kzMapLoading" /> });

// "Yerləşmə" block of the listing form for homes, villas and premises: district and metro (Baku),
// plus an optional pin on the map. Without "Dəqiq ünvanı göstər" visitors only see the area.
export default function LocationPicker({ city, district, metro, point, exact, onDistrict, onMetro, onPoint, onExact }: {
  city: string; district: string; metro: string; point: [number, number] | null; exact: boolean;
  onDistrict: (value: string) => void; onMetro: (value: string) => void; onPoint: (point: [number, number] | null) => void; onExact: (value: boolean) => void;
}) {
  const [locating, setLocating] = useState(false);
  const centre = cityCentres[city] ?? azerbaijanCentre;
  const baku = city === "Bakı";
  function locate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(position => { setLocating(false); onPoint([position.coords.latitude, position.coords.longitude]); }, () => setLocating(false), { enableHighAccuracy: true, timeout: 10000 });
  }
  return <div className="kzLocationPicker">
    <h3 className="formSubheading">Yerləşmə <small>(istəyə bağlı)</small></h3>
    {baku && <div className="formGrid">
      <label>Rayon
        <select name="district" value={district} onChange={event => onDistrict(event.target.value)}>
          <option value="">Seçin</option>
          {bakuDistricts.map(name => <option key={name}>{name}</option>)}
        </select>
      </label>
      <label>Metro
        <select name="metro" value={metro} onChange={event => onMetro(event.target.value)}>
          <option value="">Seçin</option>
          {bakuMetro.map(name => <option key={name}>{name}</option>)}
        </select>
      </label>
    </div>}
    <p className="kzLocationHint">{point ? "Nöqtəni sürüşdürüb dəqiqləşdirə bilərsiniz." : "Xəritəyə toxunub yeri göstərin."}</p>
    <LocationMap key={`${city}`} lat={point?.[0] ?? null} lng={point?.[1] ?? null} editable centre={centre} onPick={onPoint} className="kzMapPicker" />
    <div className="kzLocationTools">
      <button type="button" className="kzButtonGhost" onClick={locate} disabled={locating}><Crosshair aria-hidden="true" size={16} strokeWidth={2} />{locating ? "Axtarılır…" : "Mənim yerim"}</button>
      {point && <button type="button" className="kzButtonGhost" onClick={() => onPoint(null)}><Trash2 aria-hidden="true" size={16} strokeWidth={2} />Nöqtəni sil</button>}
    </div>
    {point && <label className="kzCheck"><input type="checkbox" checked={exact} onChange={event => onExact(event.target.checked)} /><span>Dəqiq ünvanı göstər <small>— seçilməsə, ziyarətçilər yalnız təxmini ərazini (≈1 km) görəcək</small></span></label>}
  </div>;
}
