// Simulated public catalog. No user accounts, messages, or live writes.
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3141";
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      let item = {
        id: "22222222-2222-4222-8222-222222222222",
        owner_id: "11111111-1111-4111-8111-111111111111",
        title: "Rahat və təchiz edilmiş kirayə mənzil",
        category: "property",
        city: "Bakı",
        price: 45,
        rental_period: "daily",
        description:
          "Mənzil tam təchiz edilmişdir, kirayə şərtlərini sahibi ilə dəqiqləşdirin.",
        images: ["/room.svg"],
        contact: "+994501234567",
        created_at: new Date().toISOString(),
        status: "published",
        min_days: 30,
        deposit: 30,
        attributes: { min_rental_value: "1", min_rental_unit: "month" },
      };
      const headers = {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "*",
        "access-control-allow-methods": "*",
        "access-control-expose-headers": "content-range",
        "content-range": "0-0/1",
      };
      await page.route("https://*.supabase.co/**", async (route) => {
        if (route.request().method() === "OPTIONS")
          return route.fulfill({ status: 204, headers });
        const body = route.request().url().includes("/rest/v1/listings")
          ? [item]
          : { external: { email: true, google: false } };
        return route.fulfill({
          status: 200,
          headers,
          contentType: "application/json",
          body: JSON.stringify(body),
        });
      });
      await page.goto(base);
      await page.locator(".quickView").click();
      const estimator = page.getByRole("region", {
        name: "Kirayə xərcini hesabla",
      });
      const amount = estimator.getByLabel("Kirayə müddəti", { exact: true });
      const unit = estimator.getByLabel("Hesablama müddətinin vahidi", {
        exact: true,
      });
      assert.equal(await amount.inputValue(), "1");
      assert.equal(await unit.inputValue(), "month");
      await unit.selectOption("day");
      await amount.fill("2");
      await estimator
        .getByText("Seçdiyin müddət bu elanın minimumundan qısadır.", {
          exact: false,
        })
        .waitFor();
      assert.equal(await estimator.locator(".estimateTotal").count(), 0);
      await estimator
        .getByRole("link", {
          name: "Seçilən müddəti sahibi ilə dəqiqləşdir",
          exact: true,
        })
        .waitFor();
      await estimator
        .getByLabel("Götürmə tarixi", { exact: true })
        .fill("2030-04-01");
      await unit.selectOption("month");
      await amount.fill("1");
      await estimator
        .getByText("Qaytarma: 01.05.2030", { exact: true })
        .waitFor();
      assert.equal(
        (await estimator.locator(".estimateTotal dd").innerText()).replace(
          /\D/g,
          "",
        ),
        "1380",
      );
      assert((await estimator.innerText()).includes("faktiki gün sayı"));
      item = { ...item, rental_period: "monthly", price: 600 };
      await page.goto(base);
      await page.locator(".quickView").click();
      await unit.selectOption("day");
      await amount.fill("2");
      await estimator
        .getByText("Bu elanda yalnız aylıq qiymət göstərilib.", {
          exact: false,
        })
        .waitFor();
      assert.equal(await estimator.locator(".estimateTotal").count(), 0);
      await unit.selectOption("month");
      await amount.fill("2");
      assert.equal(
        (await estimator.locator(".estimateTotal dd").innerText()).replace(
          /\D/g,
          "",
        ),
        "1230",
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      assert.deepEqual(errors, []);
      console.log(
        "PASS",
        width,
        "custom day/month durations, owner minimum and honest daily/monthly pricing",
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
