// Small polyfills for older phones (iPhone 7/8 and others stay on iOS 15, Safari 15): these run before the
// site becomes interactive, so newer browser features used by the site do not break there.
type AnySignal = typeof AbortSignal & { timeout?: (ms: number) => AbortSignal };
const signal = (typeof AbortSignal !== "undefined" ? AbortSignal : undefined) as AnySignal | undefined;
if (signal && typeof signal.timeout !== "function") {
  signal.timeout = (ms: number) => { const controller = new AbortController(); setTimeout(() => controller.abort(new DOMException("TimeoutError", "TimeoutError")), ms); return controller.signal; };
}
const arrays = Array.prototype as unknown as Record<string, unknown>;
if (typeof arrays.findLast !== "function") arrays.findLast = function <T>(this: T[], test: (item: T, index: number, list: T[]) => boolean) { for (let i = this.length - 1; i >= 0; i--) if (test(this[i], i, this)) return this[i]; return undefined; };
if (typeof arrays.findLastIndex !== "function") arrays.findLastIndex = function <T>(this: T[], test: (item: T, index: number, list: T[]) => boolean) { for (let i = this.length - 1; i >= 0; i--) if (test(this[i], i, this)) return i; return -1; };
const cryptoApi = (typeof crypto !== "undefined" ? crypto : undefined) as (Crypto & { randomUUID?: () => string }) | undefined;
if (cryptoApi && typeof cryptoApi.randomUUID !== "function" && typeof cryptoApi.getRandomValues === "function") {
  cryptoApi.randomUUID = () => { const b = cryptoApi.getRandomValues(new Uint8Array(16)); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128; const h = [...b].map(x => x.toString(16).padStart(2, "0")).join(""); return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}` as `${string}-${string}-${string}-${string}-${string}`; };
}
if (typeof (globalThis as { structuredClone?: unknown }).structuredClone !== "function") (globalThis as { structuredClone?: unknown }).structuredClone = (value: unknown) => JSON.parse(JSON.stringify(value));

// Browsers without CSS :has() (Chrome < 105, older Samsung Internet, Firefox < 121): mirror the few page states
// the layout depends on as classes on <body> (open chat, hidden tab bar, compact header).
if (typeof document !== "undefined" && typeof CSS !== "undefined" && !CSS.supports?.("selector(:has(a))")) {
  const states: [string, string][] = [["kz-chat-open", ".kzMessages.hasConversation"], ["kz-messages", ".kzMessages"], ["kz-tabbar-hidden", ".kzTabbarHidden"], ["kz-compact", ".kzHeaderCompact"]];
  const sync = () => { const body = document.body; if (!body) return; for (const [name, selector] of states) body.classList.toggle(name, !!document.querySelector(selector)); };
  const start = () => { sync(); new MutationObserver(sync).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] }); };
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
}

// Several parts of a page ask the server the same questions at load (who is signed in, the profile, unread
// messages). On shared hosting each answer takes about a second, so identical GET requests made at the same
// moment share one network request (for 2 seconds). Signing in or out clears it.
if (typeof window !== "undefined" && typeof window.fetch === "function") {
  const shared = new Map<string, { at: number; response: Promise<Response> }>();
  const sharable = /^\/api\/(auth\/host|account\/profile|settings|messages\?action=unread|stores\?mine=1|listings\/limits)$/;
  const original = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const path = url.startsWith(location.origin) ? url.slice(location.origin.length) : url;
      const method = (init?.method || (typeof input === "object" && "method" in input ? input.method : "GET")).toUpperCase();
      if (method !== "GET") { if (path.startsWith("/api/auth/") || path.startsWith("/api/account/")) shared.clear(); return original(input, init); }
      if (!sharable.test(path) || init?.signal) return original(input, init);
      const hit = shared.get(path);
      if (hit && Date.now() - hit.at < 2000) return hit.response.then(response => response.clone());
      const response = original(input, init);
      shared.set(path, { at: Date.now(), response });
      response.catch(() => shared.delete(path));
      return response.then(r => r.clone());
    } catch { return original(input, init); }
  };
}
