import type { Listing } from "../lib/marketplace";

// Saytdakı bütün elanlar buradan gəlir. Elan əlavə etmək, dəyişmək və ya
// silmək üçün bu faylı redaktə et (və ya Claude-dan xahiş et).
//
// Qaydalar:
// - `id` unikal olmalıdır; elanın ünvanı /listings/<id> olur.
// - `status: "published"` olan elanlar görünür. Gizlətmək üçün "hidden" yaz.
// - `demo: true` elan "Nümunə" işarəsi alır və axtarış sistemlərinə verilmir.
//   Real elanlarda bu sətri sil.
// - `images`: şəkillər public/ qovluğundadır, məsələn "/photos/ev-1.jpg".
// - `contact`: elan sahibinin telefonu (050 123 45 67 formatında yaza bilərsən).
// - `category`: property, car, motorcycle, villa, commercial, equipment,
//   clothing, electric, photo, camping, bicycle, event.
// - `rental_period`: "daily", "weekly" və ya "monthly".

const sampleNote =
  "Bu elan saytın imkanlarını göstərmək üçün nümunədir. Real kirayə təklifi deyil.";

export const listings: Listing[] = [
  {
    id: "example-0",
    category: "property",
    title: "Nizami metrosu yaxınlığında işıqlı mənzil",
    city: "Bakı",
    price: 45,
    rental_period: "daily",
    status: "published",
    description: sampleNote,
    contact: "",
    images: ["/room.svg"],
    created_at: "2026-10-20",
    demo: true,
    rooms: 2,
    area_m2: 65,
    deposit: 0,
    min_days: 1,
    attributes: { amenities: ["Wi-Fi", "Kondisioner", "Mebel"] },
  },
  {
    id: "example-1",
    category: "car",
    title: "Hyundai Elantra — rahat şəhər səfərləri",
    city: "Bakı",
    price: 55,
    rental_period: "daily",
    status: "published",
    description: sampleNote,
    contact: "",
    images: ["/car.svg"],
    created_at: "2026-10-20",
    demo: true,
    deposit: 100,
    min_days: 1,
    attributes: { brand: "Hyundai", model: "Elantra", year: 2022, gearbox: "Avtomat" },
  },
  {
    id: "example-2",
    category: "villa",
    title: "Mərdəkan, hovuzlu və geniş həyətli bağ evi",
    city: "Bakı",
    price: 180,
    rental_period: "daily",
    status: "published",
    description: sampleNote,
    contact: "",
    images: ["/room.svg"],
    created_at: "2026-10-20",
    demo: true,
    rooms: 4,
    area_m2: 180,
    deposit: 0,
    min_days: 1,
    attributes: {},
  },
  {
    id: "example-3",
    category: "commercial",
    title: "28 Mayda işıqlı ofis, 85 m²",
    city: "Bakı",
    price: 1200,
    rental_period: "monthly",
    status: "published",
    description: sampleNote,
    contact: "",
    images: ["/room.svg"],
    created_at: "2026-10-20",
    demo: true,
    area_m2: 85,
    deposit: 0,
    min_days: 1,
    attributes: {},
  },
  {
    id: "example-4",
    category: "equipment",
    title: "Foto və video çəkiliş üçün kamera",
    city: "Sumqayıt",
    price: 35,
    rental_period: "daily",
    status: "published",
    description: sampleNote,
    contact: "",
    images: ["/camera.svg"],
    created_at: "2026-10-20",
    demo: true,
    deposit: 0,
    min_days: 1,
    attributes: {},
  },
  {
    id: "example-5",
    category: "bicycle",
    title: "Həftəsonu gəzintisi üçün şəhər velosipedi",
    city: "Bakı",
    price: 12,
    rental_period: "daily",
    status: "published",
    description: sampleNote,
    contact: "",
    images: ["/bicycle.svg"],
    created_at: "2026-10-20",
    demo: true,
    deposit: 0,
    min_days: 1,
    attributes: {},
  },
];
