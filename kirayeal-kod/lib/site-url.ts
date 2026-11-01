export function publicSiteUrl() {
  try {
    const value = new URL(
      process.env.NEXT_PUBLIC_SITE_URL || "https://kirayeal.az",
    );
    return value.protocol === "https:"
      ? value.origin
      : "https://kirayeal.az";
  } catch {
    return "https://kirayeal.az";
  }
}
