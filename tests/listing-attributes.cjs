const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const exported = {};
const specExports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync("lib/rental-category-specs.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: specExports });
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("lib/listing-attributes.ts", "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
  { exports: exported, FormData, require: () => specExports },
);
const { readListingAttributes: read, validateListingAttributes: validate } =
  exported;
const base = {
  brand: "Toyota",
  model: "Corolla",
  color: "Ağ",
  fuel: "Benzin",
  engine_cc: "1600",
  gearbox: "Avtomat",
  body_type: "Sedan",
  drivetrain: "Ön",
  year: "2022",
  is_new: "İşlənmiş",
  mileage_km: "85000",
};
const form = (values) => {
  const result = new FormData();
  for (const [key, value] of Object.entries(values)) result.set(key, value);
  return result;
};
const check = (name, fn) => {
  fn();
  console.log("PASS", name);
};
check("complete car specifications are accepted", () =>
  assert.equal(validate("car", read("car", form(base))), null),
);
check("incomplete car specifications are rejected", () =>
  assert(validate("car", read("car", form({ ...base, body_type: "" })))),
);
check("invalid mileage is rejected", () => {
  for (const value of ["-1", "1.5", "NaN", "Infinity"])
    assert(validate("car", read("car", form({ ...base, mileage_km: value }))));
});
check("electric vehicle drops combustion engine information", () => {
  const data = read("car", form({ ...base, fuel: "Elektrik" }));
  assert.equal(data.engine_cc, undefined);
  assert.equal(validate("car", data), null);
});
check("new car must have zero mileage", () =>
  assert(validate("car", read("car", form({ ...base, is_new: "Yeni" })))),
);
check("bicycle payload drops car fields and retains its own dimensions", () => {
  const data = read(
    "bicycle",
    form({
      ...base,
      brand: "Trek",
      model: "Marlin",
      wheel_size: "29 düym",
      kind: "Dağ",
    }),
  );
  assert.equal(data.gearbox, undefined);
  assert.equal(data.year, undefined);
  assert.equal(data.engine_cc, undefined);
  assert.equal(data.wheel_size, "29 düym");
  assert.equal(validate("bicycle", data), null);
});
check("non-apartment property drops hidden floor details", () => {
  const data = read(
    "property",
    form({ kind: "Həyət evi", floor: "7", total_floors: "3" }),
  );
  assert.equal(data.floor, undefined);
  assert.equal(data.total_floors, undefined);
});
check("apartment floor cannot exceed building height", () =>
  assert(
    validate(
      "property",
      read("property", form({ kind: "Mənzil", floor: "7", total_floors: "3" })),
    ),
  ),
);
check("public attributes never include email or account secrets", () => {
  const data = read(
    "car",
    form({
      ...base,
      email: "private@example.invalid",
      password: "test-only",
      contact_name: "Owner",
    }),
  );
  assert.equal(data.email, undefined);
  assert.equal(data.password, undefined);
  assert.equal(data.contact_name, "Owner");
});
check(
  "delivery fee follows delivery selection and rejects negative charges",
  () => {
    assert.equal(
      read(
        "equipment",
        form({ delivery_method: "Özün götür", delivery_fee: "20" }),
      ).delivery_fee,
      undefined,
    );
    assert(
      validate(
        "equipment",
        read(
          "equipment",
          form({ delivery_method: "Çatdırılma", delivery_fee: "-1" }),
        ),
      ),
    );
  },
);
check("rental requirements stay in the relevant category", () => {
  const car = read(
    "car",
    form({
      ...base,
      min_driver_age: "25",
      license_years: "2",
      included_km_day: "200",
      return_terms: "Written terms",
    }),
  );
  assert.equal(car.min_driver_age, "25");
  assert.equal(validate("car", car), null);
  const bicycle = read(
    "bicycle",
    form({
      brand: "Trek",
      model: "Marlin",
      min_driver_age: "25",
      utilities: "Qiymətə daxildir",
      included_items: "Helmet",
      return_terms: "Return clean",
    }),
  );
  assert.equal(bicycle.min_driver_age, undefined);
  assert.equal(bicycle.utilities, undefined);
  assert.equal(bicycle.included_items, "Helmet");
});
console.log("11 listing specification checks passed");

check("electric vehicles keep charging specs without car or clothing fields", () => {
  const data=read("electric",form({kind:"Elektrik skuter",brand:"Xiaomi",model:"Electric Scooter 4",range_km:"35",charge_hours:"4.5",engine_cc:"1600",clothing_size:"M"}));
  assert.equal(data.range_km,"35"); assert.equal(data.charge_hours,"4.5");
  assert.equal(data.engine_cc,undefined);assert.equal(data.clothing_size,undefined);
  assert.equal(validate("electric",data),null);
  assert(validate("electric",{...data,range_km:"-1"}));
});
check("tool specifications follow the selected kind and energy source", () => {
  const drill=read("equipment",form({kind:"Drel / şurupburğan",brand:"Makita",power_source:"Şəbəkə / kabel",battery_voltage:"18",welding_current_a:"200"}));
  assert.equal(drill.battery_voltage,undefined);assert.equal(drill.welding_current_a,undefined);
  const welder=read("equipment",form({kind:"Qaynaq aparatı",welding_current_a:"200",power_w:"900"}));
  assert.equal(welder.welding_current_a,"200");assert.equal(welder.power_w,undefined);
  assert(validate("equipment",{...welder,welding_current_a:"200.5"}));
});
check("clothing sizes and cleaning survive save without invented technical data", () => {
 const data=read("clothing",form({kind:"Kostyum",clothing_size:"50",cleaning_terms:"Qiymətə daxildir",battery_wh:"500",size_note:"Boy 175 sm"}));
 assert.equal(data.clothing_size,"50");assert.equal(data.size_note,"Boy 175 sm");assert.equal(data.battery_wh,undefined);assert.equal(validate("clothing",data),null);
 assert(validate("clothing",{...data,clothing_size:"999"}));
});
check("camera, lens and camping fields are scoped to the kind", () => {
 const lens=read("photo",form({kind:"Obyektiv",lens_mount:"Sony E",focal_length:"24–70 mm",resolution_mp:"24"}));
 assert.equal(lens.lens_mount,"Sony E");assert.equal(lens.resolution_mp,undefined);
 const tent=read("camping",form({kind:"Çadır",capacity:"3",season:"3 mövsüm",comfort_temp_c:"-10"}));
 assert.equal(tent.capacity,"3");assert.equal(tent.comfort_temp_c,undefined);assert.equal(validate("camping",tent),null);
 assert(validate("camping",{...tent,capacity:"2.5"}));
 assert(validate("electric",{kind:"Kostyum"}));
});

check("driver service is optional and belongs only to car listings", () => {
  assert.equal(read("car", form(base)).driver_service, undefined);
  for (const service of ["Sürücüsüz", "Sürücülü", "Hər iki variant"]) {
    assert.equal(read("car", form({ ...base, driver_service: service })).driver_service, service);
    assert.equal(read("clothing", form({ kind: "Aksesuar", driver_service: service })).driver_service, undefined);
  }
});

check("motorcycle saves new/used and precise color without obsolete condition", () => {
  const saved = read("motorcycle", form({brand:"Harley-Davidson",model:"Sportster",color:"Tünd qırmızı",is_new:"İşlənmiş",condition:"Əla"}));
  assert.equal(saved.is_new, "İşlənmiş");
  assert.equal(saved.color, "Tünd qırmızı");
  assert.equal(saved.condition, undefined);
});
