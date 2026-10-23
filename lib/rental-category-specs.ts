// User-entered specifications, never inferred from a model name.
export type RentalSpec = {
  key: string; label: string; options?: string[]; min?: number; max?: number;
  step?: string; placeholder?: string;
};
type Kind = { models: Record<string, string[]>; fields: RentalSpec[] };
type Category = { label: string; kinds: Record<string, Kind> };
const number = (key: string, label: string, min: number, max: number, step = "1"): RentalSpec => ({key,label,min,max,step});
const choice = (key: string,label: string,options: string[]): RentalSpec => ({key,label,options});
const electricFields = [
  number("range_km","Bir şarjla yürüş məsafəsi (km)",1,1000,"0.1"),
  number("runtime_hours","Bir şarjla işləmə müddəti (saat)",0.1,100,"0.1"),
  number("charge_hours","Tam şarj müddəti (saat)",0.1,48,"0.1"),
  number("battery_wh","Batareya tutumu (Wh)",1,20000),
  number("max_load_kg","Maksimum daşıma çəkisi (kq)",1,500),
];
const power = choice("power_source","Enerji növü",["Şəbəkə / kabel","Akkumulyator","Benzin","Əl ilə","Digər"]);
const toolFields = [power,number("power_w","Güc (W)",1,100000),number("battery_voltage","Akkumulyator gərginliyi (V)",1,120,"0.1")];
const clothingBrands: Record<string, Record<string,string[]>> = {
  "Kostyum": { BOSS:[], Zara:[], Mango:[], "Massimo Dutti":[], "Altınyıldız Classics":[], Kiğılı:[] },
  "Gəlinlik": { Pronovias:[], "Rosa Clará":[], "Maggie Sottero":[], "Justin Alexander":[] },
  "Ziyafət geyimi": { Zara:[], Mango:[], "Adrianna Papell":[], "Sherri Hill":[] },
  "Uşaq tədbir geyimi": { "LC Waikiki":[], Koton:[], Zara:[] },
};
const clothingFields = [
  choice("clothing_size","Geyim ölçüsü",["XS","S","M","L","XL","XXL","XXXL","34","36","38","40","42","44","46","48","50","52","54","56","Ölçüyə uyğun tənzimlənir","Digər"]),
  {key:"size_note",label:"Ölçü haqqında əlavə məlumat",placeholder:"Məsələn: bel 80 sm, boy 175 sm"},
  choice("audience","Kim üçün",["Qadın","Kişi","Uşaq","Uniseks"]),
  {key:"material",label:"Parça / material",placeholder:"Məsələn: yun, atlas, pambıq"},
  choice("cleaning_terms","Təmizləmə şərti",["Qiymətə daxildir","Sahib təmizləyir, ayrıca ödənişlə","Təmiz qaytarılmalıdır","Razılaşma ilə"]),
];
export const rentalCategorySpecs: Record<string,Category> = {
  clothing: {label:"Geyimin növü", kinds: Object.fromEntries(["Kostyum","Gəlinlik","Ziyafət geyimi","Milli geyim","Uşaq tədbir geyimi","Aksesuar","Digər"].map(kind => [kind,{models:clothingBrands[kind] || {},fields: kind === "Aksesuar" ? [{key:"accessory_size",label:"Ölçü / uyğunluq"}] : clothingFields}]))},
  electric: {label:"Elektrik nəqliyyatının növü", kinds:{
    "Elektrik skuter":{models:{Xiaomi:["Electric Scooter 4","Electric Scooter 4 Pro","Mi Electric Scooter Pro 2"],"Segway-Ninebot":["MAX G2","F2","F2 Pro"],KuKirin:["G2","G2 Pro","G2 Max","G3","G4"],Kugoo:["S1","S3","M4","M4 Pro"],NIU:["KQi2 Pro","KQi3 Pro","KQi3 Max"],Dualtron:["Mini","Thunder","Victor"],Inokim:["Light 2","OX","OXO"],Kaabo:["Mantis 10","Wolf Warrior 11"]},fields:electricFields},
    "Elektrik velosiped":{models:{ENGWE:["EP-2 Pro","Engine Pro","L20"],Fiido:["D11","M1 Pro","D4S"],ADO:["A20","Air 20"],Cube:[],Giant:[],Trek:[],Specialized:[],Merida:[],Scott:[],HIMO:["C20","Z20"],SAMEBIKE:[]},fields:[...electricFields,choice("frame_size","Çərçivə ölçüsü",["XS","S","M","L","XL","Digər"])]},
  }},
  photo: {label:"Çəkiliş avadanlığının növü", kinds:{
    "Fotoaparat":{models:{Canon:["EOS R5","EOS R6","EOS 5D Mark IV"],Nikon:["Z6","Z7","D850"],Sony:["A7 III","A7 IV"],Fujifilm:["X-T4","X-T5"]},fields:[number("resolution_mp","Şəkil ölçüsü (MP)",1,500,"0.1")]},
    "Videokamera":{models:{Sony:["FX3","FX30"],Canon:["EOS C70"],Panasonic:["GH5","GH6"],Blackmagic:[]},fields:[choice("video_resolution","Video keyfiyyəti",["Full HD","4K","6K","8K","Digər"])]},
    "Obyektiv":{models:{Canon:[],Nikon:[],Sony:[],Sigma:[],Tamron:[]},fields:[{key:"lens_mount",label:"Uyğun kamera bağlantısı",placeholder:"Məsələn: Canon RF, Sony E"},{key:"focal_length",label:"Fokus məsafəsi",placeholder:"Məsələn: 24–70 mm"}]},
    "İşıq":{models:{Godox:[],Aputure:[],Nanlite:[]},fields:[number("power_w","Güc (W)",1,100000)]},
    "Stabilizator / ştativ":{models:{DJI:["RS 3","RS 4"],Zhiyun:[],Manfrotto:[]},fields:[number("max_load_kg","Maksimum daşıma çəkisi (kq)",0.1,100,"0.1")]},
    "Proyektor":{models:{Epson:[],BenQ:[],XGIMI:[]},fields:[number("brightness_lumens","Parlaqlıq (lümen)",1,100000),choice("video_resolution","Görüntü keyfiyyəti",["HD","Full HD","4K","Digər"])]},
    "Digər":{models:{},fields:[]},
  }},
  camping: {label:"Turizm avadanlığının növü", kinds:{
    "Çadır":{models:{Quechua:[],Naturehike:[],Coleman:[],Husky:[]},fields:[number("capacity","Neçə nəfərlikdir",1,100),choice("season","Mövsüm",["Yay","3 mövsüm","4 mövsüm"]),choice("waterproof","Suya davamlılıq",["Var","Yoxdur","Məlum deyil"])]},
    "Yataq kisəsi":{models:{Quechua:[],Naturehike:[],Husky:[]},fields:[number("comfort_temp_c","Rahat istifadə temperaturu (°C)",-60,40),choice("clothing_size","Ölçü",["Uşaq","S","M","L","XL","Digər"])]},
    "Səyahət çantası":{models:{Deuter:[],Osprey:[],Quechua:[]},fields:[number("volume_l","Həcm (litr)",1,200)]},
    "Düşərgə mebeli":{models:{Quechua:[],Naturehike:[],Coleman:[]},fields:[number("quantity","Dəstdə neçə ədəd var",1,1000)]},
    "Digər":{models:{},fields:[]},
  }},
  equipment: {label:"Alətin / texnikanın növü", kinds:{
    "Drel / şurupburğan":{models:{Bosch:["GSB 18V-50","GSR 180-LI"],Makita:["DDF482","DHP482"],DeWalt:["DCD796"],Ingco:[],Total:[]},fields:toolFields},
    "Perforator":{models:{Bosch:["GBH 2-26"],Makita:["HR2470"],Hilti:[],DeWalt:[]},fields:toolFields},
    "Qaynaq aparatı":{models:{Jasic:[],Resanta:[],Ingco:[],Total:[]},fields:[power,number("welding_current_a","Maksimum qaynaq cərəyanı (A)",1,1000)]},
    "Kəsici / laqonda":{models:{Bosch:[],Makita:[],DeWalt:[],Metabo:[]},fields:[...toolFields,number("disc_diameter_mm","Disk diametri (mm)",1,1000)]},
    "Generator":{models:{Honda:[],Hyundai:[],Ingco:[],Total:[]},fields:[power,number("power_kw","Güc (kW)",0.1,1000,"0.1")]},
    "Təmizlik avadanlığı":{models:{Kärcher:[],Nilfisk:[],Bosch:[]},fields:[power,number("tank_l","Çən tutumu (litr)",0.1,1000,"0.1")]},
    "Bağ avadanlığı":{models:{Stihl:[],Husqvarna:[],Makita:[],Bosch:[]},fields:toolFields},
  }},
  event: {label:"Tədbir üçün nə təklif edirsən?",kinds:{
    "Səs və işıq":{models:{JBL:[],Yamaha:[],Bose:[],Shure:[],Godox:[]},fields:[number("capacity","Neçə nəfər üçün uyğundur",1,100000),number("power_w","Güc (W)",1,100000)]},
    "Masa və stul":{models:{},fields:[number("quantity","Dəstdə neçə ədəd var",1,100000),number("capacity","Neçə nəfər üçün uyğundur",1,100000)]},
    "Çadır":{models:{},fields:[number("capacity","Neçə nəfər üçün uyğundur",1,100000),number("width_m","En (metr)",0.1,1000,"0.1"),number("length_m","Uzunluq (metr)",0.1,1000,"0.1")]},
    "Dekorasiya":{models:{},fields:[{key:"material",label:"Material"},number("quantity","Dəstdə neçə ədəd var",1,100000)]},
    "Qab-qacaq":{models:{},fields:[number("quantity","Dəstdə neçə ədəd var",1,100000),number("capacity","Neçə nəfər üçün uyğundur",1,100000)]},
    "Tədbir avadanlığı":{models:{},fields:[number("capacity","Neçə nəfər üçün uyğundur",1,100000)]},
    "Digər":{models:{},fields:[]},
  }},
};
export function rentalSpecs(category:string,kind:string) {
  return rentalCategorySpecs[category]?.kinds[kind];
}
export const rentalSpecLabels: Record<string,string> = {};
for (const category of Object.values(rentalCategorySpecs))
  for (const kind of Object.values(category.kinds))
    for (const field of kind.fields) rentalSpecLabels[field.key]=field.label;
