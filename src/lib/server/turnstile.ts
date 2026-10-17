import "server-only";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Server-side Turnstile check. Without TURNSTILE_SECRET_KEY it only passes
 * outside production, so local dev works before keys are set up.
 */
export async function verifyTurnstile(token: string, ip?: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[turnstile] TURNSTILE_SECRET_KEY not set, skipping verification (dev only)");
      return true;
    }
    console.error("[turnstile] TURNSTILE_SECRET_KEY missing in production");
    return false;
  }

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);

  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body, signal: AbortSignal.timeout(8000) });
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (!data.success) console.warn("[turnstile] failed", data["error-codes"]);
    return Boolean(data.success);
  } catch (err) {
    console.error("[turnstile] verify request failed", err);
    return false;
  }
}
