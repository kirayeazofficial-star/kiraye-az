import { createHmac } from "node:crypto";
import { sameOrigin, trustedClientIp } from "../../../../lib/server-request";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reply = (body: object, status = 200) => Response.json(body, {
  status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
});
export async function POST(request: Request) {
  if (!sameOrigin(request)) return reply({code:"forbidden"},403);
  let email: string;
  try {
    const reader = request.body?.getReader();
    if (!reader) return reply({code:"invalid_email"},400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 1024) { await reader.cancel(); return reply({code:"invalid_email"},400); }
      chunks.push(value);
    }
    const text = Buffer.concat(chunks).toString("utf8");
    const input = JSON.parse(text);
    email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply({code:"invalid_email"},400);
  } catch { return reply({code:"invalid_email"},400); }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (process.env.NEXT_PUBLIC_SUPABASE_ENABLED !== "true" || !url || !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url) || !serviceKey)
    return reply({code:"recovery_check_unavailable"},503);
  const ip = trustedClientIp(request);
  if (!ip) return reply({code:"recovery_check_unavailable"},503);
  const fingerprint = createHmac("sha256",serviceKey).update(ip).digest("hex");
  try {
    const result = await fetch(`${url.replace(/\/$/,"")}/rest/v1/rpc/recovery_email_exists`, {
      method:"POST", headers:{apikey:serviceKey, Authorization:`Bearer ${serviceKey}`, "Content-Type":"application/json"},
      body:JSON.stringify({p_email:email,p_client_key:fingerprint}),
      signal:AbortSignal.timeout(10000), cache:"no-store",
    });
    const data = await result.json();
    if (!result.ok) return reply({code:data?.code === "PR429" ? "rate_limited" : "recovery_check_unavailable"},data?.code === "PR429" ? 429 : 503);
    if (typeof data !== "boolean") return reply({code:"recovery_check_unavailable"},503);
    return reply({exists:data});
  } catch { return reply({code:"recovery_check_unavailable"},503); }
}
