// Build-time check: NEXT_PUBLIC_SITE_URL must be the public HTTPS origin.
const fail = (message) => {
  console.error(message);
  process.exit(1);
};
try {
  const site = new URL(process.env.NEXT_PUBLIC_SITE_URL || "");
  if (
    site.protocol !== "https:" ||
    site.username ||
    site.password ||
    site.pathname !== "/" ||
    site.search ||
    site.hash
  )
    fail("NEXT_PUBLIC_SITE_URL must contain only the public HTTPS origin.");
} catch {
  fail("NEXT_PUBLIC_SITE_URL must be your public HTTPS website origin.");
}
console.log("Public deployment configuration is valid.");
