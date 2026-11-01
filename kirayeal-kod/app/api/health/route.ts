import { readFileSync } from "node:fs";
import { join } from "node:path";
export const dynamic = "force-dynamic";
// Process readiness only. Does not claim that external Auth/Storage is healthy.
export function GET() {
  let buildId: string | null = null;
  let commit: string | null = null;
  try { buildId = readFileSync(join(process.cwd(), ".next", "BUILD_ID"), "utf8").trim(); } catch {}
  try { commit = JSON.parse(readFileSync(join(process.cwd(), "DEPLOYED-RELEASE.json"), "utf8")).commit || null; } catch {}
  return Response.json(
    { status: "ok", buildId, commit },
    { headers: { "Cache-Control": "no-store" } },
  );
}
