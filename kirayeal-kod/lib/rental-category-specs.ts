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
  "Kostyum": { BOSS:[], Zara:[], Mango:[], "Massimo Dutti":[], "Altınyıldız Classics":[], Kiğılı:[], Damat:[], Tween:[], "Pierre Cardin":[], Cacharel:[], Ramsey:[], Network:[], Kip:[] },
  "Gəlinlik": { Pronovias:[], "Rosa Clará":[], "Maggie Sottero":[], "Justin Alexander":[], "Vera Wang":[], "Elie Saab":[], "Oksana Mukha":[], "Berta":[], "Galia Lahav":[], "Fərdi tikiş":[] },
  "Ziyafət geyimi": { Zara:[], Mango:[], "Adrianna Papell":[], "Sherri Hill":[], "Jovani":[], "Tarik Ediz":[], "Mac Duggal":[], Ipekyol:[], "Fərdi tikiş":[] },
  "Uşaq tədbir geyimi": { "LC Waikiki":[], Koton:[], Zara:[], "H&M":[], Mothercare:[], DeFacto:[] },
};
const suitFit = choice("suit_fit","Kostyumun növü",["Klassik kostyum","Dar kəsimli kostyum","Smokinq","Üçlük (jiletli)","Digər"]);
const clothingFields = [
  choice("clothing_size","Geyim ölçüsü",["XS","S","M","L","XL","XXL","XXXL","34","36","38","40","42","44","46","48","50","52","54","56","Ölçüyə uyğun tənzimlənir","Digər"]),
  {key:"size_note",label:"Ölçü haqqında əlavə məlumat",placeholder:"Məsələn: bel 80 sm, boy 175 sm"},
  choice("audience","Kim üçün",["Qadın","Kişi","Uşaq","Uniseks"]),
  {key:"material",label:"Parça / material",placeholder:"Məsələn: yun, atlas, pambıq"},
  choice("cleaning_terms","Təmizləmə şərti",["Qiymətə daxildir","Sahib təmizləyir, ayrıca ödənişlə","Təmiz qaytarılmalıdır","Razılaşma ilə"]),
];
export const rentalCategorySpecs: Record<string,Category> = {
  clothing: {label:"Geyimin növü", kinds: Object.fromEntries(["Kostyum","Gəlinlik","Ziyafət geyimi","Milli geyim","Uşaq tədbir geyimi","Aksesuar","Digər"].map(kind => [kind,{models:clothingBrands[kind] || {},fields: kind === "Aksesuar" ? [{key:"accessory_size",label:"Ölçü / uyğunluq"}] : kind === "Kostyum" ? [suitFit,...clothingFields] : clothingFields}]))},
  electric: {label:"Elektrik nəqliyyatının növü", kinds:{
    "Elektrik skuter":{models:{Xiaomi:["Electric Scooter 4","Electric Scooter 4 Pro","Mi Electric Scooter Pro 2"],"Segway-Ninebot":["MAX G2","F2","F2 Pro"],KuKirin:["G2","G2 Pro","G2 Max","G3","G4"],Kugoo:["S1","S3","M4","M4 Pro"],NIU:["KQi2 Pro","KQi3 Pro","KQi3 Max"],Dualtron:["Mini","Thunder","Victor"],Inokim:["Light 2","OX","OXO"],Kaabo:["Mantis 10","Wolf Warrior 11"],Apollo:["City","Ghost","Phantom"],Ultron:["X1","X3"],Joyor:["S5","Y5S"],Halten:["RS-01","RS-02"],Kugookirin:["M4","G2"],Ecodrift:["R8","Twin"]},fields:electricFields},
    "Elektrik velosiped":{models:{ENGWE:["EP-2 Pro","Engine Pro","L20"],Fiido:["D11","M1 Pro","D4S"],ADO:["A20","Air 20"],Cube:[],Giant:[],Trek:[],Specialized:[],Merida:[],Scott:[],HIMO:["C20","Z20"],SAMEBIKE:[],Xiaomi:["Mi Smart Electric Folding Bike"],"Segway":["Xafari","Xyber"],"Haibike":[],"Cube Hybrid":[]},fields:[...electricFields,choice("frame_size","Çərçivə ölçüsü",["XS","S","M","L","XL","Digər"])]},
  }},
  photo: {label:"Çəkiliş avadanlığının növü", kinds:{
    "Fotoaparat":{models:{Canon:["EOS R5","EOS R6","EOS R6 Mark II","EOS R8","EOS 5D Mark IV","EOS 6D Mark II","EOS 90D","EOS 250D"],Nikon:["Z5","Z6","Z6 II","Z7","Z8","D750","D850","D7500"],Sony:["A6400","A6700","A7 III","A7 IV","A7R V","A7S III","ZV-E10"],Fujifilm:["X-H2","X-S20","X-T4","X-T5","X100VI"],Panasonic:["S5 II","GH6"],Leica:["Q2","Q3"]},fields:[number("resolution_mp","Şəkil ölçüsü (MP)",1,500,"0.1")]},
    "Videokamera":{models:{Sony:["FX3","FX30","FX6"],Canon:["EOS C70","XA60"],Panasonic:["GH5","GH6","AG-CX10"],Blackmagic:["Pocket 4K","Pocket 6K"],DJI:["Osmo Pocket 3","Osmo Action 4"],GoPro:["HERO 12","HERO 13"],Insta360:["X3","X4"]},fields:[choice("video_resolution","Video keyfiyyəti",["Full HD","4K","6K","8K","Digər"])]},
    "Obyektiv":{models:{Canon:["RF 24-70mm f/2.8","RF 50mm f/1.8","RF 70-200mm f/2.8","EF 24-105mm f/4"],Nikon:["Z 24-70mm f/4","Z 50mm f/1.8"],Sony:["FE 24-70mm f/2.8 GM","FE 50mm f/1.8","FE 70-200mm f/2.8 GM"],Sigma:["24-70mm f/2.8 Art","35mm f/1.4 Art"],Tamron:["28-75mm f/2.8","70-180mm f/2.8"],Samyang:[],Viltrox:[]},fields:[{key:"lens_mount",label:"Uyğun kamera bağlantısı",placeholder:"Məsələn: Canon RF, Sony E"},{key:"focal_length",label:"Fokus məsafəsi",placeholder:"Məsələn: 24–70 mm"}]},
    "İşıq":{models:{Godox:["SL60W","SL150W","AD200","AD600","V1"],Aputure:["Amaran 100d","Amaran 200d","LS 300d","LS 600d"],Nanlite:["Forza 60","Forza 300"],Profoto:["A10","B10"],Neewer:[]},fields:[number("power_w","Güc (W)",1,100000)]},
    "Stabilizator / ştativ":{models:{DJI:["RS 3","RS 3 Mini","RS 4","RS 4 Pro","OM 6"],Zhiyun:["Crane 3S","Weebill 3","Smooth 5"],Manfrotto:["Befree","MT055","MT190"],Benro:[],Sirui:[]},fields:[number("max_load_kg","Maksimum daşıma çəkisi (kq)",0.1,100,"0.1")]},
    "Proyektor":{models:{Epson:["EB-X51","EB-W52","EH-TW750"],BenQ:["MW560","TH585","W1800"],XGIMI:["Halo+","Horizon","MoGo 2"],Optoma:[],ViewSonic:[],Xiaomi:[]},fields:[number("brightness_lumens","Parlaqlıq (lümen)",1,100000),choice("video_resolution","Görüntü keyfiyyəti",["HD","Full HD","4K","Digər"])]},
    "Digər":{models:{},fields:[]},
  }},
  camping: {label:"Turizm avadanlığının növü", kinds:{
    "Çadır":{models:{Quechua:["2 Seconds","MH100","Arpenaz"],Naturehike:["Cloud Up","Mongar","Star River"],Coleman:["Darwin","Galiano"],Husky:[],Vango:[],"The North Face":[],MSR:[],Tramp:[]},fields:[number("capacity","Neçə nəfərlikdir",1,100),choice("season","Mövsüm",["Yay","3 mövsüm","4 mövsüm"]),choice("waterproof","Suya davamlılıq",["Var","Yoxdur","Məlum deyil"])]},
    "Yataq kisəsi":{models:{Quechua:[],Naturehike:[],Husky:[],Deuter:[],Coleman:[],Tramp:[]},fields:[number("comfort_temp_c","Rahat istifadə temperaturu (°C)",-60,40),choice("clothing_size","Ölçü",["Uşaq","S","M","L","XL","Digər"])]},
    "Səyahət çantası":{models:{Deuter:["Aircontact","Futura"],Osprey:["Atmos","Aether","Farpoint"],Quechua:[],"The North Face":[],Gregory:[],Tatonka:[]},fields:[number("volume_l","Həcm (litr)",1,200)]},
    "Düşərgə mebeli":{models:{Quechua:[],Naturehike:[],Coleman:[],Helinox:[],Tramp:[]},fields:[number("quantity","Dəstdə neçə ədəd var",1,1000)]},
    "Digər":{models:{},fields:[]},
  }},
  equipment: {label:"Alətin / texnikanın növü", kinds:{
    "Drel / şurupburğan":{models:{Bosch:["GSB 18V-50","GSR 180-LI","GSR 12V-15"],Makita:["DDF482","DHP482","DF333D","HP1630"],DeWalt:["DCD777","DCD791","DCD796"],Milwaukee:["M12 FPD","M18 FPD"],Metabo:["BS 18","SB 18"],Einhell:[],Ryobi:[],Ingco:[],Total:[]},fields:toolFields},
    "Perforator":{models:{Bosch:["GBH 2-26","GBH 2-28","GBH 5-40"],Makita:["HR2470","HR2630","HR4013C","DHR243"],Hilti:["TE 30","TE 6-A22","TE 70"],DeWalt:["D25133","DCH273"],Metabo:["KHE 2660"],Ingco:[],Total:[]},fields:toolFields},
    "Qaynaq aparatı":{models:{Jasic:[],Resanta:[],Telwin:[],Fubag:[],Lincoln:[],ESAB:[],Ingco:[],Total:[]},fields:[power,number("welding_current_a","Maksimum qaynaq cərəyanı (A)",1,1000)]},
    "Kəsici / laqonda":{models:{Bosch:["GWS 750","GWS 9-125","GKS 190"],Makita:["GA5030","GA9020","9558HN"],DeWalt:["DWE4157","DWE4233"],Metabo:["W 750-125","WEV 15-125"],Hitachi:[],Ingco:[],Total:[]},fields:[...toolFields,number("disc_diameter_mm","Disk diametri (mm)",1,1000)]},
    "Generator":{models:{Honda:["EU22i","EU30is","EG5500"],Hyundai:["HHY 3000F","HHY 7000FE"],Yamaha:["EF2000iS","EF6300iSE"],Champion:[],Fubag:[],Huter:[],Ingco:[],Total:[]},fields:[power,number("power_kw","Güc (kW)",0.1,1000,"0.1")]},
    "Təmizlik avadanlığı":{models:{Kärcher:["K 2","K 4","K 5","K 7","Puzzi 10/1","SE 4001","WD 3","WD 5"],Nilfisk:["C 120","Core 140"],Bosch:["AdvancedAquatak"],Thomas:[],Numatic:[]},fields:[power,number("tank_l","Çən tutumu (litr)",0.1,1000,"0.1")]},
    "Bağ avadanlığı":{models:{Stihl:["FS 55","FS 131","MS 180","MS 250","RE 98"],Husqvarna:["120 Mark II","135 Mark II","LC 140"],Makita:["DUC254","DUR181"],Bosch:[],Champion:[],Patriot:[]},fields:toolFields},
  }},
  event: {label:"Tədbir üçün nə təklif edirsən?",kinds:{
    "Səs və işıq":{models:{JBL:["EON 712","EON 715","PartyBox 310","PartyBox 710","PRX 815"],Yamaha:["DBR12","DXR12","MG10XU","Stagepas 1K"],Bose:["L1 Pro","S1 Pro"],RCF:["ART 712","ART 745"],"Electro-Voice":["EKX","ZLX"],Pioneer:["DDJ-FLX4","XDJ-RX3","CDJ-3000"],Behringer:["X32","XR18"],Shure:["SM58","BLX","SLX-D"],Godox:[]},fields:[number("capacity","Neçə nəfər üçün uyğundur",1,100000),number("power_w","Güc (W)",1,100000)]},
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
