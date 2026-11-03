// Runs before the site becomes interactive.

// 1. iOS 15 Safari (iPhone 7/8) has no AbortSignal.timeout: the cabinet listings request used to fail there.
type AnySignal = typeof AbortSignal & { timeout?: (ms: number) => AbortSignal };
const signalApi = (typeof AbortSignal !== "undefined" ? AbortSignal : undefined) as AnySignal | undefined;
if (signalApi && typeof signalApi.timeout !== "function") {
  signalApi.timeout = (ms: number) => { const controller = new AbortController(); setTimeout(() => controller.abort(), ms); return controller.signal; };
}

// 2. Page-state classes on <body>/<html> (cabinet, leader panel, open chat, login…). The stylesheet uses these
//    classes instead of body:has(…) / html:has(…): in Safari a page-level :has() makes every change on the page
//    re-check the whole page's styles, which old iPhones feel as freezing. One check per frame at most.
if (typeof document !== "undefined") {
  const bodyStates: [string, string][] = [["kz-chat-open", ".kzMessages.hasConversation"], ["kz-messages", ".kzMessages"], ["kz-tabbar-hidden", ".kzTabbarHidden"], ["kz-compact", ".kzHeaderCompact"], ["kz-account", ".accountDashboard"], ["kz-account-page", ".kzAccountPage"], ["kz-admin", ".kzAdmin"], ["kz-rental-home", ".rentalHome"], ["kz-sticky-contact", ".stickyContact"]];
  const htmlStates: [string, string][] = [["kz-soft-page", ".accountDashboard,.kzAccountPage,.kzAdmin"], ["kz-login", ".loginPage"]];
  let queued = false;
  const sync = () => {
    queued = false;
    const body = document.body; if (!body) return;
    for (const [name, selector] of bodyStates) { const on = !!document.querySelector(selector); if (body.classList.contains(name) !== on) body.classList.toggle(name, on); }
    for (const [name, selector] of htmlStates) { const on = !!document.querySelector(selector); if (document.documentElement.classList.contains(name) !== on) document.documentElement.classList.toggle(name, on); }
  };
  const later = () => { if (!queued) { queued = true; requestAnimationFrame(sync); } };
  const start = () => { sync(); new MutationObserver(later).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] }); };
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
}

// 3. Leader panel diagnostics: on the phone, JavaScript errors and freezes longer than a second are written in a
//    small box at the bottom of /admin, so a screenshot shows what went wrong on that device.
if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
  const notes: string[] = [];
  const show = (text: string) => {
    notes.unshift(`${new Date().toLocaleTimeString("az-AZ")} · ${text}`.slice(0, 220));
    notes.length = Math.min(notes.length, 4);
    let box = document.getElementById("kz-diagnostics");
    if (!box) {
      box = document.createElement("div"); box.id = "kz-diagnostics";
      box.setAttribute("style", "position:fixed;left:8px;right:8px;bottom:calc(76px + env(safe-area-inset-bottom));z-index:99999;padding:8px 10px;border-radius:10px;background:#fef2f2;border:1px solid #fca5a5;color:#991b1b;font:12px/1.4 -apple-system,system-ui,sans-serif;white-space:pre-wrap;box-shadow:0 4px 16px rgba(0,0,0,.12)");
      box.addEventListener("click", () => box?.remove());
      document.body?.appendChild(box);
    }
    box.textContent = `Texniki qeyd (şəklini çəkib göndərin, bağlamaq üçün toxunun):\n${notes.join("\n")}`;
  };
  window.addEventListener("error", event => show(`Xəta: ${event.message} (${String(event.filename || "").split("/").pop()}:${event.lineno})`));
  window.addEventListener("unhandledrejection", event => show(`Xəta: ${String((event.reason && (event.reason.message || event.reason)) || "naməlum").slice(0, 160)}`));
  let last = Date.now();
  setInterval(() => { const now = Date.now(), gap = now - last - 250; last = now; if (gap > 1000 && !document.hidden) show(`Donma: ${(gap / 1000).toFixed(1)} san · ${window.location.search || "panel"}`); }, 250);
}
