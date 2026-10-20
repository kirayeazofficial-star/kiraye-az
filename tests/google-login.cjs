// Provider and callback responses are simulated. No real Google login is attempted.
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3041";
  let count = 0;
  async function check(name, fn) {
    await fn();
    count++;
    console.log("PASS", name);
  }
  const errors = [];
  async function setup(enabled, next = "/profile") {
    const ctx = await browser.newContext({
        viewport: { width: 1366, height: 768 },
      }),
      page = await ctx.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    const calls = [];
    const user = {
      id: "11111111-1111-4111-8111-111111111111",
      email: "google-test@example.invalid",
      aud: "authenticated",
      role: "authenticated",
      app_metadata: { provider: "google" },
      user_metadata: { full_name: "Google Test" },
      created_at: new Date().toISOString(),
    };
    const jwt = `${Buffer.from("{}").toString("base64url")}.${Buffer.from(JSON.stringify({ sub: user.id, aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.mock`;
    await page.route("https://*.supabase.co/**", async (route) => {
      const req = route.request(),
        url = new URL(req.url()),
        path = url.pathname;
      const headers = {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "*",
        "access-control-allow-methods": "*",
      };
      if (req.method() === "OPTIONS")
        return route.fulfill({ status: 204, headers });
      calls.push({ path, params: Object.fromEntries(url.searchParams) });
      let body = {};
      if (path.endsWith("/settings"))
        body = { external: { google: enabled, email: true, phone: false } };
      else if (path.endsWith("/authorize")) {
        assert.equal(url.searchParams.get("provider"), "google");
        const redirect = new URL(url.searchParams.get("redirect_to"));
        assert.equal(redirect.pathname, "/auth/callback");
        assert(!redirect.hostname.includes("localhost"));
        return route.fulfill({
          status: 302,
          headers: {
            ...headers,
            location: `${base}/auth/callback${redirect.search}#access_token=${jwt}&refresh_token=mock-refresh&expires_in=3600&token_type=bearer`,
          },
        });
      } else if (path.endsWith("/user")) body = user;
      else if (path.includes("/rest/v1/profiles"))
        body = { id: user.id, role: "user", display_name: "Google Test" };
      else if (path.includes("/rest/v1/listings")) body = [];
      else throw new Error(`Unexpected request: ${path}`);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers,
        body: JSON.stringify(body),
      });
    });
    await page.goto(`${base}/login?next=${encodeURIComponent(next)}`);
    return { ctx, page, calls };
  }
  try {
    await check(
      "disabled Google provider is visible and cannot start a fake login",
      async () => {
        const { ctx, page, calls } = await setup(false);
        await page
          .getByText(
            "Google ilə giriş hələ aktiv deyil. E-poçtla davam edə bilərsən.",
            { exact: true },
          )
          .waitFor();
        assert.equal(
          await page
            .getByRole("button", { name: "Google ilə davam et", exact: true })
            .isDisabled(),
          true,
        );
        assert.equal(
          calls.some((x) => x.path.endsWith("/authorize")),
          false,
        );
        await page.getByLabel("E-poçt", { exact: true }).waitFor();
        await ctx.close();
      },
    );
    await check(
      "Google callback establishes session and returns to unfinished rental submission",
      async () => {
        const { ctx, page, calls } = await setup(true, "/new");
        await page
          .getByRole("button", { name: "Google ilə davam et", exact: true })
          .click();
        await page.waitForURL("**/new");
        await page.getByLabel("Elanın başlığı", { exact: true }).waitFor();
        assert.equal(
          calls
            .find((x) => x.path.endsWith("/authorize"))
            .params.redirect_to.endsWith("/auth/callback?next=%2Fnew"),
          true,
        );
        await ctx.close();
      },
    );
    await check(
      "default Google login opens cabinet and does not require a separate email code",
      async () => {
        const { ctx, page } = await setup(true);
        await page
          .getByRole("button", { name: "Google ilə davam et", exact: true })
          .click();
        await page.waitForURL("**/profile");
        await page
          .getByRole("heading", { name: "Elanlarım", exact: true })
          .waitFor();
        await ctx.close();
      },
    );
    assert.deepEqual(errors, []);
    console.log(`${count} Google login checks passed`);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
