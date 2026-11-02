// Photo addresses for the place they are shown: "thumb" for cards and lists (~560 px), "view" for the
// listing page (~1200 px). The server falls back to the original when a smaller copy does not exist.
export function sized(src: string | undefined | null, size: "thumb" | "view" = "thumb") {
  if (!src) return src || "";
  if (src.startsWith("/api/media/") && !src.includes("?")) return `${src}?s=${size}`;
  // Built-in sample photos have ready small copies in /samples/thumb/.
  if (size === "thumb" && /^\/samples\/[^/]+\.jpg$/.test(src)) return src.replace("/samples/", "/samples/thumb/");
  return src;
}
