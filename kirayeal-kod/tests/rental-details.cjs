const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const output = ts.transpileModule(
  fs.readFileSync("lib/rental-details.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  },
).outputText;
const e = {};
vm.runInNewContext(output, { exports: e, Date, Number });
let checks = 0;
function test(name, fn) {
  fn();
  checks++;
  console.log("PASS", name);
}
const defaults = {
  deposit: 0,
  min_days: 1,
  available_from: null,
  available_until: null,
};
const filters = {
  rooms: "",
  area: "",
  brand: "",
  gearbox: "",
  noDeposit: false,
  from: "",
  until: "",
};
test("local and international phones normalize to one WhatsApp address", () => {
  for (const input of [
    "050 123 45 67",
    "+994 50 123 45 67",
    "00994 50 123 45 67",
  ])
    assert.equal(e.normalizePhone(input), "+994501234567");
  assert.equal(e.normalizePhone("abc"), null);
});
test("valid rental terms accepted", () =>
  assert.equal(e.validateRentalDetails(defaults), null));
test("negative deposit rejected", () =>
  assert.ok(e.validateRentalDetails({ ...defaults, deposit: -1 })));
test("fractional minimum days rejected", () =>
  assert.ok(e.validateRentalDetails({ ...defaults, min_days: 1.5 })));
test("inverted availability dates rejected", () =>
  assert.ok(
    e.validateRentalDetails({
      ...defaults,
      available_from: "2026-12-20",
      available_until: "2026-12-10",
    }),
  ));
test("impossible calendar date rejected", () =>
  assert.ok(
    e.validateRentalDetails({ ...defaults, available_from: "2026-02-30" }),
  ));
test("exact room counts and four-plus counts filter independently", () => {
  assert.equal(
    e.matchesRentalFilters({ rooms: 2 }, { ...filters, rooms: "2" }),
    true,
  );
  assert.equal(
    e.matchesRentalFilters({ rooms: 3 }, { ...filters, rooms: "2" }),
    false,
  );
  assert.equal(
    e.matchesRentalFilters({ rooms: 5 }, { ...filters, rooms: "4+" }),
    true,
  );
});
test("minimum area excludes smaller and missing sizes", () => {
  assert.equal(
    e.matchesRentalFilters({ area_m2: 40 }, { ...filters, area: "50" }),
    false,
  );
  assert.equal(e.matchesRentalFilters({}, { ...filters, area: "50" }), false);
});
test("brand search is case-insensitive", () =>
  assert.equal(
    e.matchesRentalFilters(
      { attributes: { brand: "Hyundai" } },
      { ...filters, brand: "HYUNDAI" },
    ),
    true,
  ));
test("gearbox and deposit filters work", () => {
  assert.equal(
    e.matchesRentalFilters(
      { attributes: { gearbox: "Mexaniki" } },
      { ...filters, gearbox: "Avtomat" },
    ),
    false,
  );
  assert.equal(
    e.matchesRentalFilters({ deposit: 100 }, { ...filters, noDeposit: true }),
    false,
  );
});
test("dates outside stated availability excluded", () =>
  assert.equal(
    e.matchesRentalFilters(
      { available_from: "2026-11-20" },
      { ...filters, from: "2026-11-10" },
    ),
    false,
  ));
test("requested rental honors minimum duration", () =>
  assert.equal(
    e.matchesRentalFilters(
      { min_days: 5 },
      { ...filters, from: "2026-11-10", until: "2026-11-12" },
    ),
    false,
  ));
console.log(`${checks} rental validation checks passed`);
