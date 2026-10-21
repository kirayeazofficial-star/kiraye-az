import { supabase } from "./supabase";

export const categories = [
  { id: "property", name: "Ev və mənzil", icon: "⌂" },
  { id: "car", name: "Avtomobil", icon: "▣" },
  { id: "motorcycle", name: "Motosiklet", icon: "◉" },
  { id: "villa", name: "Villa və bağ", icon: "♧" },
  { id: "commercial", name: "Kommersiya", icon: "▦" },
  { id: "equipment", name: "Avadanlıq", icon: "⚒" },
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
  attributes?: {
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
export const periodName = (id: string) => (id === "monthly" ? "ay" : "gün");
export const statusName = (id: string) =>
  ({
    pending: "Yoxlanılır",
    published: "Yayımlanıb",
    rejected: "Qəbul edilməyib",
    archived: "Arxivdə",
    draft: "Qaralama",
  })[id] ?? id;
export const money = (price: number) =>
  new Intl.NumberFormat("az-AZ", { maximumFractionDigits: 2 }).format(price);
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
  if (!supabase)
    throw new Error(
      "Xidmətə bağlantı hələ tamamlanmayıb. Bir az sonra yenidən yoxlayın.",
    );
  let query = supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (scope === "public") query = query.eq("status", "published");
  if (scope === "mine") {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error("Əvvəl hesabınıza daxil olun.");
    query = query.eq("owner_id", data.user.id);
  }
  const { data, error } = await query;
  if (error)
    throw new Error(
      "Elanları yükləmək mümkün olmadı. Bir az sonra yenidən yoxlayın.",
    );
  return data as Listing[];
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
