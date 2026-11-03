"use client";
// Short success message shown at the edge of the screen (green, with ✕, gone after a few seconds).
// afterReload: the message is kept for the next page (for actions that reload the page).
export type NoticeKind = "success" | "error" | "info";
export function toast(text: string, options: { afterReload?: boolean; kind?: NoticeKind } = {}) {
  const detail = { text, kind: options.kind ?? "success" };
  if (options.afterReload) { try { sessionStorage.setItem("kz-toast", JSON.stringify(detail)); } catch { /* private mode */ } return; }
  window.dispatchEvent(new CustomEvent("kz-toast", { detail }));
}
