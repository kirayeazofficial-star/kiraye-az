export const dynamic = "force-dynamic";
// Process readiness only. Does not claim that external Auth/Storage is healthy.
export function GET() {
  return Response.json(
    { status: "ok" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
