// Delay every client chunk to reproduce slow/blocked mobile script loading.
// No real account, recovery message, or password request is sent.
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3013";
  try {
    for (const mode of ["login", "signup", "reset"]) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      let release;
      const paused = new Promise((resolve) => {
        release = resolve;
      });
      await page.route("**/_next/static/**/*.js", async (route) => {
        await paused;
        await route.continue();
      });
      await page.route("https://*.supabase.co/**", async (route) =>
        route.fulfill({
          status: 200,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-headers": "*",
            "access-control-allow-methods": "*",
          },
          contentType: "application/json",
          body: JSON.stringify({ external: { email: true, google: false } }),
        }),
      );
      await page.goto(`${base}/login?mode=${mode}`, { waitUntil: "commit" });
      const email = page.getByLabel("E-poçt", { exact: true });
      await email.waitFor();
      assert.equal(await email.isEnabled(), true);
      await email.tap();
      await email.fill("mobile-typing@example.invalid");
      assert.equal(await email.inputValue(), "mobile-typing@example.invalid");
      const submit = page.locator(".authSubmit").first();
      assert.equal(await submit.isDisabled(), true);
      release();
      await page.waitForLoadState("load");
      await page.waitForFunction(() => {
        const button = document.querySelector(".authFields .authSubmit");
        return button && !button.disabled;
      });
      assert.equal(await email.inputValue(), "mobile-typing@example.invalid");
      await email.fill("second-address@example.invalid");
      assert.equal(await email.inputValue(), "second-address@example.invalid");
      assert.deepEqual(errors, []);
      console.log(
        "PASS mobile",
        mode,
        "email editable before hydration and typed text retained afterwards",
      );
      await context.close();
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
