export function publicSiteUrl() {
  try {
    const value = new URL(
      process.env.NEXT_PUBLIC_SITE_URL || "https://kiraye-az.vercel.app",
    );
    return value.protocol === "https:"
      ? value.origin
      : "https://kiraye-az.vercel.app";
  } catch {
    return "https://kiraye-az.vercel.app";
  }
}
