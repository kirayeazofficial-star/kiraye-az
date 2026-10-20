const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  ts = require("typescript");
const exported = {},
  window = {
    location: { href: "https://kiraye.az/auth/callback#type=recovery" },
  };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("lib/auth-return.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { exports: exported, window, URL, setTimeout, clearTimeout },
);
(async () => {
  window.location.href = "https://kiraye.az/auth/callback";
  assert.equal(
    exported.authReturnHref(window.location.href),
    "https://kiraye.az/auth/callback#type=recovery",
  );
  console.log(
    "PASS callback retains recovery type after the SDK consumes the hash",
  );
  assert.equal(
    exported.authReturnHref("https://kiraye.az/reset-password"),
    "https://kiraye.az/reset-password",
  );
  console.log(
    "PASS navigation to a new route does not reuse a stale callback URL",
  );
  assert.equal(
    await exported.finishWithin(Promise.resolve("complete"), 50),
    "complete",
  );
  console.log("PASS successful auth settles before the deadline");
  await assert.rejects(
    exported.finishWithin(new Promise(() => {}), 5),
    /Bağlantı gecikir/,
  );
  console.log(
    "PASS stalled auth cannot leave the callback spinner running forever",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
