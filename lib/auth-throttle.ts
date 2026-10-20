// Supabase may return rate limits with or without a structured error code.
export function rateLimitSeconds(error: unknown): number | null {
  const value = error as { status?: number; code?: string; message?: string };
  if (
    value?.status !== 429 &&
    !String(value?.code || "").includes("rate_limit")
  )
    return null;
  const seconds = value.message?.match(
    /(?:after|in)\s+(\d+)\s*(?:seconds?|s\b)/i,
  )?.[1];
  return seconds ? Math.min(3600, Math.max(1, Number(seconds))) : 60;
}
