const assert = require("node:assert/strict");
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH || "playwright",
);
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH }
      : {}),
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
  let checks = 0;
  async function check(name, fn) {
    await fn();
    checks++;
    console.log("PASS", name);
  }
  try {
    await page.goto(base);
    await page
      .getByText("Hazırda nümunə elanlara baxırsınız.", { exact: false })
      .waitFor();
    await check("six explicitly labeled sample listings", async () =>
      assert.equal(await page.locator(".listingCard").count(), 6),
    );
    await check("category filters", async () => {
      await page
        .getByRole("button", { name: "Ev və mənzil elanlarına bax" })
        .click();
      assert.equal(await page.locator(".listingCard").count(), 1);
      await page.getByRole("button", { name: "Filtrləri təmizlə" }).click();
    });
    await check("city and price filters", async () => {
      await page.getByLabel("Şəhər", { exact: true }).selectOption("Sumqayıt");
      assert.equal(await page.locator(".listingCard").count(), 1);
      await page.getByRole("button", { name: "Filtrləri təmizlə" }).click();
      await page.getByLabel("Maksimum qiymət").fill("40");
      assert.equal(await page.locator(".listingCard").count(), 2);
      await page.getByRole("button", { name: "Filtrləri təmizlə" }).click();
    });
    await check("text search and reset", async () => {
      await page.getByLabel("Elan axtar", { exact: true }).fill("Hyundai");
      assert.equal(await page.locator(".listingCard").count(), 1);
      await page
        .getByLabel("Elan axtar", { exact: true })
        .fill("no-such-result");
      await page.getByText("Uyğun elan tapılmadı").waitFor();
      await page.getByRole("button", { name: "Filtrləri təmizlə" }).click();
    });
    await check("price sorting", async () => {
      await page.getByLabel("Sıralama").selectOption("low");
      assert.match(
        await page.locator(".listingCard .price").first().innerText(),
        /^12/,
      );
    });
    await check(
      "detailed filters select property size and vehicle brand",
      async () => {
        await page
          .getByRole("button", { name: "Ətraflı filtrlər", exact: true })
          .click();
        await page.getByLabel("Otaq sayı", { exact: true }).selectOption("2");
        assert.equal(await page.locator(".listingCard").count(), 1);
        await page.getByRole("button", { name: "Filtrləri təmizlə" }).click();
        await page
          .getByLabel("Avtomobil markası", { exact: true })
          .fill("HYUNDAI");
        assert.equal(await page.locator(".listingCard").count(), 1);
        await page.getByRole("button", { name: "Filtrləri təmizlə" }).click();
      },
    );
    await check("favorites persist across reload", async () => {
      await page
        .locator(".listingCard")
        .first()
        .getByRole("button", { name: "Seçilmişlərə əlavə et", exact: true })
        .click();
      await page.reload();
      await page.getByRole("button", { name: "♡ Seçilmişlər (1)" }).click();
      assert.equal(await page.locator(".listingCard").count(), 1);
    });
    await check("detail modal, focus cycle and escape", async () => {
      await page.locator(".cardBody").first().click();
      await page.getByRole("dialog").waitFor();
      assert.match(
        await page.getByRole("dialog").innerText(),
        /Nümunə elandır/,
      );
      await page.keyboard.press("Tab");
      assert.equal(
        await page.evaluate(
          () => !!document.activeElement?.closest('[role="dialog"]'),
        ),
        true,
      );
      await page.getByRole("link", { name: "Ayrıca səhifədə aç →" }).focus();
      await page.keyboard.press("Tab");
      assert.equal(
        await page.evaluate(() =>
          document.activeElement?.getAttribute("aria-label"),
        ),
        "Bağla",
      );
      await page.keyboard.press("Escape");
      assert.equal(await page.getByRole("dialog").count(), 0);
    });
    await check("corrupt saved favorites do not crash", async () => {
      await page.evaluate(() =>
        localStorage.setItem("kiraye-favorites", "invalid"),
      );
      await page.reload();
      await page.getByRole("button", { name: "♡ Seçilmişlər (0)" }).waitFor();
    });
    await check("mobile page has no horizontal overflow", async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.reload();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        true,
      );
      await page.screenshot({ path: "/tmp/kiraye-mobile.png", fullPage: true });
    });
    await check("unconfigured profile exits loading state", async () => {
      await page.goto(`${base}/profile`);
      await page
        .getByRole("heading", { name: "Giriş xidməti hazırlanır" })
        .waitFor();
      assert.equal(
        await page.getByText("Yüklənir...", { exact: true }).count(),
        0,
      );
    });
    await check("unconfigured submission is blocked honestly", async () => {
      await page.goto(`${base}/new`);
      await page
        .getByText("Elan qəbulu hələ aktivləşdirilməyib.", { exact: false })
        .waitFor();
      assert.equal(await page.locator("form").count(), 0);
    });
    await check("admin rejects unauthenticated visitor", async () => {
      await page.goto(`${base}/admin`);
      await page
        .getByRole("heading", { name: "Bu bölmə yalnız idarəçilər üçündür" })
        .waitFor();
      assert.equal(
        await page.getByRole("button", { name: "Təsdiqlə və yayımla" }).count(),
        0,
      );
    });
    await check("login gives actionable unavailable state", async () => {
      await page.goto(`${base}/login`);
      await page.getByLabel("E-poçt", { exact: true }).fill("test@example.com");
      await page.getByLabel("Şifrə", { exact: true }).fill("long-password");
      await page
        .getByRole("button", { name: "Daxil ol →", exact: true })
        .click();
      await page
        .getByRole("status")
        .filter({ hasText: "Giriş xidməti hələ aktivləşdirilməyib" })
        .waitFor();
    });
    await check(
      "confirmation callback shows a recovery action rather than a blank screen",
      async () => {
        await page.goto(`${base}/auth/callback?error=access_denied`);
        await page
          .getByRole("heading", { name: "Linki yeniləmək lazımdır" })
          .waitFor();
        await page
          .getByRole("link", { name: "Girişə qayıt / Yeni kod istə" })
          .waitFor();
      },
    );
    await check(
      "direct listing URL renders gallery and rental terms",
      async () => {
        await page.goto(`${base}/listings/example-1`);
        await page
          .getByRole("heading", {
            name: "Hyundai Elantra — rahat şəhər səfərləri",
            exact: true,
          })
          .waitFor();
        assert.match(await page.title(), /Hyundai/);
        await page.getByText("100 ₼", { exact: true }).waitFor();
        await page.getByRole("button", { name: "Keçidi paylaş" }).click();
        await page.getByRole("status").waitFor();
      },
    );
    await check("unknown listing returns missing-page UI", async () => {
      await page.goto(`${base}/listings/not-a-listing`);
      await page
        .getByRole("heading", { name: "Bu ünvanda elan yoxdur" })
        .waitFor();
    });
    await check(
      "edit and account routes guard missing authentication",
      async () => {
        await page.goto(`${base}/edit/11111111-1111-4111-8111-111111111111`);
        await page
          .getByText("Elan qəbulu hələ aktivləşdirilməyib.", { exact: false })
          .waitFor();
        await page.goto(`${base}/account`);
        await page
          .getByRole("link", { name: "Davam etmək üçün daxil ol." })
          .waitFor();
      },
    );
    await check(
      "help explains direct contact and payments honestly",
      async () => {
        await page.goto(`${base}/help`);
        await page
          .getByRole("heading", { name: "Saytda ödəniş edə bilərəm?" })
          .waitFor();
        await page
          .getByText("Hazırda platforma ödəniş və rezervasiya qəbul etmir.", {
            exact: false,
          })
          .waitFor();
      },
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base);
    await page
      .getByText("Hazırda nümunə elanlara baxırsınız.", { exact: false })
      .waitFor();
    await page.screenshot({ path: "/tmp/kiraye-desktop.png", fullPage: true });
    await check("no uncaught browser errors", async () =>
      assert.deepEqual(errors, []),
    );
    console.log(`${checks} checks passed`);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
