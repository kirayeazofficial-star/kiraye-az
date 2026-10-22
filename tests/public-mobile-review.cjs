// Browser regression checks with simulated API responses; no live writes or mail.
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3013";
  let count = 0;
  const errors = [];
  try {
    for (const width of [320, 390, 1440]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
      });
      const page = await context.newPage();
      page.on("pageerror", (error) => errors.push(error.message));
      const calls = [];
      let failCatalog = false;
      const item = {
        id: "22222222-2222-4222-8222-222222222222",
        owner_id: "11111111-1111-4111-8111-111111111111",
        title: "Toyota Corolla kirayəsi",
        category: "car",
        city: "Bakı",
        price: 55,
        rental_period: "daily",
        status: "published",
        description:
          "Rahat avtomobil, kirayə şərtləri birbaşa sahibi ilə dəqiqləşdirilir.",
        images: ["/car.svg"],
        contact: "+994501234567",
        created_at: new Date().toISOString(),
        min_days: 30,
        attributes: {
          mileage_km: "50000",
          min_rental_value: "1",
          min_rental_unit: "month",
        },
      };
      const cors = {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "*",
        "access-control-allow-methods": "*",
        "access-control-expose-headers": "content-range",
      };
      await page.route("https://*.supabase.co/**", async (route) => {
        const request = route.request();
        if (request.method() === "OPTIONS")
          return route.fulfill({ status: 204, headers: cors });
        calls.push({
          url: request.url(),
          authorization: request.headers().authorization,
        });
        if (request.url().includes("/rest/v1/listings") && failCatalog)
          return route.fulfill({
            status: 503,
            headers: cors,
            contentType: "application/json",
            body: JSON.stringify({ message: "test outage" }),
          });
        if (request.url().includes("/rest/v1/listings"))
          return route.fulfill({
            status: 200,
            headers: { ...cors, "content-range": "0-0/1" },
            contentType: "application/json",
            body: JSON.stringify([item]),
          });
        if (request.url().includes("/settings"))
          return route.fulfill({
            status: 200,
            headers: cors,
            contentType: "application/json",
            body: JSON.stringify({ external: { email: true, google: true } }),
          });
        return route.fulfill({
          status: 200,
          headers: cors,
          contentType: "application/json",
          body: "{}",
        });
      });
      await page.goto(base);
      await page.locator(".listingCard").waitFor();
      assert.equal(await page.locator(".listingCard").count(), 1);
      assert(
        calls.some(
          (call) =>
            call.url.includes("/rest/v1/listings") &&
            new URL(call.url).searchParams.get("status") === "eq.published",
        ),
      );
      assert(
        !calls.some((call) => /\/auth\/v1\/(user|token)/.test(call.url)),
        "guest browsing should not require login",
      );
      console.log("PASS", width, "guest public listing without login");
      count++;
      assert.equal(
        await page.getByLabel("Minimum qiymət", { exact: true }).count(),
        0,
      );
      await page
        .getByRole("button", { name: "Bütün kateqoriyalar →", exact: true })
        .click();
      assert.equal(await page.locator("#all-categories button").count(), 9);
      await page
        .locator("#all-categories")
        .getByRole("button", { name: "Avtomobil", exact: true })
        .click();
      assert.equal(
        await page.getByLabel("Filtr kateqoriyası").inputValue(),
        "car",
      );
      console.log("PASS", width, "all-category selector opens and selects");
      count++;
      await page.locator(".quickView").click();
      await page.getByRole("dialog").waitFor();
      assert((await page.getByRole("dialog").innerText()).includes("1 ay"));
      assert((await page.getByRole("dialog").innerText()).includes("50000"));
      await page.getByRole("button", { name: "Bağla", exact: true }).click();
      assert(
        (await page.locator(".photoOpen").getAttribute("href")) ===
          `/listings/${item.id}`,
      );
      console.log(
        "PASS",
        width,
        "guest details preserve mileage and minimum unit",
      );
      count++;
      if (width === 390) {
        failCatalog = true;
        await page
          .getByLabel("Şəhər", { exact: true })
          .selectOption("Sumqayıt");
        await page
          .getByText("Elanları yükləmək mümkün olmadı.", { exact: false })
          .waitFor();
        assert.equal(await page.locator(".skeleton").count(), 0);
        failCatalog = false;
        await page
          .getByRole("button", { name: "Yenidən yoxla", exact: true })
          .click();
        await page.locator(".listingCard").waitFor();
        console.log("PASS failed anonymous request exits loading and retries");
        count++;
      }
      for (const mode of ["signup", "reset"]) {
        await page.goto(`${base}/login?mode=${mode}`);
        await page
          .getByRole("heading", {
            name: mode === "signup" ? "Hesab yarat" : "Şifrəni yenilə",
            exact: true,
          })
          .waitFor();
        if (mode === "signup")
          await page
            .getByRole("button", { name: "Google ilə davam et", exact: true })
            .waitFor();
        assert(
          (await page.locator("body").evaluate((el) => el.scrollWidth)) <=
            width + 1,
        );
      }
      await page.goto(`${base}/login`);
      await page
        .getByRole("link", {
          name: "Hesabın yoxdur? Qeydiyyatdan keç",
          exact: true,
        })
        .click();
      await page
        .getByRole("heading", { name: "Hesab yarat", exact: true })
        .waitFor();
      await page
        .getByRole("link", { name: "Hesabın var? Daxil ol", exact: true })
        .click();
      await page
        .getByRole("link", { name: "Şifrəni unutmusunuz?", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Şifrəni yenilə", exact: true })
        .waitFor();
      console.log(
        "PASS",
        width,
        "registration, password recovery, Google signup controls",
      );
      count++;
      await context.close();
    }
    assert.deepEqual(errors, []);
    console.log(`${count} public/mobile regression checks passed`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
