const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const valid = {
  NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_config",
  NEXT_PUBLIC_SITE_URL: "https://kiraye.az",
};
let count = 0;
function check(name, override, status) {
  const result = spawnSync(process.execPath, ["scripts/check-public-env.mjs"], {
    env: { PATH: process.env.PATH, ...valid, ...override },
    encoding: "utf8",
  });
  assert.equal(result.status, status, result.stderr);
  count++;
  console.log("PASS", name);
}
check("valid custom domain and browser key accepted", {}, 0);
check(
  "missing browser key rejected",
  { NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "" },
  1,
);
check(
  "service role cannot be shipped into a browser variable",
  {
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.signature`,
  },
  1,
);
check(
  "anon JWT remains supported",
  {
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role: "anon" })).toString("base64url")}.signature`,
  },
  0,
);
check(
  "insecure website origin rejected",
  { NEXT_PUBLIC_SITE_URL: "http://kiraye.az" },
  1,
);
check(
  "credentials in the website URL rejected",
  { NEXT_PUBLIC_SITE_URL: "https://user:pass@kiraye.az" },
  1,
);
check(
  "path in the website origin rejected",
  { NEXT_PUBLIC_SITE_URL: "https://kiraye.az/another-path" },
  1,
);
check(
  "invalid Supabase URL rejected",
  { NEXT_PUBLIC_SUPABASE_URL: "https://invalid.example" },
  1,
);
console.log(`${count} deployment checks passed`);
