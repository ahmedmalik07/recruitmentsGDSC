"use client";

import type { User } from "firebase/auth";

export class ApiError extends Error {
  constructor(
    public code: string,
    public detail?: string,
    public status?: number,
  ) {
    super(code);
  }
}

/** Authenticated call to /api/admin/*, with a timeout so the page can never hang silently. */
export async function adminFetch<T>(user: User, path: string, init: RequestInit = {}, timeoutMs = 20_000): Promise<T> {
  const token = await user.getIdToken();
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (err) {
    throw new ApiError((err as Error).name === "TimeoutError" ? "timeout" : "network");
  }
  const body = (await res.json().catch(() => null)) as ({ ok?: boolean; error?: string; detail?: string } & T) | null;
  if (!res.ok || !body || body.ok === false) {
    throw new ApiError(body?.error ?? `http_${res.status}`, body?.detail, res.status);
  }
  return body;
}

export const ERROR_TEXT: Record<string, string> = {
  allowlist_not_configured:
    "The server has no admin list. Add ADMIN_CORE_EMAILS in Vercel (Production), then redeploy: new variables only apply to new deployments.",
  not_allowlisted: "The admin list is set, but this email isn't on it. Check the spelling in ADMIN_CORE_EMAILS.",
  email_not_verified: "This Google account's email isn't verified.",
  invalid_token: "Sign-in token was rejected. Sign out and sign in again.",
  missing_token: "Not signed in. Sign in again.",
  server_config:
    "The server's Firebase settings in Vercel are broken, so it can't check admins (or save applications). Fix the variable named below, then redeploy.",
  load_failed: "The server couldn't read the database.",
  timeout: "The server took too long to answer. It may be cold-starting; try again. If it keeps happening, check /api/health.",
  network: "Couldn't reach the server. Check your connection and try again.",
  forbidden: "You can't change applications outside your team.",
  http_500: "The server crashed. Check the Firebase variables in Vercel, then redeploy.",
  http_404: "Admin API not found. The latest version may not be deployed yet; redeploy on Vercel.",
};
