const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const exported = {};
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("lib/listing-attributes.ts", "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
  { exports: exported, FormData },
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
