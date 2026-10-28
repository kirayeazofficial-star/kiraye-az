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
const messages = {};
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("lib/auth-messages.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { exports: messages },
);
const exported = {};
const testEnv = {};
vm.runInNewContext(source, {
  exports: exported,
  require: (path) => {
    if (path === "./auth-messages") return messages;
    throw new Error(path);
  },
  URL,
  URLSearchParams,
  process: { env: testEnv },
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
        "https://kirayeal.az/auth/callback",
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
      "https://kiraye.az/reset-password",
    ),
  );
  await check("non-local origin is retained when no site URL is configured", () =>
    assert.equal(
      authCallbackUrl("https://staging.example.com"),
      "https://staging.example.com/auth/callback",
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
  await check("OAuth callback retains a safe listing destination", async () => {
    assert.equal(
      authCallbackUrl("https://kiraye.az", false, "/new"),
      "https://kiraye.az/auth/callback?next=%2Fnew",
    );
    assert.equal(
      await completeEmailAuth(
        {
          auth: {
            getSession: async () => ({ data: { session: {} }, error: null }),
          },
        },
        "https://kiraye.az/auth/callback?next=/new",
      ),
      "/new",
    );
  });
  await check(
    "OAuth callback rejects external return destinations",
    async () => {
      assert.equal(
        await completeEmailAuth(
          {
            auth: {
              getSession: async () => ({ data: { session: {} }, error: null }),
            },
          },
          "https://kiraye.az/auth/callback?next=https://example.com",
        ),
        "/profile",
      );
    },
  );
  await check(
    "configured own-domain origin overrides the request origin for OAuth and recovery",
    async () => {
      testEnv.NEXT_PUBLIC_SITE_URL = "https://kiraye.az";
      try {
        assert.equal(
          authCallbackUrl("https://staging.example.com", false, "/new"),
          "https://kiraye.az/auth/callback?next=%2Fnew",
        );
        assert.equal(
          authCallbackUrl("http://localhost:3000", true),
          "https://kiraye.az/reset-password",
        );
      } finally {
        delete testEnv.NEXT_PUBLIC_SITE_URL;
      }
    },
  );
  console.log(`${count} authentication regression checks passed`);
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
