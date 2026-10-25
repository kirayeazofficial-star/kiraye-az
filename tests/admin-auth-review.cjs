const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  ts = require("typescript");
function load(file) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    { exports },
  );
  return exports;
}
const { adminListingQuery } = load("lib/admin-catalog.ts");
const { rateLimitSeconds } = load("lib/auth-throttle.ts");
let checks = 0;
function test(name, fn) {
  fn();
  checks++;
  console.log("PASS", name);
}
function builder() {
  const calls = [];
  const result = { calls };
  for (const key of ["eq", "in", "or", "gte", "lte", "order", "range"])
    result[key] = (...args) => {
      calls.push([key, ...args]);
      return result;
    };
  return result;
}
test("moderation applies status and pagination in the database beyond the old 200-item cutoff", () => {
  const q = builder();
  adminListingQuery(q, "pending", "", 20);
  assert.deepEqual(
    q.calls.find((x) => x[0] === "range"),
    ["range", 456, 479],
  );
  assert.deepEqual(q.calls[0], ["eq", "status", "pending"]);
});
test("admin sorting is stable across pages", () => {
  const q = builder();
  adminListingQuery(q, "", "", "1");
  assert.deepEqual(
    q.calls.filter((x) => x[0] === "order").map((x) => x[1]),
    ["created_at", "id"],
  );
  assert.deepEqual(q.calls.at(-1), ["range", 0, 23]);
});
test("admin search handles listing UUIDs directly", () => {
  const q = builder(),
    id = "11111111-1111-4111-8111-111111111111";
  adminListingQuery(q, "", id, 1);
  assert.deepEqual(q.calls[0], ["eq", "id", id]);
});
test("search punctuation cannot add new PostgREST predicates", () => {
  const q = builder();
  adminListingQuery(q, "", "hello),status.eq.published%", 1);
  const expr = q.calls.find((x) => x[0] === "or")[1];
  assert(!expr.includes("status.eq"));
  assert.equal(expr.split(",").length, 2);
});
test("rate-limit interval follows structured API retry guidance", () =>
  assert.equal(
    rateLimitSeconds({
      status: 429,
      message: "Please try again after 95 seconds",
    }),
    95,
  ));
test("fallback throttling supports codes and bounds invalid intervals", () => {
  assert.equal(rateLimitSeconds({ code: "over_email_send_rate_limit" }), 60);
  assert.equal(
    rateLimitSeconds({ status: 429, message: "after 99999 seconds" }),
    3600,
  );
  assert.equal(rateLimitSeconds({ status: 400 }), null);
});
console.log(`${checks} admin/auth query checks passed`);

test("archived admin tab includes expired listings and numeric IDs retain phone lookup", () => {
 const q=builder();adminListingQuery(q,'archived','10000001',1,{from:'2026-10-01',until:'2026-10-25',kind:'edited'});
 assert.equal(q.calls.find(c=>c[0]==='in')[2].join(','),'archived,expired');
 assert(q.calls.some(c=>c[0]==='or'&&c[1].includes('listing_no.eq.10000001')));
 assert(q.calls.some(c=>c[0]==='eq'&&c[1]==='review_kind'&&c[2]==='edited'));
 assert(q.calls.some(c=>c[0]==='gte'&&c[2]==='2026-10-01T00:00:00+04:00'));
});
