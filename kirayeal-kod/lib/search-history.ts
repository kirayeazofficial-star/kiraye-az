const key = "kirayeal:search-history";
export function readSearchHistory(): string[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data) ? data.filter((value): value is string => typeof value === "string" && !!value.trim() && value.length <= 120).slice(0, 8) : [];
  } catch { return []; }
}
export function rememberSearch(query: string): string[] {
  const value = query.trim().replace(/\s+/g, " ").slice(0, 120);
  const history = value ? [value, ...readSearchHistory().filter(item => item.toLocaleLowerCase("az") !== value.toLocaleLowerCase("az"))].slice(0, 8) : readSearchHistory();
  try { localStorage.setItem(key, JSON.stringify(history)); } catch { /* Private browsing may disable storage. */ }
  return history;
}
export function clearSearchHistory() { try { localStorage.removeItem(key); } catch {} }
