
export const categories = [
  { id: "property", name: "Ev və mənzil", icon: "⌂" },
  { id: "car", name: "Avtomobil", icon: "▣" },
  { id: "motorcycle", name: "Motosiklet", icon: "◉" },
  { id: "villa", name: "Villa və bağ", icon: "♧" },
  { id: "commercial", name: "Kommersiya", icon: "▦" },
  { id: "equipment", name: "Alətlər və texnika", icon: "⚒" },
  { id: "clothing", name: "Geyim və aksesuar", icon: "👗" },
  { id: "electric", name: "Elektrik skuter və velosiped", icon: "🛴" },
  { id: "photo", name: "Foto və video", icon: "📷" },
  { id: "camping", name: "Turizm və düşərgə", icon: "⛺" },
  { id: "bicycle", name: "Velosiped", icon: "◎" },
  { id: "event", name: "Tədbir üçün", icon: "✧" },
];
export const cities = [
  "Bakı",
  "Sumqayıt",
  "Gəncə",
  "Xırdalan",
  "Abşeron",
  "Ağcabədi",
  "Ağdam",
  "Ağdaş",
  "Ağdərə",
  "Ağstafa",
  "Ağsu",
  "Astara",
  "Babək",
  "Balakən",
  "Beyləqan",
  "Bərdə",
  "Biləsuvar",
  "Cəbrayıl",
  "Cəlilabad",
  "Culfa",
  "Daşkəsən",
  "Dəliməmmədli",
  "Füzuli",
  "Gədəbəy",
  "Goranboy",
  "Göyçay",
  "Göygöl",
  "Göytəpə",
  "Hacıqabul",
  "Horadiz",
  "Xaçmaz",
  "Xankəndi",
  "Xızı",
  "Xocalı",
  "Xocavənd",
  "Xudat",
  "İmişli",
  "İsmayıllı",
  "Kəlbəcər",
  "Kəngərli",
  "Kürdəmir",
  "Laçın",
  "Lerik",
  "Lənkəran",
  "Liman",
  "Masallı",
  "Mingəçevir",
  "Naftalan",
  "Naxçıvan",
  "Neftçala",
  "Oğuz",
  "Ordubad",
  "Qax",
  "Qazax",
  "Qəbələ",
  "Qobustan",
  "Qovlar",
  "Quba",
  "Qubadlı",
  "Qusar",
  "Saatlı",
  "Sabirabad",
  "Salyan",
  "Samux",
  "Sədərək",
  "Siyəzən",
  "Şabran",
  "Şahbuz",
  "Şamaxı",
  "Şəki",
  "Şəmkir",
  "Şərur",
  "Şirvan",
  "Şuşa",
  "Tərtər",
  "Tovuz",
  "Ucar",
  "Yardımlı",
  "Yevlax",
  "Zaqatala",
  "Zəngilan",
  "Zərdab",
  "Digər",
];

export type Listing = {
  id: string;
  owner_id?: string;
  listing_no?: number | string;
  promotion_kind?: "vip"|"premium"|null;
  promotion_until?: string|null;
  review_kind?: "new" | "edited";
  seller_since?: string;
  first_published_at?: string | null;
  expires_at?: string | null;
  category: string;
  title: string;
  city: string;
  district?: string;
  price: number;
  rental_period: string;
  status: string;
  description: string;
  contact: string;
  images: string[];
  created_at: string;
  rooms?: number;
  area_m2?: number;
  demo?: boolean;
  deposit?: number;
  min_days?: number;
  available_from?: string | null;
  available_until?: string | null;
  rejection_reason?: string | null;
  views?: number;
  attributes?: {
    [key: string]: string | number | string[] | undefined;
    delivery_method?: string;
    delivery_fee?: string;
    included_items?: string;
    return_terms?: string;
    utilities?: string;
    driver_service?: string;
    min_driver_age?: string;
    license_years?: string;
    included_km_day?: string;
    body_type?: string;
    drivetrain?: string;
    mileage_km?: string;
    is_new?: string;
    building_type?: string;
    repair?: string;
    floor?: string;
    total_floors?: string;
    contact_name?: string;
    min_rental_value?: string;
    min_rental_unit?: string;
    color?: string;
    fuel?: string;
    engine_cc?: string;
    condition?: string;
    kind?: string;
    frame_size?: string;
    wheel_size?: string;
    capacity?: string;
    brand?: string;
    model?: string;
    year?: number;
    gearbox?: string;
    amenities?: string[];
  };
};
export const categoryName = (id: string) =>
  categories.find((c) => c.id === id)?.name ?? id;
export const periodName = (id: string) => (id === "monthly" ? "ay" : id === "weekly" ? "həftə" : "gün");
export const statusName = (id: string) =>
  ({
    pending: "Yoxlanılır",
    published: "Yayımlanıb",
    rejected: "Qəbul edilməyib",
    archived: "Arxivdə",
    expired: "Müddəti bitib",
    draft: "Qaralama",
  })[id] ?? id;
// Keep SSR and browser output identical even when a browser lacks az-AZ ICU data.
export const money = (price: number) => {
  const value = Number(price);
  if (!Number.isFinite(value)) return "—";
  const [whole, decimal] = Math.abs(value).toFixed(2).split(".");
  const fraction = decimal?.replace(/0+$/, "");
  return `${value < 0 ? "−" : ""}${whole.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0")}${fraction ? `,${fraction}` : ""}`;
};

export const photo = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=80`;
export const examples: Listing[] = [
  [
    "property",
    "Nizami metrosu yaxınlığında işıqlı mənzil",
    "Bakı",
    45,
    "photo-1600585154340-be6161a56a0c",
  ],
  [
    "car",
    "Hyundai Elantra — rahat şəhər səfərləri",
    "Bakı",
    55,
    "photo-1503376780353-7e6692767b70",
  ],
  [
    "villa",
    "Mərdəkan, hovuzlu və geniş həyətli bağ evi",
    "Bakı",
    180,
    "photo-1600607687939-ce8a6c25118c",
  ],
  [
    "commercial",
    "28 Mayda işıqlı ofis, 85 m²",
    "Bakı",
    1200,
    "photo-1497366754035-f200968a6e72",
  ],
  [
    "equipment",
    "Foto və video çəkiliş üçün kamera",
    "Sumqayıt",
    35,
    "photo-1502920917128-1aa500764cbd",
  ],
  [
    "bicycle",
    "Həftəsonu gəzintisi üçün şəhər velosipedi",
    "Bakı",
    12,
    "photo-1571068316344-75bc76f77890",
  ],
].map((v, i) => ({
  id: `example-${i}`,
  category: String(v[0]),
  title: String(v[1]),
  city: String(v[2]),
  price: Number(v[3]),
  images: [
    [
      "/room.svg",
      "/car.svg",
      "/room.svg",
      "/room.svg",
      "/camera.svg",
      "/bicycle.svg",
    ][i],
  ],
  rental_period: i === 3 ? "monthly" : "daily",
  status: "published",
  description:
    "Bu elan saytın imkanlarını göstərmək üçün nümunədir. Real kirayə təklifi deyil.",
  contact: "",
  created_at: "2026-10-20",
  demo: true,
  rooms: i === 0 ? 2 : i === 2 ? 4 : undefined,
  area_m2: i === 0 ? 65 : i === 2 ? 180 : i === 3 ? 85 : undefined,
  deposit: i === 1 ? 100 : 0,
  min_days: 1,
  attributes:
    i === 1
      ? { brand: "Hyundai", model: "Elantra", year: 2022, gearbox: "Avtomat" }
      : i === 0
        ? { amenities: ["Wi-Fi", "Kondisioner", "Mebel"] }
        : {},
}));
export async function loadListings(
  scope: "public" | "mine" | "admin" = "public",
) {
  const response=await fetch(`/api/listings?scope=${scope}&limit=200`,{cache:'no-store',signal:AbortSignal.timeout(15000)});const result=await response.json();
  if(!response.ok)throw new Error(response.status===401?"Əvvəl hesabınıza daxil olun.":"Elanları yükləmək mümkün olmadı. Yenidən yoxla.");return result.items as Listing[];
}
export function readFavorites(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem("kiraye-favorites") ?? "[]");
    return Array.isArray(value)
      ? value.filter((x) => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}
