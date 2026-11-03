// Photo addresses for the place they are shown: "thumb" for cards and lists (~560 px), "view" for the
// listing page (~1200 px). Only the detail view may fall back to the original.
export function sized(src: string | undefined | null, size: "thumb" | "view" = "thumb") {
  if (!src) return src || "";
  if (src.startsWith("/api/media/")) {
    const [pathname, search = ""] = src.split("?", 2);
    const params = new URLSearchParams(search);
    params.set("s", size);
    // Previous immutable responses could contain full-size originals even for s=thumb.
    if (size === "thumb") params.set("v", "2");
    return `${pathname}?${params}`;
  }
  // Built-in sample photos have ready small copies in /samples/thumb/.
  if (size === "thumb" && /^\/samples\/[^/]+\.jpg$/.test(src)) return src.replace("/samples/", "/samples/thumb/");
  return src;
}
