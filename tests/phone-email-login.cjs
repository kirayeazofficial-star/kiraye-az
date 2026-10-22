// All Supabase requests intercepted. Never sends real SMS/email or creates users.
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const phoneHelpers = {};
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("lib/phone-auth.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { exports: phoneHelpers },
);
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3020";
  let count = 0;
  async function check(name, fn) {
    await fn();
    count++;
    console.log("PASS", name);
  }
  const errors = [];
  async function setup({
    enabled = true,
    repeated = false,
    senderError = false,
    settingsError = false,
    rateLimited = false,
  } = {}) {
    const context = await browser.newContext({
      viewport: { width: 1366, height: 768 },
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    const calls = [];
    const user = {
      id: "11111111-1111-4111-8111-111111111111",
      aud: "authenticated",
      role: "authenticated",
      phone: "994501234567",
      app_metadata: { provider: "phone" },
      user_metadata: {},
      created_at: new Date().toISOString(),
    };
    const jwt = `${Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: user.id, aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.mock`;
    await page.route("https://*.supabase.co/**", async (route) => {
      const req = route.request(),
        path = new URL(req.url()).pathname;
      const headers = {
        "access-control-allow-origin": "*",
        "x-supabase-api-version": "2024-01-01",
        "access-control-allow-headers": "*",
        "access-control-allow-methods": "*",
      };
      if (req.method() === "OPTIONS")
        return route.fulfill({ status: 204, headers });
      if (req.method() === "HEAD" && path.includes("/rest/v1/listings"))
        return route.fulfill({
          status: 200,
          headers: {
            ...headers,
            "content-range": "*/0",
            "access-control-expose-headers": "content-range",
          },
        });
      calls.push({ path, data: req.postData() ? req.postDataJSON() : null });
      let body = {},
        status = 200;
      if (path.endsWith("/settings")) {
        body = { external: { phone: enabled, email: true } };
        if (settingsError) status = 503;
      } else if (path.endsWith("/otp")) body = { message_id: "mock-message" };
      else if (path.endsWith("/verify")) {
        if (req.postDataJSON().token !== "123456") {
          status = 403;
          body = {
            code: "otp_expired",
            message: "Token has expired or is invalid",
          };
        } else
          body = {
            access_token: jwt,
            refresh_token: "mock-refresh",
            token_type: "bearer",
            expires_in: 3600,
            user,
          };
      } else if (path.endsWith("/user")) body = user;
      else if (path.includes("/rest/v1/profiles"))
        body = {
          id: user.id,
          display_name: "Telefon istifadəçisi",
          phone: null,
          role: "user",
        };
      else if (path.includes("/rest/v1/listings")) body = [];
      else if (path.endsWith("/signup")) {
        if (rateLimited) {
          status = 429;
          body = {
            code: "over_email_send_rate_limit",
            message: "Please try again after 95 seconds",
          };
        } else if (senderError) {
          status = 500;
          body = {
            code: "unexpected_failure",
            message: "Error sending confirmation email",
          };
        } else
          body = {
            user: {
              ...user,
              email: "browser@example.invalid",
              identities: repeated ? [] : [{ provider: "email" }],
            },
            session: null,
          };
      } else if (path.endsWith("/resend")) body = {};
      else throw new Error(`Unexpected request: ${path}`);
      await route.fulfill({
        status,
        contentType: "application/json",
        headers,
        body: JSON.stringify(body),
      });
    });
    await page.goto(`${base}/login`);
    if (enabled && !settingsError)
      await page
        .getByRole("button", { name: "Telefonla", exact: true })
        .click();
    return { page, context, calls };
  }
  async function signup(page) {
    if (
      await page.getByRole("button", { name: "E-poçtla", exact: true }).count()
    )
      await page.getByRole("button", { name: "E-poçtla", exact: true }).click();
    await page
      .getByRole("link", {
        name: "Hesabın yoxdur? Qeydiyyatdan keç",
        exact: true,
      })
      .click();
    await page
      .getByLabel("E-poçt", { exact: true })
      .fill("browser@example.invalid");
    await page.getByLabel("Şifrə", { exact: true }).fill("safe-test-password");
    await page
      .getByRole("button", { name: "Hesab yarat", exact: true })
      .click();
  }
  try {
    await check(
      "local and pasted international mobile numbers normalize; landlines and malformed numbers rejected",
      async () => {
        for (const value of [
          "050 123 45 67",
          "50 123 45 67",
          "+994 (50) 123-45-67",
          "00994501234567",
        ])
          assert.equal(phoneHelpers.normalizeMobile(value), "+994501234567");
        for (const value of [
          "0121234567",
          "+90501234567",
          "5012345678",
          "50abc4567",
          "",
        ])
          assert.equal(phoneHelpers.normalizeMobile(value), null);
      },
    );
    await check(
      "disabled or unreachable phone provider keeps the email form usable",
      async () => {
        for (const options of [{ enabled: false }, { settingsError: true }]) {
          const { page, context, calls } = await setup(options);
          await page.getByLabel("E-poçt", { exact: true }).waitFor();
          assert.equal(
            await page
              .getByRole("button", { name: "Telefonla", exact: true })
              .count(),
            0,
          );
          assert.equal(calls.filter((x) => x.path.endsWith("/otp")).length, 0);
          await context.close();
        }
      },
    );
    await check(
      "SMS request normalizes phone, rate limits resends, rejects wrong code, and opens a phone-only cabinet",
      async () => {
        const { page, context, calls } = await setup();
        await page
          .getByLabel("Mobil nömrə", { exact: true })
          .fill("050 123 45 67");
        await page
          .getByRole("button", { name: "SMS kodu al", exact: true })
          .click();
        await page.getByLabel("SMS kodu", { exact: true }).waitFor();
        const call = calls.find((x) => x.path.endsWith("/otp"));
        assert.equal(call.data.phone, "+994501234567");
        assert.equal(call.data.channel, "sms");
        assert.equal(call.data.create_user, true);
        assert.equal(
          await page.getByRole("button", { name: /Yeni kod \(/ }).isDisabled(),
          true,
        );
        await page.getByLabel("SMS kodu", { exact: true }).fill("999999");
        await page
          .getByRole("button", { name: "Təsdiqlə və daxil ol", exact: true })
          .click();
        await page
          .getByRole("alert")
          .filter({ hasText: "düzgün deyil" })
          .waitFor();
        assert.equal(new URL(page.url()).pathname, "/login");
        await page.getByLabel("SMS kodu", { exact: true }).fill("123456");
        await page
          .getByRole("button", { name: "Təsdiqlə və daxil ol", exact: true })
          .click();
        await page.waitForURL("**/profile");
        await page.getByRole("navigation", { name: "Şəxsi kabinet" }).waitFor();
        await page
          .getByRole("heading", { name: "Elanlarım", exact: true })
          .waitFor();
        assert.equal(
          await page
            .getByRole("link", {
              name: "Daxil ol / Qeydiyyatdan keç",
              exact: true,
            })
            .count(),
          0,
        );
        await page.setViewportSize({ width: 390, height: 844 });
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        );
        await page.screenshot({
          path: "/tmp/kiraye-cabinet-390.png",
          fullPage: true,
        });
        await page.goto(`${base}/new`);
        await page
          .getByLabel("Kateqoriya", { exact: true })
          .selectOption("property");
        assert.equal(
          await page.getByLabel(/Telefon nömrəsi/).inputValue(),
          "994501234567",
        );
        await context.close();
      },
    );
    await check(
      "email link confirmation is primary; code optional; pending state survives reload with resend cooldown",
      async () => {
        const { page, context, calls } = await setup();
        await signup(page);
        await page
          .getByRole("heading", { name: "E-poçtunu yoxla", exact: true })
          .waitFor();
        assert.equal(
          await page.getByLabel("Təsdiq kodu", { exact: true }).count(),
          0,
        );
        assert.equal(
          await page
            .getByRole("button", { name: /Yenidən göndər \(/ })
            .isDisabled(),
          true,
        );
        await page.reload();
        await page
          .getByRole("heading", { name: "E-poçtunu yoxla", exact: true })
          .waitFor();
        assert.equal(
          await page
            .getByRole("button", { name: /Yenidən göndər \(/ })
            .isDisabled(),
          true,
        );
        await page
          .getByRole("button", {
            name: "Məktubda rəqəmli kod var",
            exact: true,
          })
          .click();
        await page.getByLabel("Təsdiq kodu", { exact: true }).waitFor();
        assert.equal(calls.filter((x) => x.path.endsWith("/resend")).length, 0);
        await context.close();
      },
    );
    await check(
      "email sending rate limit survives reload and does not block password login",
      async () => {
        const { page, context, calls } = await setup({ rateLimited: true });
        await signup(page);
        await page
          .getByRole("status")
          .filter({ hasText: "Təkrar cəhd üçün" })
          .waitFor();
        assert.equal(
          await page
            .getByRole("button", { name: "Hesab yarat", exact: true })
            .isDisabled(),
          true,
        );
        await page.reload();
        // The signup URL now restores signup directly, including its cooldown.
        await page
          .getByRole("heading", { name: "Hesab yarat", exact: true })
          .waitFor();
        assert.equal(
          await page
            .getByRole("button", { name: "Hesab yarat", exact: true })
            .isDisabled(),
          true,
        );
        assert.equal(calls.filter((x) => x.path.endsWith("/signup")).length, 1);
        await page
          .getByRole("link", { name: "Hesabın var? Daxil ol", exact: true })
          .click();
        await page.waitForFunction(() => {
          const submit = document.querySelector(".authSubmit");
          return submit && !submit.disabled;
        });
        assert.equal(
          await page
            .getByRole("button", { name: "Daxil ol →", exact: true })
            .isEnabled(),
          true,
        );
        await context.close();
      },
    );
    await check(
      "repeat registration is directed to login rather than waiting for a nonexistent message",
      async () => {
        const { page, context } = await setup({ repeated: true });
        await signup(page);
        await page
          .getByRole("status")
          .filter({ hasText: "Bu e-poçtla artıq qeydiyyatdan keçmisən" })
          .waitFor();
        assert.equal(
          await page
            .getByRole("heading", { name: "E-poçtunu yoxla", exact: true })
            .count(),
          0,
        );
        await context.close();
      },
    );
    await check(
      "sender failure is shown honestly without false confirmation state",
      async () => {
        const { page, context } = await setup({ senderError: true });
        await signup(page);
        await page
          .getByRole("status")
          .filter({ hasText: "göndərilə bilmədi" })
          .waitFor();
        assert.equal(
          await page
            .getByRole("heading", { name: "E-poçtunu yoxla", exact: true })
            .count(),
          0,
        );
        await context.close();
      },
    );
    await check(
      "login and catalog fit desktop and small mobile widths with compact controls",
      async () => {
        const { page, context } = await setup({ enabled: false });
        for (const [width, height] of [
          [1536, 720],
          [1366, 768],
          [390, 844],
          [320, 568],
        ]) {
          await page.setViewportSize({ width, height });
          await page.goto(`${base}/login`);
          await page.getByLabel("E-poçt", { exact: true }).waitFor();
          await page.waitForFunction(() => !document.querySelector(".authSubmit")?.disabled);
          const card = await page.locator(".loginPage section").boundingBox();
          assert(card.width <= 401);
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            true,
          );
          const input = await page
            .getByLabel("E-poçt", { exact: true })
            .boundingBox();
          assert(input.height >= 40 && input.height <= 48);
          if (width >= 1000) assert(card.y + card.height < height);
          await page.screenshot({
            path: `/tmp/kiraye-login-${width}.png`,
            fullPage: true,
          });
          await page.goto(base);
          await page.locator(".catalogIntro").waitFor();
          await page.locator(".skeleton").first().waitFor({ state: "hidden" });
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            true,
          );
          await page.screenshot({
            path: `/tmp/kiraye-catalog-${width}.png`,
            fullPage: true,
          });
        }
        await context.close();
      },
    );
    assert.deepEqual(errors, []);
    console.log(`${count} phone/email checks passed`);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
