import { sameOrigin } from "../../../../lib/server-request";
import {hostQuery} from "../../../../lib/host/db";
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
  try {
    const rows=await hostQuery<{exists:boolean}>(`select exists(select 1 from auth.users where lower(email)=lower($1) and disabled_at is null) as exists`,[email]);
    return reply({exists:rows[0]?.exists===true});
  } catch { return reply({code:"recovery_check_unavailable"},503); }
}
