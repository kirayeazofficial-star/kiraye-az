
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
  listing_no?: number | string;
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
// Keep SSR and browser output identical even when a browser lacks az-AZ ICU data.
export const money = (price: number) => {
  const value = Number(price);
  if (!Number.isFinite(value)) return "—";
  const [whole, decimal] = Math.abs(value).toFixed(2).split(".");
  const fraction = decimal?.replace(/0+$/, "");
  return `${value < 0 ? "−" : ""}${whole.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0")}${fraction ? `,${fraction}` : ""}`;
};

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
