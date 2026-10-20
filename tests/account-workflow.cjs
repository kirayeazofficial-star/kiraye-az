// Simulated Supabase responses: no real user is created and no email is sent.
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
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
      "authenticated owner submits a photo listing for moderation",
      async () => {
        await page.goto(`${base}/new`);
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
        assert.equal(inserted.images.length, 1);
        assert.equal(inserted.contact, "+994501234567");
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
