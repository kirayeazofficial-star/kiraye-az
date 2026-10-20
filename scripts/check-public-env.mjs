const fail = (message) => {
  console.error(message);
  process.exit(1);
};
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
if (!url || !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url))
  fail("NEXT_PUBLIC_SUPABASE_URL must be the project's HTTPS Supabase URL.");
if (!key || !/^(sb_publishable_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_.-]+)$/.test(key))
  fail("A browser-safe Supabase publishable or anon key is required.");
if (key.startsWith("eyJ")) {
  try {
    if (JSON.parse(Buffer.from(key.split(".")[1], "base64url")).role !== "anon")
      fail("Only an anon JWT is allowed in NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  } catch {
    fail("Invalid anon JWT format.");
  }
}
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
