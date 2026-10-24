const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  ts = require("typescript");
function load(path, modules = {}) {
  const e = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    { exports: e, require: (p) => modules[p], Number, Date },
  );
  return e;
}
const { applyCatalogFilters, PAGE_SIZE } = load("lib/catalog.ts", {
  "./supabase": { supabase: null },
  "./search-query": load("lib/search-query.ts"),
  "./rental-details": load("lib/rental-details.ts"),
});
const { authErrorMessage, safeLoginDestination } = load("lib/auth-messages.ts");
let checks = 0;
function test(name, fn) {
  fn();
  checks++;
  console.log("PASS", name);
}
const defaults = {
  category: "",
  city: "",
  period: "",
  query: "",
  min: "",
  max: "",
  sort: "new",
  page: 1,
  rooms: "",
  area: "",
  brand: "",
  gearbox: "",
  noDeposit: false,
  from: "",
  until: "",
  favorites: null,
};
function calls(input) {
  const log = [];
  const builder = new Proxy(
    {},
    {
      get:
        (_, method) =>
        (...args) => {
          log.push([method, ...args]);
          return builder;
        },
    },
  );
  applyCatalogFilters(builder, { ...defaults, ...input });
  return log;
}
test("public search always restricts results to published listings", () =>
  assert.ok(
    calls({}).some(
      (c) => c[0] === "eq" && c[1] === "status" && c[2] === "published",
    ),
  ));
test("page 20 reaches listings beyond the old 200-result limit", () => {
  const r = calls({ page: 20 }).find((c) => c[0] === "range");
  assert.equal(r[1], 19 * PAGE_SIZE);
  assert.equal(r[2], 20 * PAGE_SIZE - 1);
});
test("sorting uses deterministic price, timestamp and id order", () => {
  const r = calls({ sort: "low" }).filter((c) => c[0] === "order");
  assert.equal(r[0][1], "price");
  assert.equal(r[0][2].ascending, true);
  assert.equal(r[2][1], "id");
});
test("invalid numeric strings cannot enter numeric filters", () =>
  assert.equal(
    calls({ min: "NaN", max: "-3" }).filter((c) => c[1] === "price").length,
    0,
  ));
test("search punctuation cannot become new PostgREST predicates", () => {
  const r = calls({ query: "x),status.eq.draft,(title" }).find(
    (c) => c[0] === "or",
  );
  assert.equal(r[1].split(",").length, 3);
  assert.ok(!r[1].includes("status.eq."));
});
test("favorites scope sent to the database", () => {
  const r = calls({ favorites: ["test-id"] }).find((c) => c[0] === "in");
  assert.equal(r[1], "id");
  assert.equal(r[2][0], "test-id");
});
test("car search ignores stale property filters", () => {
  const log = calls({
    category: "car",
    rooms: "2",
    area: "80",
    brand: "Hyundai",
    gearbox: "Avtomat",
  });
  assert.ok(!log.some((c) => ["rooms", "area_m2"].includes(c[1])));
  assert.ok(log.some((c) => c[1] === "attributes->>brand"));
  assert.ok(log.some((c) => c[1] === "attributes->>gearbox"));
});
test("property search ignores stale vehicle filters", () => {
  const log = calls({
    category: "property",
    rooms: "2",
    area: "80",
    brand: "Hyundai",
    gearbox: "Avtomat",
  });
  assert.ok(log.some((c) => c[1] === "rooms"));
  assert.ok(log.some((c) => c[1] === "area_m2"));
  assert.ok(!log.some((c) => String(c[1]).startsWith("attributes->>")));
});
test("all categories ignores category-specific filters", () => {
  const log = calls({
    rooms: "2",
    area: "80",
    brand: "Hyundai",
    gearbox: "Avtomat",
    noDeposit: true,
  });
  assert.ok(
    !log.some((c) =>
      [
        "rooms",
        "area_m2",
        "attributes->>brand",
        "attributes->>gearbox",
      ].includes(c[1]),
    ),
  );
  assert.ok(log.some((c) => c[1] === "deposit"));
});
test("email confirmation errors offer a recovery action", () =>
  assert.match(authErrorMessage({ code: "email_not_confirmed" }), /təsdiq/));
test("incorrect credentials are distinguished from connectivity errors", () => {
  assert.match(
    authErrorMessage({ code: "invalid_credentials" }),
    /şifrə düzgün deyil/,
  );
  assert.match(authErrorMessage({ message: "Failed to fetch" }), /Bağlantı/);
});
test("login destinations cannot redirect to an external website", () => {
  assert.equal(safeLoginDestination("https://evil.example"), "/profile");
  assert.equal(safeLoginDestination("//evil.example"), "/profile");
  assert.equal(safeLoginDestination("/new"), "/new");
});
test("legacy numeric auth codes still produce useful login feedback", () =>
  assert.match(
    authErrorMessage({ code: 400, message: "Invalid login credentials" }),
    /şifrə düzgün deyil/,
  ));
console.log(`${checks} catalog and login checks passed`);
