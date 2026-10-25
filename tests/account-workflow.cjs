// Simulated Supabase responses: no real user is created and no email is sent.
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: process.env.TEST_MOBILE
      ? { width: 390, height: 844 }
      : { width: 1280, height: 900 },
  });
  const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3013";
  const id = "11111111-1111-4111-8111-111111111111",
    listingId = "22222222-2222-4222-8222-222222222222";
  const user = {
    id,
    email: "browser-test@example.invalid",
    aud: "authenticated",
    role: "authenticated",
    app_metadata: { provider: "email" },
    user_metadata: {},
    created_at: new Date().toISOString(),
  };
  const jwt = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: id, aud: "authenticated", role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.test-signature`;
  let rejectLogin = true,
    inserted,
    updated,
    submittedReport;
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  let item = {
    id: listingId,
    owner_id: id,
    title: "İşıqlı və rahat iki otaqlı mənzil",
    category: "property",
    city: "Bakı",
    price: 45,
    rental_period: "daily",
    description: "Kirayə üçün tam təchiz edilmiş, rahat və işıqlı mənzil.",
    contact: "+994501234567",
    images: ["/room.svg"],
    created_at: new Date().toISOString(),
    status: "published",
    deposit: 0,
    min_days: 1,
  };
  const cors = {
    "access-control-allow-origin": "*",
    "access-control-allow-headers":
      "authorization,apikey,content-type,x-client-info,prefer",
    "access-control-allow-methods": "GET,HEAD,POST,PATCH,DELETE,OPTIONS",
  };
  await page.route("https://*.supabase.co/**", async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      path = url.pathname,
      method = req.method();
    let body = {},
      status = 200;
    // Each posting scenario has a fresh allowance; submission-policy.cjs tests
    // the real database limits independently of these upload/edit fixtures.
    if (method === "HEAD" && path.includes("/rest/v1/listings")) {
      await route.fulfill({
        status: 200,
        headers: {
          ...cors,
          "content-range": "*/0",
          "access-control-expose-headers": "content-range",
        },
      });
      return;
    }
    if (method === "OPTIONS") {
      await route.fulfill({ status: 204, headers: cors });
      return;
    }
    if (path.endsWith("/auth/v1/settings"))
      body = { external: { email: true, phone: false } };
    else if (path.endsWith("/auth/v1/token")) {
      if (rejectLogin) {
        status = 400;
        body = {
          code: "invalid_credentials",
          message: "Invalid login credentials",
        };
      } else
        body = {
          access_token: jwt,
          refresh_token: "mock-refresh-token",
          expires_in: 3600,
          token_type: "bearer",
          user,
        };
    } else if (path.endsWith("/auth/v1/user")) body = user;
    else if (path.endsWith("/rest/v1/rpc/rental_features_ready")) body = true;
    else if (path.endsWith("/rest/v1/rpc/own_listing_view_counts")) body = [];
    else if (path.endsWith("/rest/v1/rpc/listing_allowance")) body = {allowed:true};
    else if (path.endsWith("/rest/v1/rpc/has_category_listing_allowance")) body = true;
    else if (path.includes("/rest/v1/profiles"))
      body =
        method === "GET"
          ? {
              id,
              role: "user",
              display_name: "Test user",
              phone: "+994501234567",
            }
          : {};
    else if (path.includes("/rest/v1/listing_reports")) {
      submittedReport = req.postDataJSON();
      body = {};
      status = 201;
    } else if (path.includes("/rest/v1/listings")) {
      if (method === "POST") {
        inserted = req.postDataJSON();
        body = { id: listingId };
        status = 201;
      } else if (method === "PATCH") {
        updated = req.postDataJSON();
        item = { ...item, ...updated };
        body = { id: listingId };
      } else if (url.searchParams.has("id")) body = item;
      else body = [item];
    } else if (path.includes("/storage/v1/object/")) {
      body = { Key: "listing-images/test-upload.png", Id: listingId };
      status = 200;
    } else if (path.endsWith("/auth/v1/logout")) {
      await route.fulfill({ status: 204, headers: cors });
      return;
    } else throw new Error(`Unexpected mocked endpoint: ${path}`);
    await route.fulfill({
      status,
      contentType: "application/json",
      headers: { ...cors, "content-range": "0-0/1" },
      body: JSON.stringify(body),
    });
  });
  let count = 0;
  async function check(name, fn) {
    try {
      await fn();
    } catch (error) {
      console.log(
        await page
          .locator(".listingForm")
          .evaluate((el) => ({
            step: el
              .querySelector("[data-post-step]:not([hidden])")
              ?.getAttribute("data-post-step"),
            error: el.querySelector(".error")?.textContent,
            invalid: Array.from(el.querySelectorAll("input,select,textarea"))
              .filter((field) => !field.checkValidity())
              .map((field) => ({
                name: field.name || field.getAttribute("aria-label"),
                message: field.validationMessage,
              })),
            attributes: ["brand", "model", "min_days", "deposit"].map((key) => [
              key,
              new FormData(el).get(key),
            ]),
          }))
          .catch(() => ({})),
      );
      console.log(
        "Auth form state",
        await page
          .locator(".authShell")
          .evaluate((el) => ({
            heading: el.querySelector("h1")?.textContent,
            notice: el.querySelector(".notice")?.textContent,
            invalid: Array.from(el.querySelectorAll("input"))
              .filter((field) => !field.checkValidity())
              .map((field) => field.name),
            emailFilled: !!el.querySelector('[name="email"]')?.value,
            passwordLength:
              el.querySelector('[name="password"]')?.value?.length,
          }))
          .catch(() => null),
      );
      await page.screenshot({
        path: "/tmp/kirayeal-posting-failure.png",
        fullPage: true,
      });
      throw error;
    }
    count++;
    console.log("PASS", name);
  }
  try {
    await page.goto(`${base}/login`);
    if (
      await page.getByRole("button", { name: "E-poçtla", exact: true }).count()
    )
      await page.getByRole("button", { name: "E-poçtla", exact: true }).click();
    await check(
      "six-character existing password reaches the authentication service",
      async () => {
        await page.getByLabel("E-poçt", { exact: true }).fill(user.email);
        await page.getByLabel("Şifrə", { exact: true }).fill("old123");
        await page
          .getByRole("button", { name: "Daxil ol →", exact: true })
          .click();
        await page
          .getByRole("status")
          .filter({ hasText: "E-poçt və ya şifrə düzgün deyil" })
          .waitFor();
      },
    );
    await check(
      "invalid password offers direct recovery while preserving email",
      async () => {
        await page
          .getByRole("button", { name: "Şifrəni yenilə →", exact: true })
          .click();
        await page
          .getByRole("heading", { name: "Şifrəni yenilə", exact: true })
          .waitFor();
        assert.equal(
          await page.getByLabel("E-poçt", { exact: true }).inputValue(),
          user.email,
        );
        await page
          .getByRole("link", { name: "Hesabın var? Daxil ol", exact: true })
          .click();
        await page.getByRole("heading", { name: "Hesaba giriş", exact: true }).waitFor();
        assert.equal(await page.getByLabel("E-poçt", { exact: true }).inputValue(), "");
        await page.getByLabel("E-poçt", { exact: true }).fill(user.email);
        await page.getByLabel("Şifrə", { exact: true }).fill("old123");
      },
    );
    await check(
      "successful session reaches profile and updates account navigation",
      async () => {
        rejectLogin = false;
        await page
          .getByRole("button", { name: "Daxil ol →", exact: true })
          .click();
        await page.waitForURL("**/profile");
        await page.getByText(item.title, { exact: true }).waitFor();
        await page
          .locator(".accountLink")
          .filter({ hasText: "Hesabım" })
          .waitFor({ state: "attached" });
      },
    );
    await check("profile status tabs actually filter listings", async () => {
      await page
        .getByRole("button", { name: "Arxiv (0)", exact: true })
        .click();
      assert.equal(await page.locator(".accountListings article").count(), 0);
      await page
        .getByRole("button", { name: "Hamısı (1)", exact: true })
        .click();
      assert.equal(await page.locator(".accountListings article").count(), 1);
    });
    const next = () =>
      page.getByRole("button", { name: "Davam et →", exact: true }).click();
    const backToCategory = async () => {
      await page
        .getByRole("navigation", { name: "Elan bölmələri" })
        .getByRole("button", { name: /1\s*Kateqoriya/ })
        .click();
    };
    const photo = {
      name: "rental.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aK1cAAAAASUVORK5CYII=",
        "base64",
      ),
    };
    await check(
      "four-step flow blocks missing category and scopes each category",
      async () => {
        await page.evaluate(() =>
          localStorage.setItem("kiraye:last-city", "Xırdalan"),
        );
        await page.goto(`${base}/new`);
        await page.getByRole("complementary", { name: "Təhlükəsiz elan yerləşdirmə" }).waitFor();
        await next();
        assert.equal(
          await page.locator('[data-post-step="1"]').isVisible(),
          true,
        );
        for (const value of [
          "property",
          "villa",
          "commercial",
          "car",
          "motorcycle",
          "equipment",
          "bicycle",
          "event",
          "clothing",
          "electric",
          "photo",
          "camping",
        ]) {
          await page
            .getByLabel("Kateqoriya", { exact: true })
            .selectOption(value);
          await next();
          assert.equal(
            await page.locator('[data-post-step="2"]').isVisible(),
            true,
          );
          assert.equal(
            await page.getByLabel("Marka", { exact: true }).count(),
            ["car", "motorcycle", "bicycle"].includes(value)
              ? 1
              : 0,
          );
          assert.equal(
            await page.getByLabel("Otaq sayı", { exact: true }).count(),
            ["property", "villa"].includes(value) ? 1 : 0,
          );
          assert.equal(
            await page.getByLabel("Dəstə daxildir", { exact: true }).count(),
            0,
          );
          assert.equal(
            await page
              .getByLabel("Elan şəkilləri", { exact: true })
              .isVisible(),
            false,
          );
          if (value === "motorcycle") {
            assert.equal(await page.getByLabel("Vəziyyət", { exact: true }).count(), 0);
            await page.getByLabel("Yeni / işlənmiş", { exact: true }).selectOption("Yeni");
            const motorcycleMileage = page.getByLabel("Yürüş, km", { exact: true });
            assert.equal(await motorcycleMileage.inputValue(), "0");
            assert.equal(await motorcycleMileage.getAttribute("readonly"), "");
            await page.getByLabel("Yeni / işlənmiş", { exact: true }).selectOption("İşlənmiş");
            assert.equal(await motorcycleMileage.inputValue(), "");
            await motorcycleMileage.fill("250");
            assert.equal(await motorcycleMileage.inputValue(), "250");
            await page.getByLabel("Rəng", { exact: true }).selectOption("Tünd yaşıl");
            assert.equal(await page.getByLabel("Rəng", { exact: true }).locator('option[value="Çoxrəngli"]').count(), 0);
          }
          await backToCategory();
        }
        await page
          .getByRole("button", { name: "Sıfırla", exact: true })
          .click();
        assert.equal(
          await page.getByLabel("Kateqoriya", { exact: true }).inputValue(),
          "",
        );
      },
    );
    await check(
      "dependent vehicle choices reset without losing an edited title",
      async () => {
        await page
          .getByLabel("Kateqoriya", { exact: true })
          .selectOption("car");
        await next();
        const brand = page.getByLabel("Marka", { exact: true }),
          model = page.getByLabel("Model", { exact: true });
        assert.equal(await model.isDisabled(), true);
        await brand.selectOption("Changan");
        for (const value of ["UNI-K", "UNI-T", "UNI-V", "UNI-Z"]) {
          await model.selectOption(value);
          assert.equal(await page.locator('input[name="model"]').inputValue(), value);
        }
        await brand.selectOption("Chevrolet");
        for (const value of ["Camaro", "Corvette", "Tahoe", "Volt"]) {
          await model.selectOption(value);
          assert.equal(await page.locator('input[name="model"]').inputValue(), value);
        }
        await brand.selectOption("Lamborghini");
        assert.equal(await model.inputValue(), "");
        for (const value of ["Aventador", "Gallardo", "Huracan", "Revuelto", "Temerario", "Urus"]) {
          await model.selectOption(value);
          assert.equal(await page.locator('input[name="model"]').inputValue(), value);
        }
        await brand.selectOption("__other__");
        await page.getByLabel("Digər marka", { exact: true }).fill("constructor");
        await model.selectOption("__other__");
        await page.getByLabel("Digər model", { exact: true }).fill("İstifadəçinin modeli");
        assert.equal(await page.locator('input[name="brand"]').inputValue(), "constructor");
        await brand.selectOption("Hyundai");
        await model.selectOption("Elantra");
        assert.equal(
          await page.getByLabel("Elanın başlığı", { exact: true }).inputValue(),
          "Hyundai Elantra kirayəsi",
        );
        await page
          .getByLabel("Elanın başlığı", { exact: true })
          .fill("Öz başlığım saxlanmalıdır");
        await brand.selectOption("Toyota");
        assert.equal(await model.inputValue(), "");
        assert.equal(
          await page.getByLabel("Elanın başlığı", { exact: true }).inputValue(),
          "Öz başlığım saxlanmalıdır",
        );
        await page
          .getByLabel("Yanacaq növü", { exact: true })
          .selectOption("Elektrik");
        assert.equal(
          await page.getByLabel("Mühərrik, sm³", { exact: true }).count(),
          0,
        );
        await page
          .getByLabel("Yeni / işlənmiş", { exact: true })
          .selectOption("Yeni");
        assert.equal(
          await page.getByLabel("Yürüş, km", { exact: true }).inputValue(),
          "0",
        );
        await page
          .getByLabel("Yeni / işlənmiş", { exact: true })
          .selectOption("İşlənmiş");
        const driver = page.getByLabel("Sürücü xidməti (istəyə bağlı)", { exact: true });
        assert.equal(await driver.inputValue(), "");
        await driver.selectOption("Sürücülü");
        assert.equal(await driver.inputValue(), "Sürücülü");
        const mileage = page.getByLabel("Yürüş, km", { exact: true });
        await mileage.fill("50000");
        await mileage.hover();
        await page.mouse.wheel(0, 100);
        assert.equal(await mileage.inputValue(), "50000");
        await mileage.press("ArrowDown");
        assert.equal(await mileage.inputValue(), "50000");
        assert.equal(await page.locator('[name="city"]').inputValue(), "");
        assert.equal(await page.locator('[name="price"]').inputValue(), "");
        assert.equal(await page.locator("form.listingForm").getAttribute("autocomplete"), "off");
        await page.locator(".optionalRentalTerms summary").click();
        const minimum = page.locator('[name="min_days"]');
        assert.equal(await minimum.inputValue(), "");
        assert.equal(await page.locator('[name="deposit"]').inputValue(), "");
        await minimum.fill("1 il");
        assert.equal(await minimum.inputValue(), "1");
        await minimum.fill("30");
        await minimum.hover();
        await page.mouse.wheel(0, 100);
        await minimum.press("ArrowDown");
        assert.equal(await minimum.inputValue(), "30");
        await page.locator('[name="min_rental_unit"]').selectOption("month");
        assert.equal(
          await page.locator('[name="min_rental_unit"]').inputValue(),
          "month",
        );
        assert.equal(await page.locator('[name="available_from"]').count(), 0);
        await page.screenshot({
          path: "/tmp/kirayeal-car-form.png",
          fullPage: true,
        });
      },
    );
    await check(
      "monthly property posting validates, preserves back navigation and uploads photos",
      async () => {
        await page.goto(`${base}/new`);
        await page
          .getByLabel("Kateqoriya", { exact: true })
          .selectOption("property");
        await next();
        assert.equal(
          await page
            .locator('input[name="rental_period"][value="monthly"]')
            .isChecked(),
          true,
        );
        await next();
        assert.equal(
          await page.locator('[data-post-step="2"]').isVisible(),
          true,
        );
        await page
          .getByLabel("Şəhər", { exact: true })
          .selectOption("Mingəçevir");
        await page
          .getByLabel("Elanın başlığı", { exact: true })
          .fill("Sahil metrosu yanında rahat iki otaqlı mənzil");
        await page.getByLabel("Qiymət (₼)", { exact: true }).fill("600");
        await page
          .getByLabel("Ətraflı təsvir", { exact: true })
          .fill(
            "Aylıq kirayə üçün təmiz və rahat iki otaqlı mənzil. İnternet və mətbəx daxildir.",
          );
        await page.getByRole("button", { name: "← Geri", exact: true }).click();
        await next();
        assert.equal(
          await page.getByLabel("Qiymət (₼)", { exact: true }).inputValue(),
          "600",
        );
        await next();
        await next();
        await page
          .getByRole("alert")
          .filter({ hasText: "Ən azı bir şəkil" })
          .waitFor();
        await page
          .getByLabel("Elan şəkilləri", { exact: true })
          .setInputFiles(photo);
        await page
          .getByLabel("Elan şəkilləri", { exact: true })
          .setInputFiles({ ...photo, name: "cover.png" });
        await page
          .getByRole("button", { name: "Üz qabığı et", exact: true })
          .click();
        await page.getByLabel("Elan şəkilləri", { exact: true }).setInputFiles(
          Array.from({ length: 5 }, (_, i) => ({
            ...photo,
            name: `${i}.png`,
          })),
        );
        await page.getByRole("alert").filter({ hasText: "1–6 ədəd" }).waitFor();
        assert.equal(await page.locator(".uploadPreviews img").count(), 2);
        await next();
        await page.getByLabel(/Telefon nömrəsi/).fill("0501234567");
        await page
          .getByRole("button", { name: "Elana önbaxış", exact: true })
          .click();
        await page
          .getByRole("region", { name: "Elanın önbaxışı" })
          .getByText(/600 ₼ \/ ay/)
          .waitFor();
        assert.equal(inserted, undefined);
        await page.locator("input[type=checkbox][required]").check();
        await page
          .getByRole("button", {
            name: "Elanı yoxlamaya göndər →",
            exact: true,
          })
          .click();
        await page
          .getByRole("heading", { name: "Elanın yoxlamaya göndərildi" })
          .waitFor();
        assert.equal(inserted.status, "pending");
        assert.equal(inserted.owner_id, id);
        assert.equal(inserted.rental_period, "monthly");
        assert.equal(inserted.price, 600);
        assert.equal(await page.getByRole("complementary", { name: "Təhlükəsiz elan yerləşdirmə" }).count(), 0);
        assert.equal(inserted.images.length, 2);
      },
    );
    await check(
      "daily bicycle posting saves only relevant attributes",
      async () => {
        await page.goto(`${base}/new`);
        await page
          .getByLabel("Kateqoriya", { exact: true })
          .selectOption("bicycle");
        await next();
        await page.getByLabel("Marka", { exact: true }).selectOption("Trek");
        await page.getByLabel("Model", { exact: true }).selectOption("Marlin");
        await page
          .getByLabel("Velosiped növü", { exact: true })
          .selectOption("Dağ");
        await page.getByLabel("Rəng", { exact: true }).selectOption("Qırmızı");
        await page
          .getByLabel("Təkər ölçüsü", { exact: true })
          .selectOption("29 düym");
        await page.getByLabel("Şəhər", { exact: true }).selectOption("Qusar");
        await page.getByLabel("Qiymət (₼)", { exact: true }).fill("40");
        await page
          .getByLabel("Ətraflı təsvir", { exact: true })
          .fill(
            "Dağ velosipedi günlük kirayəyə verilir. Təmiz və saz vəziyyətdədir.",
          );
        assert.equal(
          await page
            .locator('input[name="rental_period"][value="daily"]')
            .isChecked(),
          true,
        );
        await page.getByText("Əlavə kirayə şərtləri", { exact: false }).click();
        await page.getByLabel("Depozit (₼)", { exact: true }).fill("45");
        await page.locator('[name="min_days"]').fill("1");
        await page.locator('[name="min_rental_unit"]').selectOption("month");
        await next();
        await page
          .locator('[data-post-step="3"]')
          .waitFor({ state: "visible", timeout: 5000 });
        await page
          .getByLabel("Elan şəkilləri", { exact: true })
          .setInputFiles(photo);
        await page.locator(".uploadPreviews img").waitFor();
        await next();
        await page
          .locator('[data-post-step="4"]')
          .waitFor({ state: "visible" });
        await page.getByLabel(/Telefon nömrəsi/).fill("0501234567");
        await page.locator("input[type=checkbox][required]").check();
        await page
          .getByRole("button", {
            name: "Elanı yoxlamaya göndər →",
            exact: true,
          })
          .click();
        await page
          .getByRole("heading", { name: "Elanın yoxlamaya göndərildi" })
          .waitFor();
        assert.equal(inserted.rental_period, "daily");
        assert.equal(inserted.category, "bicycle");
        assert.equal(inserted.attributes.brand, "Trek");
        assert.equal(inserted.attributes.wheel_size, "29 düym");
        assert.equal(inserted.attributes.fuel, undefined);
        assert.equal(inserted.attributes.included_items, undefined);
        assert.equal(inserted.deposit, 45);
        assert.equal(inserted.min_days, 30);
        assert.equal(inserted.attributes.min_rental_value, "1");
        assert.equal(inserted.attributes.min_rental_unit, "month");
        assert.equal(inserted.rooms, null);
      },
    );
    await check(
      "editing preserves the period, photo and owner through all steps",
      async () => {
        const original = item;
        item = { ...item, ...inserted, id: listingId, status: "published" };
        await page.goto(`${base}/edit/${listingId}`);
        await page.getByLabel("Kateqoriya", { exact: true }).waitFor();
        await next();
        assert.equal(
          await page
            .locator('input[name="rental_period"][value="daily"]')
            .isChecked(),
          true,
        );
        assert.equal(
          await page.getByLabel("Marka", { exact: true }).inputValue(),
          "Trek",
        );
        assert.equal(await page.locator('[name="min_days"]').inputValue(), "1");
        assert.equal(
          await page.locator('[name="min_rental_unit"]').inputValue(),
          "month",
        );
        await page
          .getByLabel("Təkər ölçüsü", { exact: true })
          .selectOption("26 düym");
        await next();
        assert.equal(await page.locator(".uploadPreviews img").count(), 1);
        await next();
        await page.locator("input[type=checkbox][required]").check();
        await page
          .getByRole("button", {
            name: "Elanı yoxlamaya göndər →",
            exact: true,
          })
          .click();
        await page
          .getByRole("heading", { name: "Elanın yoxlamaya göndərildi" })
          .waitFor();
        assert.equal(updated.status, "pending");
        assert.equal(updated.owner_id, id);
        assert.equal(updated.attributes.wheel_size, "26 düym");
        item.status = "published";
        await page.goto(base);
        await page.locator(".quickView").first().click();
        const dialog = page.getByRole("dialog");
        await dialog.getByText("26 düym", { exact: true }).waitFor();
        assert.equal(
          await dialog.getByText("Dəstə daxildir", { exact: true }).count(),
          0,
        );
        const estimator = dialog.getByRole("region", {
          name: "Kirayə xərcini hesabla",
        });
        await estimator
          .getByLabel("Götürmə tarixi", { exact: true })
          .fill("2030-04-01");
        await estimator
          .getByLabel("Hesablama müddətinin vahidi", { exact: true })
          .selectOption("day");
        await estimator
          .getByLabel("Kirayə müddəti", { exact: true })
          .fill("30");
        assert.equal(
          (await estimator.locator(".estimateTotal dd").innerText()).replace(
            /\D/g,
            "",
          ),
          "1245",
        );
        const message = new URL(
          await estimator
            .getByRole("link", { name: "Tarixləri WhatsApp-la soruş" })
            .getAttribute("href"),
        ).searchParams.get("text");
        assert(message.includes("30 gün"));
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        item = original;
      },
    );
    await check(
      "pending listings open only through the owner's private preview",
      async () => {
        item.status = "pending";
        await page.goto(`${base}/profile`);
        const imageLink = page.locator(".accountListings article > a");
        await imageLink.waitFor();
        assert.equal(
          await imageLink.getAttribute("href"),
          `/profile/listings/${listingId}`,
        );
        await imageLink.click();
        await page.getByText(/Şəxsi önbaxış:/).waitFor();
        await page.locator(".listingDetails").waitFor();
        await page.goto(`${base}/profile`);
        await page.locator(".accountListings article").waitFor();
      },
    );
    await check(
      "an authenticated visitor can report another owner's published listing",
      async () => {
        const previousOwner = item.owner_id;
        item.owner_id = "99999999-9999-4999-8999-999999999999";
        item.status = "published";
        await page.goto(base);
        await page.locator(".listingCard").waitFor({ timeout: 60000 });
        await page.locator(".quickView").click();
        await page
          .getByRole("button", { name: "Bu elandan şikayət et", exact: true })
          .click();
        await page
          .getByLabel("Əlavə məlumat", { exact: true })
          .fill("Elanın qiyməti təsvirlə uyğun gəlmir, yoxlayın.");
        await page
          .getByRole("button", { name: "Şikayəti göndər", exact: true })
          .click();
        await page
          .getByText("Şikayətiniz qeydə alındı. İdarəçi yoxlayacaq.", {
            exact: true,
          })
          .waitFor();
        assert.equal(submittedReport.reporter_id, id);
        assert.equal(submittedReport.listing_id, listingId);
        assert.equal(submittedReport.status, "open");
        item.owner_id = previousOwner;
        await page.goto(`${base}/profile`);
        await page.locator(".accountListings article").waitFor();
      },
    );
    await check("owner can archive an existing listing", async () => {
      await page.goto(`${base}/profile`);
      await page
        .getByRole("button", { name: "Elanı sil", exact: true })
        .click();
      await page.getByRole("button",{name:"Bəli, elanı sil",exact:true}).click();
      await page.getByText("Arxivdə", { exact: true }).waitFor();
      assert.equal(updated.status, "archived");
    });
    await check(
      "sign out clears session and returns to the catalog",
      async () => {
        await page
          .getByRole("button", { name: "Hesabdan çıx", exact: true })
          .click();
        await page.waitForURL(base + "/");
        await page
          .locator(".accountLink")
          .filter({ hasText: "Daxil ol" })
          .waitFor({ state: "attached" });
      },
    );
    assert.deepEqual(errors, []);
    console.log(`${count} simulated account workflow checks passed`);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
