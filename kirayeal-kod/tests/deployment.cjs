const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
let count = 0;
function check(name, siteUrl, status) {
  const result = spawnSync(process.execPath, ["scripts/check-public-env.mjs"], {
    env: { PATH: process.env.PATH, NEXT_PUBLIC_SITE_URL: siteUrl },
    encoding: "utf8",
  });
  assert.equal(result.status, status, result.stderr);
  count++;
  console.log("PASS", name);
}
check("valid https origin accepted", "https://kirayeal.az", 0);
check("missing origin rejected", "", 1);
check("insecure origin rejected", "http://kirayeal.az", 1);
check("credentials rejected", "https://user:pass@kirayeal.az", 1);
check("path rejected", "https://kirayeal.az/another-path", 1);
console.log(`${count} deployment checks passed`);
