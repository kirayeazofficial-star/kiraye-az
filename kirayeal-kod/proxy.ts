import { NextResponse, type NextRequest } from "next/server";
import { Pool } from "pg";
import { createHash } from "node:crypto";

// Maintenance mode (Rəhbər paneli → «Sayt ayarları»): while it is on, visitors get the "technical work" page
// (HTTP 503, so search engines keep the site); the leader and admins use the site as usual and the login
// page stays open. Anything going wrong here lets the request through — the site never breaks because of it.
const OWNER = "kirayeal.az@gmail.com";
let pool: Pool | undefined;
const db = () => pool ??= new Pool({
  host: process.env.KIRAYE_DB_HOST, port: Number(process.env.KIRAYE_DB_PORT || 5432), database: process.env.KIRAYE_DB_NAME,
  user: process.env.KIRAYE_DB_USER, password: process.env.KIRAYE_DB_PASSWORD, max: 2, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 3_000,
});
let flag = { on: false, at: 0 };
const staffCache = new Map<string, { staff: boolean; at: number }>();

async function maintenanceOn() {
  if (Date.now() - flag.at < 15_000) return flag.on;
  const rows = await db().query<{ on: boolean | null }>(`select (value->>'enabled')::boolean as on from public.site_settings where key='maintenance'`);
  flag = { on: rows.rows[0]?.on === true, at: Date.now() };
  return flag.on;
}
async function isStaff(token: string) {
  const hit = staffCache.get(token);
  if (hit && Date.now() - hit.at < 60_000) return hit.staff;
  const rows = await db().query<{ email: string; role: string | null; staff_role: string | null }>(
    `select u.email,p.role,m.staff_role from auth.sessions s join auth.users u on u.id=s.user_id left join public.profiles p on p.id=u.id left join public.staff_members m on m.user_id=u.id
      where s.token_hash=$1 and s.revoked_at is null and s.expires_at>now() and u.disabled_at is null limit 1`, [createHash("sha256").update(token).digest()]);
  const row = rows.rows[0];
  const staff = !!row && (row.email.toLowerCase() === OWNER || (row.role === "admin" && !!row.staff_role));
  if (staffCache.size > 500) staffCache.clear();
  staffCache.set(token, { staff, at: Date.now() });
  return staff;
}
// Always open: login and sign-in APIs, the maintenance page itself, site switches, health check and photos.
const open = /^\/(login|maintenance|reset-password|auth\/|api\/(auth|settings|health|media)(\/|$))/;

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (open.test(path)) return NextResponse.next();
  try {
    if (!await maintenanceOn()) return NextResponse.next();
    const token = request.cookies.get("kiraye_session")?.value;
    if (token && await isStaff(token)) return NextResponse.next();
  } catch { return NextResponse.next(); }
  if (path.startsWith("/api/")) return NextResponse.json({ error: "MAINTENANCE" }, { status: 503, headers: { "Retry-After": "1800", "Cache-Control": "no-store" } });
  const url = request.nextUrl.clone(); url.pathname = "/maintenance"; url.search = "";
  return NextResponse.rewrite(url, { status: 503, headers: { "Retry-After": "1800", "Cache-Control": "no-store" } });
}

export const config = {
  // Pages and APIs only: not Next.js files, icons, images or other files with an extension.
  matcher: ["/((?!_next/|favicon|icon|apple-touch|manifest|robots|sitemap|.*\\.[a-z0-9]+$).*)"],
};
