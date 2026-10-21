// Suggestions are editable so uncommon brands and models can also be listed.
export const carModels: Record<string, string[]> = {
  Audi: ["A3", "A4", "A6", "Q3", "Q5", "Q7"],
  BMW: ["1 Series", "3 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X6"],
  BYD: ["Destroyer 05", "Qin Plus", "Song Plus", "Yuan Plus"],
  Changan: ["Alsvin", "CS35 Plus", "CS55 Plus", "UNI-K", "UNI-T", "UNI-V"],
  Chevrolet: ["Aveo", "Captiva", "Cobalt", "Cruze", "Malibu", "Nexia", "Spark"],
  Ford: ["Escape", "Explorer", "Focus", "Fusion", "Mustang", "Transit"],
  Geely: ["Coolray", "Emgrand", "Monjaro"],
  Honda: ["Accord", "Civic", "CR-V", "Fit", "Insight"],
  Hyundai: ["Accent", "Elantra", "H-1", "i30", "Santa Fe", "Sonata", "Tucson"],
  Kia: ["Cerato", "K5", "Optima", "Picanto", "Rio", "Sorento", "Sportage"],
  LADA: ["2106", "2107", "Granta", "Niva", "Priora", "Vesta"],
  Lexus: ["ES", "GS", "GX", "IS", "LX", "NX", "RX"],
  "Mercedes-Benz": [
    "A-Class",
    "C-Class",
    "E-Class",
    "S-Class",
    "G-Class",
    "GLC",
    "GLE",
    "Sprinter",
    "Vito",
  ],
  Mitsubishi: ["ASX", "Lancer", "Outlander", "Pajero"],
  Nissan: ["Altima", "Juke", "Micra", "Patrol", "Qashqai", "Sunny", "X-Trail"],
  Opel: ["Astra", "Corsa", "Insignia", "Vectra", "Zafira"],
  Renault: ["Clio", "Duster", "Logan", "Megane", "Sandero"],
  Skoda: ["Fabia", "Kodiaq", "Octavia", "Rapid", "Superb"],
  Tesla: ["Model 3", "Model S", "Model X", "Model Y"],
  Toyota: [
    "Aqua",
    "Camry",
    "Corolla",
    "Land Cruiser",
    "Prado",
    "Prius",
    "RAV4",
    "Yaris",
  ],
  Volkswagen: ["Golf", "Jetta", "Passat", "Polo", "Tiguan", "Touareg"],
};
export const motorcycleModels: Record<string, string[]> = {
  Aprilia: ["RS 125", "RS 660"],
  Bajaj: ["Boxer", "Dominar", "Pulsar"],
  BMW: ["G 310 R", "R 1250 GS", "S 1000 RR"],
  CFMOTO: ["250NK", "300NK", "450SR"],
  Ducati: ["Monster", "Multistrada", "Panigale"],
  Honda: ["CB125", "CB500F", "CBR600RR", "PCX"],
  Kawasaki: ["Ninja 400", "Ninja 650", "Z650", "Z900"],
  KTM: ["Duke 200", "Duke 390", "RC 390"],
  Suzuki: ["Address", "GSX-R600", "V-Strom"],
  Yamaha: ["MT-03", "MT-07", "NMAX", "YZF-R3", "YZF-R6"],
};
export const listingExamples: Record<
  string,
  { title: string; description: string }
> = {
  property: {
    title: "Nizami metrosu yaxınlığında 2 otaqlı mənzil",
    description:
      "Mənzilin vəziyyəti, əşyaları və kirayə şərtləri haqqında yaz.",
  },
  villa: {
    title: "Mərdəkanda hovuzlu bağ evi",
    description:
      "Bağın şəraiti, hovuzu, tutumu və kirayə şərtləri haqqında yaz.",
  },
  commercial: {
    title: "Şəhər mərkəzində 85 m² ofis",
    description: "Obyektin təyinatını, sahəsini və şəraitini yaz.",
  },
  car: {
    title: "Hyundai Elantra günlük kirayə",
    description:
      "Avtomobilin vəziyyətini, yürüş limitini və sürücü üçün tələbləri yaz.",
  },
  motorcycle: {
    title: "Yamaha NMAX motosiklet kirayəsi",
    description:
      "Motosikletin vəziyyətini, təchizatını və kirayə şərtlərini yaz.",
  },
  equipment: {
    title: "Çəkiliş üçün Canon kamera kirayəsi",
    description:
      "Avadanlığın növünü, marka/modelini, komplektini və vəziyyətini yaz.",
  },
  bicycle: {
    title: "Şəhər gəzintisi üçün velosiped kirayəsi",
    description: "Velosipedin növünü, ölçüsünü və vəziyyətini yaz.",
  },
  event: {
    title: "Tədbirlər üçün səs sistemi kirayəsi",
    description:
      "Nə təklif etdiyini, neçə nəfər üçün uyğun olduğunu və çatdırılma şərtlərini yaz.",
  },
};

export const bicycleModels: Record<string, string[]> = {
  Giant: ["ATX", "Escape", "Talon", "Trance"],
  Trek: ["Domane", "FX", "Marlin", "X-Caliber"],
  Cube: ["Aim", "Attention", "Nature", "Reaction"],
  Scott: ["Aspect", "Scale", "Spark", "Sub Cross"],
  Merida: ["Big Nine", "Crossway", "Matts", "Scultura"],
  Specialized: ["Allez", "Rockhopper", "Sirrus", "Stumpjumper"],
  Cannondale: ["Quick", "Synapse", "Trail"],
  Bianchi: ["C-Sport", "Impulso", "Via Nirone"],
  "B'Twin": ["Riverside", "Rockrider", "Triban"],
  Trinx: ["M100", "M136", "M500"],
  BMC: [],
  Forward: [],
  Orbea: [],
  Sava: [],
  Stels: [],
};
export const colors = [
  "Ağ",
  "Qara",
  "Boz",
  "Gümüşü",
  "Mavi",
  "Göy",
  "Qırmızı",
  "Yaşıl",
  "Sarı",
  "Narıncı",
  "Qəhvəyi",
  "Bej",
  "Bənövşəyi",
  "Çəhrayı",
  "Çoxrəngli",
  "Digər",
];
export const extraAttributeLabels = {
  color: "Rəng",
  fuel: "Yanacaq növü",
  engine_cc: "Mühərrik həcmi (sm³)",
  condition: "Vəziyyət",
  kind: "Növ",
  frame_size: "Çərçivə ölçüsü",
  wheel_size: "Təkər ölçüsü",
  capacity: "Nəfər sayı",
} as const;
