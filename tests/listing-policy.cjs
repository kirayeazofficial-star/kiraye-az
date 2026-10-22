const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const exports_ = {};
let testClient = null;
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("lib/listing-policy.ts", "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
  { exports: exports_, require: () => ({ get supabase() { return testClient; } }), Intl, Date },
);
const {
  listingMonthWindow,
  listingPolicyError,
  monthlyListingLimitMessage,
  duplicateListingMessage,
} = exports_;
const january = listingMonthWindow(new Date("2026-12-31T20:00:00Z"));
assert.equal(january.start, "2026-12-31T20:00:00.000Z");
assert.equal(january.end, "2027-01-31T20:00:00.000Z");
const december = listingMonthWindow(new Date("2026-12-31T19:59:59Z"));
assert.equal(december.start, "2026-11-30T20:00:00.000Z");
assert.equal(december.end, january.start);
assert.equal(listingPolicyError({ code: "PML01" }), monthlyListingLimitMessage);
assert.equal(listingPolicyError({ code: "PDU01" }), duplicateListingMessage);
assert.equal(
  listingPolicyError({ message: "MONTHLY_LISTING_LIMIT" }),
  monthlyListingLimitMessage,
);
assert(
  !listingPolicyError({ message: "private internal database detail" }).includes(
    "private",
  ),
);
console.log(
  "PASS Baku month/year rollover boundaries and actionable database errors",
);

(async () => {
  testClient = { rpc: async (name, args) => {
    assert.equal(name, "has_category_listing_allowance");
    return { data: args.p_category !== "property", error: null };
  } };
  await exports_.checkMonthlyListingLimit("owner", "car");
  await assert.rejects(exports_.checkMonthlyListingLimit("owner", "property"), error => error.message === monthlyListingLimitMessage);
  testClient = { rpc: async () => ({data: true,error:null}) };
  await exports_.checkMonthlyListingLimit("admin", "property");
  testClient = { rpc: async () => ({data:null,error:{code:"FETCH_ERROR"}}) };
  await assert.rejects(exports_.checkMonthlyListingLimit("owner", "property"), /yoxlamaq mümkün olmadı/);
  const filters = [];
  let role = "user";
  testClient = {
    rpc: async () => ({data:null,error:{code:"PGRST202"}}),
    from: (table) => {
      const query = { select: () => query, eq: (key,value) => { filters.push([key,value]); return query; },
        gte: () => query, lt: async () => ({count:0,error:null}),
        maybeSingle: async () => ({data:{role},error:null}) };
      return query;
    }
  };
  await exports_.checkMonthlyListingLimit("owner", "car");
  assert(filters.some(([key,value])=>key === "category" && value === "car"));
  assert(filters.some(([key,value])=>key === "status" && value === "published"));
  role = "admin"; filters.length = 0;
  await exports_.checkMonthlyListingLimit("admin", "property");
  assert(!filters.some(([key]) => key === "status"));
  console.log("PASS category allowance, admin exemption, unavailable checks and legacy published-only fallback");
})().catch(error => { console.error(error); process.exitCode=1; });
