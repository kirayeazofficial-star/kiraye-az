// Run from the hosting scheduler with secrets supplied through its private environment.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) || !key) {
  console.error("Expiry job needs the database endpoint and a private server credential.");
  process.exit(1);
}
const response = await fetch(`${url}/rest/v1/rpc/expire_listings`, {
  method: "POST", headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` },
  body: "{}", signal: AbortSignal.timeout(20000),
});
if (!response.ok) { console.error(`Expiry job failed (${response.status}).`); process.exit(1); }
const affected = await response.json();
console.log(`Expired listing records: ${Number.isInteger(affected) ? affected : "updated"}`);
