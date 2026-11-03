"use client";
import { useLayoutEffect } from "react";

// Keep page-level CSS selectors inexpensive on old browsers. Class updates must
// start after hydration, otherwise they disagree with the server's <html>/<body>.
const bodyStates: [string, string][] = [["kz-chat-open", ".kzMessages.hasConversation"], ["kz-messages", ".kzMessages"], ["kz-tabbar-hidden", ".kzTabbarHidden"], ["kz-compact", ".kzHeaderCompact"], ["kz-account", ".accountDashboard"], ["kz-account-page", ".kzAccountPage"], ["kz-admin", ".kzAdmin"], ["kz-admin-menu", ".kzAdMenu"], ["kz-rental-home", ".rentalHome"], ["kz-sticky-contact", ".stickyContact"]];
const htmlStates: [string, string][] = [["kz-soft-page", ".accountDashboard,.kzAccountPage,.kzAdmin"], ["kz-login", ".loginPage"]];

export default function PageState() {
  useLayoutEffect(() => {
    let frame: number | null = null;
    const sync = () => {
      frame = null;
      for (const [root, states] of [[document.body, bodyStates], [document.documentElement, htmlStates]] as const) {
        for (const [name, selector] of states) {
          const on = !!document.querySelector(selector);
          if (root.classList.contains(name) !== on) root.classList.toggle(name, on);
        }
      }
    };
    const later = () => { if (frame === null) frame = requestAnimationFrame(sync); };
    sync();
    const observer = new MutationObserver(later);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
    return () => { observer.disconnect(); if (frame !== null) cancelAnimationFrame(frame); };
  }, []);
  return null;
}
