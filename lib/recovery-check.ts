// Returns "unknown" when the privileged server lookup is not configured.
// An unavailable lookup must never be presented as "account not found".
export async function checkRecoveryEmail(email: string): Promise<"exists" | "missing" | "unknown"> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    let response: Response;
    try {
      response = await fetch("/api/auth/recovery-check", {
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({email}), signal:controller.signal,
      });
    } finally { clearTimeout(timer); }
    const body = await response.json();
    if (response.status === 429) {
      const error = new Error("Çox sayda cəhd edildi. Bir qədər gözləyib yenidən yoxla.");
      Object.assign(error, { status: 429, code: "rate_limit" });
      throw error;
    }
    if (!response.ok) return "unknown";
    return body.exists === true ? "exists" : body.exists === false ? "missing" : "unknown";
  } catch(error) {
    if (error instanceof Error && error.message.startsWith("Çox sayda")) throw error;
    return "unknown";
  }
}
