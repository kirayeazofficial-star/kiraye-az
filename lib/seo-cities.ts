// City and district pages for search: /kiraye-ev/baki, /kiraye/quba, /kiraye-ev/baki/nesimi ...
import { cities } from "./marketplace";
import { bakuDistricts } from "./location";

const letters: Record<string, string> = { ə: "e", ı: "i", ö: "o", ü: "u", ğ: "g", ş: "s", ç: "c", İ: "i", I: "i", Ə: "e", Ö: "o", Ü: "u", Ğ: "g", Ş: "s", Ç: "c" };
export const placeSlug = (name: string) => name.split("").map(ch => letters[ch] ?? ch).join("").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// Azerbaijani locative ending by the last vowel: Qubada, Şəkidə, Naxçıvanda.
const locative = (word: string) => { const vowel = [...word.toLowerCase()].reverse().find(ch => "aıoueəiöü".includes(ch)) || "a"; return word + ("aıou".includes(vowel) ? "da" : "də"); };

type Place = { name: string; in: string };
// Every city of the listing form (Azerbaijan), with the old short slugs kept for links already indexed.
const named: Record<string, string> = { "Bakı": "baki", "Sumqayıt": "sumqayit", "Gəncə": "gence", "Xırdalan": "xirdalan", "Lənkəran": "lenkeran", "Şəki": "seki", "Qəbələ": "qebele", "Quba": "quba", "Mingəçevir": "mingecevir", "Naxçıvan": "naxcivan" };
export const seoCities: Record<string, Place> = Object.fromEntries(cities.filter(name => name !== "Digər").map(name => [named[name] ?? placeSlug(name), { name, in: locative(name) }]));
export type SeoCitySlug = string;
// Districts of Baku (Abşeron is its own city above).
export const seoDistricts: Record<string, Place & { label: string }> = Object.fromEntries(bakuDistricts.filter(name => name !== "Abşeron").map(name => [placeSlug(name), { name, label: `${name} rayonu`, in: `${name} rayonunda` }]));
// Cities shown first in lists (largest first); the rest follow alphabetically.
export const mainCities = ["baki", "sumqayit", "gence", "xirdalan", "lenkeran", "seki", "qebele", "quba", "mingecevir", "naxcivan"];
// Azerbaijani alphabetical order, the same on the server and in every browser
// (localeCompare depends on the device's language data and can differ).
const alphabet = "abcçdeəfgğhxıijkqlmnoöprsştuüvyz";
const rank = (ch: string) => { const i = alphabet.indexOf(ch.toLocaleLowerCase("az")); return i < 0 ? 100 + ch.charCodeAt(0) : i; };
const azCompare = (a: string, b: string) => { for (let i = 0; i < Math.min(a.length, b.length); i++) { const d = rank(a[i]) - rank(b[i]); if (d) return d; } return a.length - b.length; };
// All city slugs: the main ones first, then the rest in alphabetical order.
export const otherCities = Object.keys(seoCities).filter(slug => !mainCities.includes(slug)).sort((a, b) => azCompare(seoCities[a].name, seoCities[b].name));
export const allCities = [...mainCities, ...otherCities];
