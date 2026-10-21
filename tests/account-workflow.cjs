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
    updated;
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
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
  };
  await page.route("https://*.supabase.co/**", async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      path = url.pathname,
      method = req.method();
    let body = {},
      status = 200;
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
    else if (path.includes("/rest/v1/listings")) {
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
    await fn();
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
          .getByRole("button", { name: "Hesabın var? Daxil ol", exact: true })
          .click();
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
          .waitFor();
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
    await check(
      "category selection shows only relevant fields and clears incompatible vehicle details",
      async () => {
        await page.goto(`${base}/new`);
        const category = page.getByLabel("Kateqoriya", { exact: true });
        await category.waitFor();
        assert.equal(
          await page.getByLabel("Elanın başlığı", { exact: true }).count(),
          0,
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
        ]) {
          await category.selectOption(value);
          assert.equal(
            await page.getByLabel("Marka", { exact: true }).count(),
            ["car", "motorcycle", "bicycle", "equipment"].includes(value)
              ? 1
              : 0,
          );
          assert.equal(
            await page.getByLabel("Otaq sayı", { exact: true }).count(),
            ["property", "villa"].includes(value) ? 1 : 0,
          );
          assert.equal(
            await page.getByLabel("Sahə (m²)", { exact: true }).count(),
            ["property", "villa", "commercial"].includes(value) ? 1 : 0,
          );
          assert.equal(
            await page.getByLabel("Rayon / qəsəbə", { exact: true }).count(),
            0,
          );
          assert.equal(
            await page.getByLabel("Depozit (₼)", { exact: true }).isVisible(),
            false,
          );
        }
        assert(
          (await page
            .getByLabel("Şəhər", { exact: true })
            .locator("option")
            .count()) > 70,
        );
        await category.selectOption("car");
        const brand = page.getByLabel("Marka", { exact: true });
        const model = page.getByLabel("Model", { exact: true });
        assert.equal(await model.isDisabled(), true);
        await brand.fill("Hyundai");
        await model.fill("Elantra");
        assert(
          (await page.locator("#vehicle-models").innerHTML()).includes(
            "Elantra",
          ),
        );
        await brand.fill("Toyota");
        assert.equal(await model.inputValue(), "");
        assert(
          !(await page.locator("#vehicle-models").innerHTML()).includes(
            "Elantra",
          ),
        );
        await category.selectOption("motorcycle");
        assert.equal(await brand.inputValue(), "");
        await brand.fill("Yamaha");
        assert(
          (await page.locator("#vehicle-models").innerHTML()).includes("NMAX"),
        );
        await category.selectOption("bicycle");
        assert(
          (await page.locator("#vehicle-brands").innerHTML()).includes("Trek"),
        );
        assert(
          !(await page.locator("#vehicle-brands").innerHTML()).includes(
            "Hyundai",
          ),
        );
        await brand.fill("Trek");
        await model.fill("Marlin");
        await page
          .getByLabel("Velosiped növü", { exact: true })
          .selectOption("Dağ");
        assert.equal(
          await page.getByLabel("Sürətlər qutusu", { exact: true }).count(),
          0,
        );
        await category.selectOption("equipment");
        await category.selectOption("car");
        assert.equal(await brand.inputValue(), "");
        await page.setViewportSize({ width: 390, height: 844 });
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        await page.screenshot({
          path: "/tmp/kirayeal-car-form.png",
          fullPage: true,
        });
      },
    );
    await check(
      "authenticated owner submits a photo listing for moderation",
      async () => {
        await page.goto(`${base}/new`);
        await page
          .getByLabel("Kateqoriya", { exact: true })
          .selectOption("property");
        await page
          .getByLabel("Şəhər", { exact: true })
          .selectOption("Mingəçevir");
        await page
          .getByLabel("Elanın başlığı", { exact: true })
          .fill("Sahil metrosu yanında rahat iki otaqlı mənzil");
        await page.getByLabel("Qiymət (₼)", { exact: true }).fill("60");
        await page
          .getByLabel("Ətraflı təsvir", { exact: true })
          .fill(
            "Günlük kirayə üçün təmiz və rahat iki otaqlı mənzil. İnternet və mətbəx daxildir.",
          );
        await page.getByLabel(/Telefon nömrəsi/).fill("0501234567");
        await page.getByLabel("Elan şəkilləri", { exact: true }).setInputFiles({
          name: "room.png",
          mimeType: "image/png",
          buffer: Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aK1cAAAAASUVORK5CYII=",
            "base64",
          ),
        });
        const extraPhoto = {
          name: "second-room.png",
          mimeType: "image/png",
          buffer: Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aK1cAAAAASUVORK5CYII=",
            "base64",
          ),
        };
        await page
          .getByLabel("Elan şəkilləri", { exact: true })
          .setInputFiles(extraPhoto);
        assert.equal(await page.locator(".uploadPreviews img").count(), 2);
        await page
          .getByRole("button", { name: "Üz qabığı et", exact: true })
          .click();
        await page.getByLabel("Elan şəkilləri", { exact: true }).setInputFiles(
          Array.from({ length: 5 }, (_, i) => ({
            ...extraPhoto,
            name: `extra-${i}.png`,
          })),
        );
        await page.getByRole("alert").filter({ hasText: "1–6 ədəd" }).waitFor();
        assert.equal(await page.locator(".uploadPreviews img").count(), 2);
        await page
          .getByRole("button", { name: "Elana önbaxış", exact: true })
          .click();
        await page
          .getByRole("region", { name: "Elanın önbaxışı" })
          .getByRole("heading", {
            name: "Sahil metrosu yanında rahat iki otaqlı mənzil",
          })
          .waitFor();
        assert.equal(inserted, undefined);
        await page
          .getByRole("button", { name: "Önbaxışı bağla", exact: true })
          .click();
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
        assert.equal(inserted.images.length, 2);
        assert.equal(inserted.contact, "+994501234567");
        assert.equal(inserted.city, "Mingəçevir");
        assert.deepEqual(inserted.attributes, { amenities: [] });
        assert.equal(inserted.district, "");
      },
    );
    await check(
      "car and bicycle submissions store their own specifications without mixing fields",
      async () => {
        for (const category of ["car", "bicycle"]) {
          await page.goto(`${base}/new`);
          await page
            .getByLabel("Kateqoriya", { exact: true })
            .selectOption("car");
          await page.getByLabel("Marka", { exact: true }).fill("Toyota");
          await page.getByLabel("Model", { exact: true }).fill("Corolla");
          await page
            .getByLabel("Yanacaq növü", { exact: true })
            .selectOption("Benzin");
          await page
            .getByLabel("Sürətlər qutusu", { exact: true })
            .selectOption("Avtomat");
          if (category === "bicycle") {
            await page
              .getByLabel("Kateqoriya", { exact: true })
              .selectOption("bicycle");
            await page.getByLabel("Marka", { exact: true }).fill("Trek");
            await page.getByLabel("Model", { exact: true }).fill("Marlin");
            await page
              .getByLabel("Velosiped növü", { exact: true })
              .selectOption("Dağ");
            await page
              .getByLabel("Təkər ölçüsü", { exact: true })
              .selectOption("29 düym");
          }
          await page
            .getByLabel("Rəng", { exact: true })
            .selectOption("Qırmızı");
          await page
            .getByLabel("Elanın başlığı", { exact: true })
            .fill("Test üçün gündəlik kirayə nəqliyyat vasitəsi");
          await page.getByLabel("Şəhər", { exact: true }).selectOption("Qusar");
          await page.getByLabel("Qiymət (₼)", { exact: true }).fill("25");
          await page
            .getByLabel("Ətraflı təsvir", { exact: true })
            .fill(
              "Yaxşı vəziyyətdə nəqliyyat vasitəsi gündəlik kirayə üçün təklif olunur.",
            );
          await page.getByLabel(/Telefon nömrəsi/).fill("0501234567");
          await page
            .getByLabel("Elan şəkilləri", { exact: true })
            .setInputFiles({
              name: "vehicle.png",
              mimeType: "image/png",
              buffer: Buffer.from(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aK1cAAAAASUVORK5CYII=",
                "base64",
              ),
            });
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
          assert.equal(inserted.category, category);
          assert.equal(inserted.rooms, null);
          assert.equal(inserted.area_m2, null);
          assert.equal(inserted.attributes.color, "Qırmızı");
          assert.equal(inserted.city, "Qusar");
          if (category === "car") {
            assert.equal(inserted.attributes.brand, "Toyota");
            assert.equal(inserted.attributes.model, "Corolla");
            assert.equal(inserted.attributes.fuel, "Benzin");
            assert.equal(inserted.attributes.gearbox, "Avtomat");
            assert.equal(inserted.attributes.wheel_size, undefined);
          } else {
            assert.equal(inserted.attributes.brand, "Trek");
            assert.equal(inserted.attributes.model, "Marlin");
            assert.equal(inserted.attributes.kind, "Dağ");
            assert.equal(inserted.attributes.wheel_size, "29 düym");
            assert.equal(inserted.attributes.fuel, undefined);
            assert.equal(inserted.attributes.gearbox, undefined);
          }
        }
      },
    );
    await check(
      "bicycle specifications survive editing and appear in listing details",
      async () => {
        const original = item;
        item = { ...item, ...inserted, id: listingId, status: "published" };
        await page.goto(`${base}/edit/${listingId}`);
        assert.equal(
          await page.getByLabel("Marka", { exact: true }).inputValue(),
          "Trek",
        );
        assert.equal(
          await page.getByLabel("Model", { exact: true }).inputValue(),
          "Marlin",
        );
        assert.equal(
          await page.getByLabel("Rəng", { exact: true }).inputValue(),
          "Qırmızı",
        );
        assert.equal(
          await page.getByLabel("Təkər ölçüsü", { exact: true }).inputValue(),
          "29 düym",
        );
        await page
          .getByLabel("Təkər ölçüsü", { exact: true })
          .selectOption("26 düym");
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
        assert.equal(updated.attributes.brand, "Trek");
        assert.equal(updated.attributes.wheel_size, "26 düym");
        assert.equal(updated.attributes.fuel, undefined);
        item.status = "published";
        await page.goto(base);
        await page.locator(".quickView").first().click();
        const specs = page.getByRole("dialog").locator(".detailSpecs");
        await specs.getByText("Qırmızı", { exact: true }).waitFor();
        await specs.getByText("26 düym", { exact: true }).waitFor();
        await specs.getByText("Dağ", { exact: true }).waitFor();
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
      "editing preserves the owner and forces a new moderation review",
      async () => {
        await page.goto(`${base}/edit/${listingId}`);
        await page
          .getByLabel("Elanın başlığı", { exact: true })
          .fill("Redaktə edilmiş işıqlı iki otaqlı mənzil");
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
        assert.equal(updated.images.length, 1);
      },
    );
    await check("owner can archive an existing listing", async () => {
      await page.goto(`${base}/profile`);
      await page
        .getByRole("button", { name: "Arxivə keçir", exact: true })
        .click();
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
          .waitFor();
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
