// Rate limits may be returned with or without a structured error code.
export function rateLimitSeconds(error: unknown): number | null {
  const value = error as { status?: number; code?: string; message?: string; retryAt?: string };
  if (
    value?.status !== 429 &&
    !String(value?.code || "").toLowerCase().includes("rate_limit")
  )
    return null;
  const retryAt = typeof value.retryAt === "string" ? Date.parse(value.retryAt) : NaN;
  if (Number.isFinite(retryAt) && retryAt > Date.now()) return Math.min(3600, Math.max(1, Math.ceil((retryAt - Date.now()) / 1000)));
  const seconds = value.message?.match(
    /(?:after|in)\s+(\d+)\s*(?:seconds?|s\b)/i,
  )?.[1];
  return seconds ? Math.min(3600, Math.max(1, Number(seconds))) : 60;
}
