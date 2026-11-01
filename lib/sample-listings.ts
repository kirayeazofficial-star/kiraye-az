import type { Listing } from "./marketplace";

// Sample listings shown while a category has fewer than SAMPLE_UNTIL real listings. Every sample is
// clearly marked «Nümunə», has no owner, phone or messages, and is never indexed by Google.
// Photos: Unsplash (free licence), checked by eye — the title always names what the photo shows.
export const SAMPLE_UNTIL = 3;
type Row = [category: string, slug: string, title: string, city: string, district: string, price: number, period: "daily" | "weekly" | "monthly", text: string, extra?: Partial<Listing>];
const rows: Row[] = [
  ["property", "ev-1", "2 otaqlı təmirli mənzil, Nəsimi", "Bakı", "Nəsimi", 900, "monthly", "İşıqlı, təmirli 2 otaqlı mənzil. Mətbəx mebeli və məişət texnikası var, metroya 7 dəqiqə.", { rooms: 2, area_m2: 68, attributes: { kind: "Mənzil", repair: "Təmirli", floor: "6", total_floors: "12", amenities: ["Wi-Fi", "Kondisioner", "Mebel", "Mətbəx", "Paltaryuyan"] } }],
  ["property", "ev-2", "3 otaqlı geniş mənzil, dəniz mənzərəli", "Bakı", "Səbail", 1500, "monthly", "Böyük qonaq otağı, panoram pəncərələr, dənizə baxan eyvan. Ailə üçün uyğundur.", { rooms: 3, area_m2: 120, attributes: { kind: "Mənzil", repair: "Təmirli", floor: "9", total_floors: "16", amenities: ["Wi-Fi", "Kondisioner", "İstilik", "Mebel", "Balkon", "Lift", "Park yeri"] } }],
  ["property", "ev-3", "1 otaqlı studiya, günlük kirayə", "Bakı", "Yasamal", 60, "daily", "Yeni təmirli studiya: ayrıca mətbəx guşəsi, təmiz yataq dəsti, sürətli Wi-Fi.", { rooms: 1, area_m2: 40, attributes: { kind: "Mənzil", repair: "Təmirli", amenities: ["Wi-Fi", "Kondisioner", "Mebel", "Mətbəx"] } }],
  ["car", "car-fiat-500", "Fiat 500, avtomat, şəhər üçün qənaətli", "Bakı", "", 45, "daily", "Kiçik, rahat və az yanacaq işlədən şəhər avtomobili. Kondisioner, Bluetooth.", { deposit: 150, attributes: { brand: "Fiat", model: "500", gearbox: "Avtomat", fuel: "Benzin", color: "Mavi" } }],
  ["car", "car-chevrolet-camaro", "Chevrolet Camaro, toy və çəkiliş üçün", "Bakı", "", 180, "daily", "Parlaq mavi Camaro — toy kortejləri, foto və video çəkilişləri üçün.", { deposit: 500, attributes: { brand: "Chevrolet", model: "Camaro", gearbox: "Avtomat", fuel: "Benzin", color: "Mavi" } }],
  ["car", "car-mercedes", "Mercedes-Benz GLE Coupe, sürücü ilə", "Bakı", "", 250, "daily", "Ağ GLE Coupe — hava limanı transferi, işgüzar görüşlər və tədbirlər üçün sürücü ilə.", { deposit: 0, attributes: { brand: "Mercedes-Benz", model: "GLE Coupe", gearbox: "Avtomat", fuel: "Benzin", color: "Ağ" } }],
  ["motorcycle", "moto-yamaha-r6", "Yamaha YZF-R6, idman motosikleti", "Bakı", "", 90, "daily", "Təcrübəli sürücülər üçün. Dəbilqə və qoruyucu geyim əlavə ödənişsiz verilir.", { deposit: 400, attributes: { brand: "Yamaha", model: "YZF-R6" } }],
  ["motorcycle", "moto-ducati", "Ducati SuperSport, qırmızı", "Bakı", "", 110, "daily", "Rahat oturacaq və uzun yollar üçün uyğun idman-turinq motosikleti.", { deposit: 500, attributes: { brand: "Ducati", model: "SuperSport" } }],
  ["motorcycle", "moto-harley", "Harley-Davidson kruzer, səyahət üçün", "Bakı", "", 120, "daily", "Yan çantalı kruzer — region səfərləri üçün. Kateqoriya A sürücülük vəsiqəsi tələb olunur.", { deposit: 500, attributes: { brand: "Harley-Davidson" } }],
  ["villa", "villa-1", "Mərdəkanda hovuzlu müasir villa", "Bakı", "Mərdəkan", 350, "daily", "5 otaq, böyük hovuz, barbekü sahəsi və geniş həyət. Həftəsonu və ailə istirahəti üçün.", { rooms: 5, area_m2: 320, attributes: { kind: "Villa", amenities: ["Wi-Fi", "Kondisioner", "Hovuz", "Barbekü", "Park yeri"] } }],
  ["villa", "villa-2", "Novxanıda dənizə yaxın villa", "Bakı", "Novxanı", 400, "daily", "Üç mərtəbəli villa, hovuz, terras və dəniz mənzərəsi. 10 nəfərədək qonaq.", { rooms: 6, area_m2: 380, attributes: { kind: "Villa", amenities: ["Wi-Fi", "Kondisioner", "Hovuz", "Sauna", "Park yeri"] } }],
  ["villa", "villa-3", "Qəbələdə hovuzlu bağ evi", "Qəbələ", "", 220, "daily", "Yaşıl həyət, hovuz və eyvanlı iki mərtəbəli ev. Dağ havasında istirahət üçün.", { rooms: 4, area_m2: 200, attributes: { kind: "Bağ evi", amenities: ["Wi-Fi", "Hovuz", "Barbekü", "Park yeri"] } }],
  ["commercial", "office-1", "Ofis sahəsi, 120 m², Nərimanov", "Bakı", "Nərimanov", 2200, "monthly", "Açıq planlı ofis, mətbəx guşəsi və 2 iclas otağı. Biznes mərkəzində, mühafizəli.", { area_m2: 120, attributes: { kind: "Ofis", repair: "Təmirli", amenities: ["Wi-Fi", "Kondisioner", "Lift", "Mühafizə", "Park yeri"] } }],
  ["commercial", "office-2", "Coworking üçün işıqlı ofis", "Bakı", "Yasamal", 1600, "monthly", "Böyük pəncərələr, yaşıl guşələr, 20 iş yeri üçün mebel hazırdır.", { area_m2: 90, attributes: { kind: "Ofis", repair: "Təmirli", amenities: ["Wi-Fi", "Kondisioner", "Mebel"] } }],
  ["commercial", "shop-1", "Mağaza üçün obyekt, vitrinli", "Sumqayıt", "", 1200, "monthly", "Əsas küçədə, böyük vitrinli ticarət obyekti. Rəflər və işıqlandırma qalır.", { area_m2: 75, attributes: { kind: "Mağaza", repair: "Təmirli", amenities: ["Kondisioner", "Vitrin", "Mühafizə"] } }],
  ["equipment", "drill-dewalt", "DeWalt akkumulyatorlu drel, 18V", "Bakı", "", 12, "daily", "İki akkumulyator və şarj cihazı ilə. Mebel yığmaq və kiçik təmir işləri üçün.", { deposit: 50, attributes: { kind: "Drel / şurupburğan", brand: "DeWalt", condition: "Əla" } }],
  ["equipment", "drill-milwaukee", "Milwaukee M18 zərbəli drel", "Bakı", "", 15, "daily", "Beton və kərpic üçün güclü zərbəli drel, uc dəsti daxildir.", { deposit: 60, attributes: { kind: "Drel / şurupburğan", brand: "Milwaukee", condition: "Yaxşı" } }],
  ["equipment", "tools-set", "Təmir üçün alət dəsti", "Gəncə", "", 20, "daily", "Drel, açarlar, tester və digər əl alətləri — ev təmiri üçün hamısı bir yerdə.", { deposit: 50, attributes: { kind: "Digər", condition: "Yaxşı" } }],
  ["clothing", "suit", "Kişi kostyumu, tünd göy, 50 ölçü", "Bakı", "", 30, "daily", "Klassik kəsimli kostyum. Toy, nişan və rəsmi tədbirlər üçün. Təmizlənmiş halda verilir.", { deposit: 50, attributes: { kind: "Kostyum", condition: "Az geyinilib, qüsursuz", color: "Göy" } }],
  ["clothing", "evening-dress", "Axşam paltarı, bənövşəyi, 44 ölçü", "Bakı", "", 40, "daily", "Açıq çiyinli axşam paltarı — ziyafət və fotosessiya üçün.", { deposit: 60, attributes: { kind: "Ziyafət geyimi", condition: "Az geyinilib, qüsursuz", color: "Bənövşəyi" } }],
  ["electric", "ebike", "Elektrik velosiped, 60 km yürüş", "Bakı", "", 25, "daily", "Bir şarjla 60 km-ə qədər. Şəhərdaxili gediş-gəliş üçün rahat.", { deposit: 100, attributes: { kind: "Elektrik velosiped" } }],
  ["photo", "camera-canon", "Canon EOS fotoaparat, 18–55 mm obyektivlə", "Bakı", "", 35, "daily", "Başlanğıc və həvəskar çəkilişlər üçün. Yaddaş kartı və əlavə batareya ilə.", { deposit: 150, attributes: { kind: "Fotoaparat", brand: "Canon", condition: "Əla" } }],
  ["photo", "lens-sigma", "Sigma 18–35 mm f/1.8 Art obyektiv", "Bakı", "", 30, "daily", "İşıqlı geniş bucaqlı obyektiv — interyer, video və portret çəkilişləri üçün.", { deposit: 200, attributes: { kind: "Obyektiv", brand: "Sigma", condition: "Əla" } }],
  ["camping", "tent", "4 nəfərlik çadır, su keçirməz", "Bakı", "", 15, "daily", "Asan qurulan çadır, yerə sərilən örtüklə birlikdə. Dağ və meşə səfərləri üçün.", { deposit: 40, attributes: { kind: "Çadır", condition: "Əla" } }],
  ["camping", "camp-set", "Düşərgə dəsti: çadır, yataq kisəsi, ocaq", "Qəbələ", "", 35, "daily", "4 nəfər üçün tam düşərgə dəsti: çadır, yataq kisələri, qatlanan stullar və fənərlər.", { deposit: 80, attributes: { kind: "Digər", condition: "Yaxşı" } }],
  ["camping", "caravan", "Kemper qoşqu, 4 nəfərlik", "Bakı", "", 120, "daily", "Yataq yerləri, mətbəx guşəsi və tentli istirahət sahəsi olan kemper.", { deposit: 300, attributes: { kind: "Digər", condition: "Yaxşı" } }],
  ["bicycle", "bike-city", "Şəhər velosipedi, yüngül çərçivə", "Bakı", "", 8, "daily", "Bulvar və park gəzintiləri üçün yüngül velosiped.", { deposit: 30, attributes: { kind: "Şəhər" } }],
  ["bicycle", "bike-road", "Karbon yol velosipedi", "Bakı", "", 20, "daily", "Yüngül karbon çərçivə, 22 sürət. Məşq və uzun məsafələr üçün.", { deposit: 100, attributes: { kind: "Yol" } }],
  ["bicycle", "bike-fixie", "Fikse velosiped, narıncı təkərlər", "Sumqayıt", "", 7, "daily", "Sadə və möhkəm fikse velosiped — gündəlik gəzinti üçün.", { deposit: 30, attributes: { kind: "Şəhər" } }],
  ["event", "event-banquet", "Ziyafət masası dekoru və qab-qacaq", "Bakı", "", 150, "daily", "30 nəfərlik masa düzümü: süfrə, boşqab, bokallar və gül kompozisiyaları.", { attributes: { kind: "Dekorasiya", condition: "Əla", capacity: "30" } }],
  ["event", "event-hall", "Toy və mərasim üçün masa-stul dəsti", "Gəncə", "", 300, "daily", "100 nəfərlik masa, örtüklü stullar və bəzək. Çatdırılma və quraşdırma daxildir.", { attributes: { kind: "Masa və stul", condition: "Yaxşı", capacity: "100" } }],
  ["event", "event-stage", "Səhnə işıqlandırması və səs sistemi", "Bakı", "", 400, "daily", "Konsert və açıq hava tədbirləri üçün işıq, səs və operator xidməti.", { attributes: { kind: "Səs və işıq", condition: "Əla" } }],
];

// Extra photos only where they plausibly show the same place (other rooms, another side of the house).
const morePhotos: Record<string, string[]> = {
  "ev-1": ["ev-3", "ev-x1"], "ev-2": ["ev-x2"], "ev-3": ["ev-x1"],
  "villa-1": ["villa-x2"], "villa-2": ["villa-x1"], "office-1": ["office-x1"],
};
export const sampleListings: Listing[] = rows.map(([category, slug, title, city, district, price, period, text, extra], i) => ({
  id: `example-${slug}`,
  category, title, city, district: district || undefined, price, rental_period: period,
  images: [`/samples/${slug}.jpg`, ...(morePhotos[slug] || []).map(name => `/samples/${name}.jpg`)],
  description: `${text}\n\nBu nümunə elandır — saytın necə görünəcəyini göstərir, real kirayə təklifi deyil. Öz elanınızı pulsuz yerləşdirin.`,
  contact: "", status: "published", created_at: new Date(Date.UTC(2026, 9, 25, 9, 0) - i * 3600000).toISOString(),
  demo: true, deposit: 0, min_days: 1,
  ...extra,
} as Listing));
