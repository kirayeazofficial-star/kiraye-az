import { dateFormat } from "./date-format";
// "Mozilla/5.0 (Windows NT 10.0; Win64; x64) … Chrome/130…" → "Windows kompüter · Chrome": a short, readable device line
// for security e-mails (no model numbers or version strings).
export function deviceName(agent: string) {
  const ua = agent || "";
  const device = /iPhone/i.test(ua) ? "iPhone" : /iPad/i.test(ua) ? "iPad" : /Android/i.test(ua) ? (/Mobile/i.test(ua) ? "Android telefon" : "Android planşet")
    : /Windows/i.test(ua) ? "Windows kompüter" : /Macintosh|Mac OS X/i.test(ua) ? "Mac kompüter" : /Linux/i.test(ua) ? "Linux kompüter" : "";
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /SamsungBrowser/.test(ua) ? "Samsung Internet" : /YaBrowser/.test(ua) ? "Yandex" : /Firefox\//.test(ua) ? "Firefox"
    : /CriOS|Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "";
  return [device, browser].filter(Boolean).join(" · ") || "Naməlum cihaz";
}
// Date for e-mails, Baku time: "2 noyabr 2026, 01:17".
const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
export function letterDate(date = new Date()) {
  const parts = Object.fromEntries(dateFormat("en-GB", { timeZone: "Asia/Baku", year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(date).map(part => [part.type, part.value]));
  return `${Number(parts.day)} ${months[Number(parts.month) - 1]} ${parts.year}, ${parts.hour}:${parts.minute}`;
}
