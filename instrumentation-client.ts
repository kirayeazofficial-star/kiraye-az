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
  const bodyStates: [string, string][] = [["kz-chat-open", ".kzMessages.hasConversation"], ["kz-messages", ".kzMessages"], ["kz-tabbar-hidden", ".kzTabbarHidden"], ["kz-compact", ".kzHeaderCompact"], ["kz-account", ".accountDashboard"], ["kz-account-page", ".kzAccountPage"], ["kz-admin", ".kzAdmin"], ["kz-admin-menu", ".kzAdMenu"], ["kz-rental-home", ".rentalHome"], ["kz-sticky-contact", ".stickyContact"]];
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
