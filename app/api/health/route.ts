import { readFileSync } from "node:fs";
import { join } from "node:path";
export const dynamic = "force-dynamic";
// Process readiness only. Does not claim that external Auth/Storage is healthy.
export function GET() {
  let buildId: string | null = null;
  try { buildId = readFileSync(join(process.cwd(), ".next", "BUILD_ID"), "utf8").trim(); } catch {}
  return Response.json(
    { status: "ok", buildId },
    { headers: { "Cache-Control": "no-store" } },
  );
}
