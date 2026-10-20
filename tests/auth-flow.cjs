const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const source = ts.transpileModule(fs.readFileSync("lib/auth-flow.ts", "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
const exported = {};
vm.runInNewContext(source, {
  exports: exported,
  URL,
  URLSearchParams,
  process: { env: {} },
});
const { authCallbackUrl, completeEmailAuth } = exported;
(async () => {
  let count = 0;
  async function check(name, fn) {
    await fn();
    count++;
    console.log("PASS", name);
  }
  await check("local development never sends confirmation to localhost", () => {
    for (const origin of [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://[::1]:3000",
    ])
      assert.equal(
        authCallbackUrl(origin),
        "https://kiraye-az.vercel.app/auth/callback",
      );
  });
  await check("production host retained for confirmation", () =>
    assert.equal(
      authCallbackUrl("https://kiraye.az"),
      "https://kiraye.az/auth/callback",
    ),
  );
  await check("password recovery retains its destination through PKCE", () =>
    assert.equal(
      authCallbackUrl("https://kiraye.az", true),
      "https://kiraye.az/auth/callback?flow=recovery",
    ),
  );
  await check("preview emails return to the stable production hostname", () =>
    assert.equal(
      authCallbackUrl("https://kiraye-preview-aaa-c624.vercel.app"),
      "https://kiraye-az.vercel.app/auth/callback",
    ),
  );
  const session = { access_token: "test-session" };
  const client = {
    auth: { getSession: async () => ({ data: { session }, error: null }) },
  };
  await check("implicit confirmation session reaches profile", async () =>
    assert.equal(
      await completeEmailAuth(
        client,
        "https://kiraye.az/auth/callback#access_token=test&type=signup",
      ),
      "/profile",
    ),
  );
  await check("implicit recovery session reaches password form", async () =>
    assert.equal(
      await completeEmailAuth(
        client,
        "https://kiraye.az/auth/callback#type=recovery",
      ),
      "/reset-password",
    ),
  );
  await check("PKCE recovery session retains recovery route", async () =>
    assert.equal(
      await completeEmailAuth(
        client,
        "https://kiraye.az/auth/callback?flow=recovery&code=test",
      ),
      "/reset-password",
    ),
  );
  await check("expired verification errors are visible", async () =>
    assert.rejects(
      completeEmailAuth(
        client,
        "https://kiraye.az/auth/callback#error=access_denied",
      ),
      /vaxtı bitib/,
    ),
  );
  await check("empty callback cannot report success", async () =>
    assert.rejects(
      completeEmailAuth(
        {
          auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
          },
        },
        "https://kiraye.az/auth/callback",
      ),
      /Təsdiq tamamlanmadı/,
    ),
  );
  await check("PKCE code exchanged when no initial session", async () => {
    let received;
    const fake = {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        exchangeCodeForSession: async (code) => {
          received = code;
          return { data: { session }, error: null };
        },
      },
    };
    assert.equal(
      await completeEmailAuth(
        fake,
        "https://kiraye.az/auth/callback?code=test-code",
      ),
      "/profile",
    );
    assert.equal(received, "test-code");
  });
  await check("bad PKCE code gives a recovery instruction", async () =>
    assert.rejects(
      completeEmailAuth(
        {
          auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            exchangeCodeForSession: async () => ({
              error: new Error("bad code"),
            }),
          },
        },
        "https://kiraye.az/auth/callback?code=bad",
      ),
      /brauzerdə açın/,
    ),
  );
  await check("token hash confirmation is verified", async () => {
    let received;
    const fake = {
      auth: {
        ...client.auth,
        verifyOtp: async (args) => {
          received = args;
          return { error: null };
        },
      },
    };
    await completeEmailAuth(
      fake,
      "https://kiraye.az/auth/callback?token_hash=test-hash&type=signup",
    );
    assert.equal(received.token_hash, "test-hash");
    assert.equal(received.type, "signup");
  });
  await check("unknown verification type is rejected", async () =>
    assert.rejects(
      completeEmailAuth(
        client,
        "https://kiraye.az/auth/callback?token_hash=test&type=admin",
      ),
      /növü düzgün deyil/,
    ),
  );
  console.log(`${count} authentication regression checks passed`);
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
