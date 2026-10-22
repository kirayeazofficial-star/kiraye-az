const assert = require("node:assert/strict");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3013";
  try {
    for (const width of [320, 390, 1440]) {
      const context = await browser.newContext({
        javaScriptEnabled: false,
        viewport: { width, height: 900 },
      });
      const page = await context.newPage();
      await page.goto(`${base}/login?next=/new`);
      await page
        .getByRole("link", {
          name: "Hesabın yoxdur? Qeydiyyatdan keç",
          exact: true,
        })
        .click();
      await page
        .getByRole("heading", { name: "Hesab yarat", exact: true })
        .waitFor();
      assert.equal(new URL(page.url()).searchParams.get("next"), "/new");
      assert.equal(
        await page
          .getByLabel("E-poçt", { exact: true })
          .getAttribute("placeholder"),
        "E-poçt ünvanını yaz",
      );
      await page
        .getByRole("link", { name: "Hesabın var? Daxil ol", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Hesaba giriş", exact: true })
        .waitFor();
      await page
        .getByRole("link", { name: "Şifrəni unutmusunuz?", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Şifrəni yenilə", exact: true })
        .waitFor();
      assert.equal(await page.getByLabel("Şifrə", { exact: true }).count(), 0);
      await page.goto(`${base}/login`);
      await page
        .getByText("Hazırda bu xidmət aktiv deyil.", { exact: true })
        .waitFor();
      assert.equal(
        await page
          .getByText("Google girişinin vəziyyəti yoxlanılır...")
          .count(),
        0,
      );
      console.log(
        "PASS",
        width,
        "server-rendered signup/reset links without JavaScript and stable Google notice",
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
