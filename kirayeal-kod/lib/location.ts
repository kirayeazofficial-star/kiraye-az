// Map location helpers: Baku districts and metro stations for the listing form, the visible
// (possibly approximate) point for visitors, and validation of coordinates inside Azerbaijan.
export const bakuDistricts = ["Abşeron", "Binəqədi", "Xətai", "Xəzər", "Qaradağ", "Nərimanov", "Nəsimi", "Nizami", "Pirallahı", "Sabunçu", "Səbail", "Suraxanı", "Yasamal"];
export const bakuMetro = ["İçərişəhər", "Sahil", "28 May", "Gənclik", "Nəriman Nərimanov", "Bakmil", "Ulduz", "Koroğlu", "Qara Qarayev", "Neftçilər", "Xalqlar Dostluğu", "Əhmədli", "Həzi Aslanov", "Nizami", "Elmlər Akademiyası", "İnşaatçılar", "20 Yanvar", "Memar Əcəmi", "Nəsimi", "Azadlıq prospekti", "Dərnəgül", "Cəfər Cabbarlı", "Şah İsmayıl Xətai", "Avtovağzal", "8 Noyabr"];
export const locationCategories = ["property", "villa", "commercial"];

// City centres to open the map picker at.
export const cityCentres: Record<string, [number, number]> = {
  "Bakı": [40.4093, 49.8671], "Sumqayıt": [40.5897, 49.6686], "Gəncə": [40.6828, 46.3606], "Xırdalan": [40.4481, 49.7553],
  "Lənkəran": [38.7543, 48.8508], "Şəki": [41.1975, 47.1706], "Qəbələ": [40.9982, 47.8700], "Quba": [41.3611, 48.5131],
  "Mingəçevir": [40.7640, 47.0595], "Naxçıvan": [39.2090, 45.4120], "Şamaxı": [40.6314, 48.6414], "Qusar": [41.4275, 48.4300],
};
export const azerbaijanCentre: [number, number] = [40.3, 47.8];

export function validPoint(lat: unknown, lng: unknown): [number, number] | null {
  const a = Number(lat), b = Number(lng);
  return Number.isFinite(a) && Number.isFinite(b) && a >= 38.3 && a <= 41.95 && b >= 44.7 && b <= 50.7 ? [a, b] : null;
}

// What visitors receive: the exact point only if the owner allowed it, otherwise a point rounded
// to about a kilometre, so the house itself cannot be found from the page source.
export function publicPoint(row: { lat?: number | null; lng?: number | null; location_exact?: boolean | null }) {
  const point = validPoint(row.lat, row.lng);
  if (!point) return { lat: null, lng: null, location_exact: false };
  if (row.location_exact) return { lat: point[0], lng: point[1], location_exact: true };
  return { lat: Math.round(point[0] * 100) / 100, lng: Math.round(point[1] * 100) / 100, location_exact: false };
}
