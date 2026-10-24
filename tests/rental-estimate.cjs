const assert = require("node:assert/strict");
const fs = require("node:fs"),
  vm = require("node:vm"),
  ts = require("typescript");
const exported = {};
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("lib/rental-estimate.ts", "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
  { exports: exported, Date },
);
const { calculateRental: quote } = exported;
const item = {
  price: 19.99,
  rental_period: "daily",
  deposit: 50,
  min_days: 1,
  attributes: { delivery_method: "Hər ikisi", delivery_fee: "7.50" },
};
const request = {
  start: "2026-10-22",
  end: "2026-10-25",
  months: 1,
  delivery: false,
};
let count = 0;
const check = (name, fn) => {
  fn();
  count++;
  console.log("PASS", name);
};
check(
  "daily return date is exclusive and cents do not accumulate floating point errors",
  () => {
    const result = quote(item, request);
    assert.equal(result.error, null);
    assert.equal(result.units, 3);
    assert.equal(result.rental, 59.97);
    assert.equal(result.deposit, 50);
    assert.equal(result.total, 109.97);
  },
);
check("fixed delivery is charged only when selected", () => {
  assert.equal(quote(item, request).delivery, 0);
  const result = quote(item, { ...request, delivery: true });
  assert.equal(result.delivery, 7.5);
  assert.equal(result.total, 117.47);
});
check(
  "unknown delivery fee is never represented as a known free service",
  () => {
    for (const attributes of [
      { delivery_method: "Çatdırılma" },
      { delivery_method: "Hər ikisi", delivery_fee: "" },
    ]) {
      const result = quote(
        { ...item, attributes },
        { ...request, delivery: true },
      );
      assert.equal(result.delivery, null);
      assert.equal(result.total, 109.97);
    }
  },
);
check(
  "delivery-only handover includes its charge without an optional checkbox",
  () => {
    const result = quote(
      {
        ...item,
        attributes: { delivery_method: "Çatdırılma", delivery_fee: "7.50" },
      },
      request,
    );
    assert.equal(result.delivery, 7.5);
    assert.equal(result.total, 117.47);
  },
);
check("explicit zero delivery fee remains free", () =>
  assert.equal(
    quote(
      {
        ...item,
        attributes: { delivery_method: "Çatdırılma", delivery_fee: "0" },
      },
      { ...request, delivery: true },
    ).delivery,
    0,
  ),
);
check("unoffered delivery is rejected", () =>
  assert(
    quote({ ...item, attributes: {} }, { ...request, delivery: true }).error,
  ),
);
check("minimum rental days and owner availability are enforced", () => {
  assert(quote({ ...item, min_days: 4 }, request).error);
  assert(quote({ ...item, available_from: "2026-10-23" }, request).error);
  assert(quote({ ...item, available_until: "2026-10-24" }, request).error);
  assert.equal(
    quote(
      { ...item, available_from: "2026-10-22", available_until: "2026-10-25" },
      request,
    ).error,
    null,
  );
});
check("invalid, reversed and past dates are rejected", () => {
  assert(quote(item, { ...request, start: "2026-02-30" }).error);
  assert(quote(item, { ...request, end: request.start }).error);
  assert(quote(item, request, "2026-10-23").error);
});
check(
  "calendar months clamp to February rather than overflowing into March",
  () => {
    const result = quote(
      { ...item, price: 400, rental_period: "monthly" },
      { ...request, start: "2026-01-31" },
    );
    assert.equal(result.error, null);
    assert.equal(result.end, "2026-02-28");
    assert.equal(result.rental, 400);
    assert.equal(result.total, 450);
  },
);
check("leap years and multi-month periods retain calendar pricing", () => {
  const monthly = { ...item, price: 400, rental_period: "monthly" };
  assert.equal(
    quote(monthly, { ...request, start: "2024-01-31" }).end,
    "2024-02-29",
  );
  const result = quote(monthly, { ...request, start: "2026-01-31", months: 3 });
  assert.equal(result.end, "2026-04-30");
  assert.equal(result.rental, 1200);
});
check("invalid month counts and corrupted prices are rejected", () => {
  for (const months of [0, 1.5, 121, NaN])
    assert(
      quote({ ...item, rental_period: "monthly" }, { ...request, months })
        .error,
    );
  for (const price of [-1, NaN, Infinity])
    assert(quote({ ...item, price }, request).error);
  assert(quote({ ...item, deposit: -1 }, request).error);
});

check(
  "month minimum respects February rather than treating every month as thirty days",
  () => {
    const monthly = {
      ...item,
      rental_period: "monthly",
      min_days: 30,
      attributes: { min_rental_value: "1", min_rental_unit: "month" },
    };
    const result = quote(monthly, {
      ...request,
      start: "2027-01-31",
      months: 1,
    });
    assert.equal(result.error, null);
    assert.equal(result.end, "2027-02-28");
    assert.equal(
      quote(
        { ...monthly, rental_period: "daily" },
        { ...request, start: "2027-01-31", end: "2027-02-27" },
      ).error !== null,
      true,
    );
  },
);
check("year minimum preserves leap-year calendar boundaries", () => {
  const yearly = {
    ...item,
    min_days: 365,
    attributes: { min_rental_value: "1", min_rental_unit: "year" },
  };
  assert.equal(
    quote(yearly, { ...request, start: "2028-02-29", end: "2029-02-28" }).error,
    null,
  );
});

console.log(`${count} rental estimate checks passed`);

check("weekly price uses complete seven-day units and adds delivery once",()=>{
 const weekly={...item,rental_period:'weekly',price:100};
 const result=quote(weekly,{...request,end:'2026-11-05',delivery:true});
 assert.equal(result.error,null);assert.equal(result.units,2);assert.equal(result.rental,200);assert.equal(result.total,257.5);
 assert(quote(weekly,{...request,end:'2026-10-25'}).error.includes('tam həftə'));
});
