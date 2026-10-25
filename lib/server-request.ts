import { isIP } from "node:net";

// Enable only after the front server is checked to overwrite the header from
// REMOTE_ADDR. Client-provided forwarding headers are never a fallback.
export function trustedClientIp(request: Request): string | null {
  if (process.env.KIRAYE_TRUST_PROXY !== "1") return null;
  const value = request.headers.get("x-kirayeal-client-ip")?.trim();
  return value && isIP(value) ? value : null;
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return origin === new URL(process.env.NEXT_PUBLIC_SITE_URL || request.url).origin;
  } catch {
    return false;
  }
}
