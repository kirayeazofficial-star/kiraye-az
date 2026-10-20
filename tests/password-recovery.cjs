// Mocked recovery tokens and Auth responses. Never sends an email or changes a real password.
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3050";
  let checks = 0;
  const user = {
    id: "11111111-1111-4111-8111-111111111111",
    email: "recovery@example.invalid",
    aud: "authenticated",
    role: "authenticated",
    app_metadata: { provider: "email" },
    user_metadata: {},
    created_at: new Date().toISOString(),
  };
  const jwt = `${Buffer.from("{}").toString("base64url")}.${Buffer.from(JSON.stringify({ sub: user.id, aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.mock`;
  const fragment = `#access_token=${jwt}&refresh_token=mock-refresh&expires_in=3600&token_type=bearer&type=recovery`;
  async function setup() {
    const context = await browser.newContext();
    const page = await context.newPage();
    const updates = [],
      recoveries = [],
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("https://*.supabase.co/**", async (route) => {
      const req = route.request(),
        path = new URL(req.url()).pathname;
      const headers = {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "*",
        "access-control-allow-methods": "*",
      };
      if (req.method() === "OPTIONS")
        return route.fulfill({ status: 204, headers });
      let body = {};
      if (path.endsWith("/settings"))
        body = { external: { email: true, google: false, phone: false } };
      else if (path.endsWith("/recover")) {
        recoveries.push({ body: req.postDataJSON(), url: new URL(req.url()) });
        body = {};
      } else if (path.endsWith("/user")) {
        if (req.method() === "PUT") updates.push(req.postDataJSON());
        body = user;
      } else if (path.includes("/rest/v1/profiles"))
        body = { id: user.id, role: "user" };
      else if (path.includes("/rest/v1/listings")) body = [];
      else throw new Error(`Unexpected path ${path}`);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers,
        body: JSON.stringify(body),
      });
    });
    return { context, page, updates, recoveries, errors };
  }
  async function check(name, fn) {
    await fn();
    checks++;
    console.log("PASS", name);
  }
  try {
    await check(
      "recovery request points directly to the password form",
      async () => {
        const t = await setup();
        await t.page.goto(`${base}/login`);
        await t.page
          .getByRole("button", { name: "Şifrəni unutmusunuz?", exact: true })
          .click();
        await t.page.getByLabel("E-poçt", { exact: true }).fill(user.email);
        await t.page
          .getByRole("button", { name: "Yeniləmə linki göndər", exact: true })
          .click();
        await t.page
          .getByRole("heading", { name: "E-poçtunu yoxla", exact: true })
          .waitFor();
        assert(
          t.recoveries[0].url.searchParams
            .get("redirect_to")
            .endsWith("/reset-password"),
        );
        await t.page
          .getByRole("link", {
            name: "Linki açmışam — yeni şifrə təyin et",
            exact: true,
          })
          .waitFor();
        await t.context.close();
      },
    );
    for (const path of [
      "/reset-password",
      "/auth/callback?flow=recovery",
      "/auth/callback",
    ]) {
      await check(
        `recovery link ${path} opens form and saves a new password`,
        async () => {
          const t = await setup();
          await t.page.goto(base + path + fragment);
          await t.page.waitForURL("**/reset-password");
          await t.page
            .getByLabel("Yeni şifrə", { exact: true })
            .fill("new-test-password");
          await t.page
            .getByLabel("Şifrəni təkrarla", { exact: true })
            .fill("different-password");
          await t.page
            .getByRole("button", { name: "Şifrəni saxla", exact: true })
            .click();
          await t.page
            .getByRole("status")
            .filter({ hasText: "Şifrələr eyni olmalıdır" })
            .waitFor();
          assert.equal(t.updates.length, 0);
          await t.page
            .getByLabel("Şifrəni təkrarla", { exact: true })
            .fill("new-test-password");
          await t.page
            .getByRole("button", { name: "Şifrəni saxla", exact: true })
            .click();
          await t.page
            .getByRole("heading", { name: "Şifrən yeniləndi", exact: true })
            .waitFor();
          assert.equal(t.updates.length, 1);
          assert.equal(t.updates[0].password, "new-test-password");
          await t.page
            .getByRole("link", { name: "Kabinetə keç", exact: true })
            .click();
          await t.page.waitForURL("**/profile");
          assert.deepEqual(t.errors, []);
          await t.context.close();
        },
      );
    }
    await check(
      "returning to the waiting login tab keeps the recovery destination",
      async () => {
        const t = await setup();
        await t.page.goto(`${base}/login`);
        await t.page.evaluate(
          (email) =>
            sessionStorage.setItem(
              "kiraye:pending-confirmation",
              JSON.stringify({
                type: "recovery",
                email,
                retryAt: Date.now(),
                expiresAt: Date.now() + 1800000,
              }),
            ),
          user.email,
        );
        await t.page.goto(`${base}/reset-password${fragment}`);
        await t.page.getByLabel("Yeni şifrə", { exact: true }).waitFor();
        await t.page.goto(`${base}/login`);
        await t.page.waitForURL("**/reset-password");
        await t.page.getByLabel("Yeni şifrə", { exact: true }).waitFor();
        await t.context.close();
      },
    );
    await check(
      "expired link cannot show or submit a password form",
      async () => {
        const t = await setup();
        await t.page.goto(
          `${base}/reset-password#error=access_denied&error_code=otp_expired`,
        );
        await t.page
          .getByRole("status")
          .filter({ hasText: "vaxtı bitib" })
          .waitFor();
        assert.equal(
          await t.page.getByLabel("Yeni şifrə", { exact: true }).count(),
          0,
        );
        assert.equal(t.updates.length, 0);
        await t.context.close();
      },
    );
    await check(
      "plain password page without session offers recovery instead of a blank screen",
      async () => {
        const t = await setup();
        await t.page.goto(`${base}/reset-password`);
        await t.page
          .getByRole("button", { name: "Yenidən yoxla", exact: true })
          .waitFor();
        assert.equal(
          await t.page.getByLabel("Yeni şifrə", { exact: true }).count(),
          0,
        );
        await t.context.close();
      },
    );
    console.log(`${checks} password recovery checks passed`);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
