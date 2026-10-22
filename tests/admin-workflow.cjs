// Browser integration with isolated mocked Auth/PostgREST. No live writes or messages.
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 1366, height: 768 },
  });
  const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3030";
  const errors = [],
    calls = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const user = {
    id: "11111111-1111-4111-8111-111111111111",
    email: "owner@example.invalid",
    role: "authenticated",
    aud: "authenticated",
    app_metadata: { provider: "email" },
    user_metadata: {},
    created_at: new Date().toISOString(),
  };
  const jwt = `${Buffer.from("{}").toString("base64url")}.${Buffer.from(JSON.stringify({ sub: user.id, aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.mock`;
  let admin = false,
    reportOpen = true;
  const items = Array.from({ length: 27 }, (_, i) => ({
    id: `22222222-2222-4222-8222-${String(i + 1).padStart(12, "0")}`,
    owner_id: user.id,
    title: `Rahat kirayə mənzili ${String(i + 1).padStart(2, "0")}`,
    category: "property",
    city: "Bakı",
    price: 45,
    rental_period: "daily",
    status: "pending",
    images: ["/room.svg"],
    contact: "+994501234567",
    description: "Rahat və tam təchiz edilmiş kirayə mənzili. Depozit yoxdur.",
    deposit: 0,
    min_days: 1,
    created_at: new Date(Date.UTC(2026, 0, 1, 0, 0, i)).toISOString(),
  }));
  const report = {
    id: "33333333-3333-4333-8333-333333333333",
    listing_id: items[0].id,
    reason: "Yanlış məlumat",
    message: "Bu elanda qiymət düzgün göstərilməyib.",
    status: "open",
    created_at: new Date().toISOString(),
    listings: { title: items[0].title },
  };
  await page.route("https://*.supabase.co/**", async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      path = url.pathname,
      method = req.method();
    const headers = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "*",
      "x-supabase-api-version": "2024-01-01",
      "access-control-expose-headers": "content-range",
    };
    if (method === "OPTIONS") return route.fulfill({ status: 204, headers });
    const data = req.postData() ? req.postDataJSON() : null;
    calls.push({
      path,
      method,
      params: Object.fromEntries(url.searchParams),
      data,
    });
    let body = {},
      total;
    if (path.endsWith("/auth/v1/settings"))
      body = { external: { google: false, email: true, phone: false } };
    else if (path.endsWith("/auth/v1/token"))
      body = {
        access_token: jwt,
        refresh_token: "mock-refresh",
        expires_in: 3600,
        token_type: "bearer",
        user,
      };
    else if (path.endsWith("/auth/v1/user")) body = user;
    else if (path.includes("/rest/v1/profiles"))
      body = {
        id: user.id,
        display_name: "Owner",
        role: admin ? "admin" : "user",
      };
    else if (path.includes("/rest/v1/listing_reports")) {
      if (method === "PATCH") {
        assert.equal(data.status, "resolved");
        reportOpen = false;
        body = { id: report.id };
      } else
        body =
          url.searchParams.get("status") ===
          (reportOpen ? "eq.open" : "eq.resolved")
            ? [{ ...report, status: reportOpen ? "open" : "resolved" }]
            : [];
    } else if (path.includes("/rest/v1/listings")) {
      if (method === "PATCH") {
        assert.equal(admin, true);
        const item = items.find(
          (x) => `eq.${x.id}` === url.searchParams.get("id"),
        );
        assert.equal(url.searchParams.get("status"), `eq.${item.status}`);
        Object.assign(item, data);
        body = { id: item.id };
      } else {
        let found = [...items].sort((a, b) =>
          b.created_at.localeCompare(a.created_at),
        );
        if (url.searchParams.has("status"))
          found = found.filter(
            (x) => `eq.${x.status}` === url.searchParams.get("status"),
          );
        if (url.searchParams.has("id"))
          found = found.filter(
            (x) => `eq.${x.id}` === url.searchParams.get("id"),
          );
        total = found.length;
        const offset = Number(url.searchParams.get("offset") || 0),
          limit = Number(url.searchParams.get("limit") || 200);
        body = found.slice(offset, offset + limit);
        headers["content-range"] =
          `${offset}-${Math.max(offset, offset + body.length - 1)}/${total}`;
      }
    } else throw new Error(`Unexpected endpoint ${path}`);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers,
      body: JSON.stringify(body),
    });
  });
  let count = 0;
  async function check(name, fn) {
    await fn();
    count++;
    console.log("PASS", name);
  }
  const rows = page.locator("#moderation .moderationCard");
  try {
    await page.goto(`${base}/login`);
    await page.getByLabel("E-poçt", { exact: true }).fill(user.email);
    await page.getByLabel("Şifrə", { exact: true }).fill("test-password");
    await page.getByRole("button", { name: "Daxil ol →", exact: true }).click();
    await page.waitForURL("**/profile");
    await page
      .getByRole("heading", { name: "Elanlarım", exact: true })
      .waitFor();
    await check("non-admin cannot load moderation records", async () => {
      const before = calls.filter((x) =>
        x.path.includes("/rest/v1/listings"),
      ).length;
      await page.goto(`${base}/admin`);
      await page
        .getByRole("heading", { name: "Bu bölmə yalnız idarəçilər üçündür" })
        .waitFor();
      assert.equal(
        calls.filter((x) => x.path.includes("/rest/v1/listings")).length,
        before,
      );
    });
    admin = true;
    await check(
      "administrator sees paginated pending listings and report queue",
      async () => {
        await page.reload();
        await page
          .getByText("27 elan · Səhifə 1 / 2", { exact: true })
          .waitFor();
        assert.equal(await rows.count(), 24);
        await page
          .locator("#reports")
          .getByText(report.message, { exact: true })
          .waitFor();
        await page
          .getByRole("navigation", {
            name: "Admin elan səhifələri",
            exact: true,
          })
          .getByRole("button", { name: "Növbəti", exact: true })
          .click();
        await page
          .getByText("27 elan · Səhifə 2 / 2", { exact: true })
          .waitFor();
        assert.equal(await rows.count(), 3);
        await page
          .getByRole("navigation", {
            name: "Admin elan səhifələri",
            exact: true,
          })
          .getByRole("button", { name: "Əvvəlki", exact: true })
          .click();
        await page
          .getByText("27 elan · Səhifə 1 / 2", { exact: true })
          .waitFor();
      },
    );
    await check(
      "approval updates status with concurrency guard and removes it from pending",
      async () => {
        await rows
          .first()
          .getByRole("button", { name: "Təsdiqlə və yayımla", exact: true })
          .click();
        await page
          .getByText("26 elan · Səhifə 1 / 2", { exact: true })
          .waitFor();
        assert.equal(items[26].status, "published");
        await page
          .getByRole("button", { name: "Yayımlanıb", exact: true })
          .click();
        await page
          .getByText("1 elan · Səhifə 1 / 1", { exact: true })
          .waitFor();
        assert.equal(await rows.count(), 1);
      },
    );
    await check("admin can archive a published listing", async () => {
      await rows
        .first()
        .getByRole("button", { name: "Arxivə keçir", exact: true })
        .click();
      await page.getByText("0 elan · Səhifə 1 / 1", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Arxiv", exact: true }).click();
      await page.getByText("1 elan · Səhifə 1 / 1", { exact: true }).waitFor();
      assert.equal(items[26].status, "archived");
    });
    await check(
      "rejection requires an explanation and saves it for the owner",
      async () => {
        await page
          .getByRole("button", { name: "Yoxlanılır", exact: true })
          .click();
        await page
          .getByText("26 elan · Səhifə 1 / 2", { exact: true })
          .waitFor();
        await rows
          .first()
          .getByRole("button", { name: "Rədd et", exact: true })
          .click();
        await page
          .getByRole("alert")
          .filter({ hasText: "ən azı 10 simvolla" })
          .waitFor();
        await rows
          .first()
          .getByLabel("Rədd səbəbi", { exact: true })
          .fill("Qiymət və şəkilləri dəqiqləşdirin.");
        await rows
          .first()
          .getByRole("button", { name: "Rədd et", exact: true })
          .click();
        await page
          .getByText("25 elan · Səhifə 1 / 2", { exact: true })
          .waitFor();
        assert.equal(
          items[25].rejection_reason,
          "Qiymət və şəkilləri dəqiqləşdirin.",
        );
      },
    );
    await check(
      "search reaches an older listing by ID and compact admin fits mobile",
      async () => {
        await page
          .getByLabel("Başlıq, telefon və ya elan ID-si", { exact: true })
          .fill(items[0].id);
        await page.getByRole("button", { name: "Axtar", exact: true }).click();
        await page
          .getByText("1 elan · Səhifə 1 / 1", { exact: true })
          .waitFor();
        assert.equal(await rows.count(), 1);
        await rows
          .first()
          .getByRole("heading", { name: items[0].title, exact: true })
          .waitFor();
        await page.setViewportSize({ width: 390, height: 844 });
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        );
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({
          path: "/tmp/kiraye-admin-mobile.png",
          fullPage: true,
        });
      },
    );
    await check(
      "reports can be resolved without deleting the rental listing",
      async () => {
        await page
          .getByRole("button", { name: "Baxıldı — arxivə keçir", exact: true })
          .click();
        await page.getByText("Açıq şikayət yoxdur.", { exact: true }).waitFor();
        assert.equal(items[0].status, "pending");
        await page
          .getByRole("button", { name: "Şikayət arxivi", exact: true })
          .click();
        await page
          .locator("#reports")
          .getByText(report.message, { exact: true })
          .waitFor();
        assert.equal(
          await page
            .getByRole("button", {
              name: "Baxıldı — arxivə keçir",
              exact: true,
            })
            .count(),
          0,
        );
        await page.reload();
        await page
          .getByRole("button", { name: "Şikayət arxivi", exact: true })
          .click();
        await page
          .locator("#reports")
          .getByText(report.message, { exact: true })
          .waitFor();
      },
    );
    assert.deepEqual(errors, []);
    console.log(`${count} admin workflow checks passed`);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
