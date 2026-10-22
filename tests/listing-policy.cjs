const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const exports_ = {};
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("lib/listing-policy.ts", "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
  { exports: exports_, require: () => ({ supabase: null }), Intl, Date },
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
