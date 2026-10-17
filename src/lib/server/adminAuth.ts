import "server-only";
import { getAuth } from "firebase-admin/auth";
import { DOMAIN_IDS, type DomainId } from "@/content";
import { AdminConfigError, adminApp } from "./firebaseAdmin";
import { allowedRoleFor, allowlistEmpty } from "./adminAllowlist";

export type AdminClaims = { role: "core" } | { role: "lead"; domain: DomainId };
export type AdminUser = { uid: string; email: string; name: string; claims: AdminClaims };

export function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function claimsFromToken(t: Record<string, unknown>): AdminClaims | null {
  if (t.role === "core") return { role: "core" };
  if (t.role === "lead" && typeof t.domain === "string" && (DOMAIN_IDS as readonly string[]).includes(t.domain)) {
    return { role: "lead", domain: t.domain as DomainId };
  }
  return null;
}

/**
 * Verifies the caller's Firebase ID token and admin role.
 * Role comes from custom claims, or from the env allowlist (and is then saved as claims).
 * Returns the admin, or a JSON error Response to send back as-is.
 */
export async function requireAdmin(req: Request): Promise<AdminUser | Response> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return json({ ok: false, error: "missing_token" }, 401);

  let auth;
  try {
    auth = getAuth(adminApp());
  } catch (err) {
    console.error("[admin] Firebase Admin init failed", err);
    const detail = err instanceof AdminConfigError ? err.message : "Firebase Admin couldn't start";
    return json({ ok: false, error: "server_config", detail }, 500);
  }

  let decoded;
  try {
    decoded = await auth.verifyIdToken(token, true);
  } catch (err) {
    const code = (err as { code?: string }).code ?? "";
    // Wrong project in FIREBASE_PROJECT_ID shows up as an audience mismatch
    if (code === "auth/argument-error" && /aud|audience/i.test((err as Error).message)) {
      return json(
        {
          ok: false,
          error: "server_config",
          detail: "FIREBASE_PROJECT_ID in Vercel doesn't match the Firebase web app's project (should be recruitments-f525d).",
        },
        500,
      );
    }
    if (code === "app/invalid-credential" || code === "auth/internal-error") {
      return json({ ok: false, error: "server_config", detail: (err as Error).message.slice(0, 200) }, 500);
    }
    return json({ ok: false, error: "invalid_token" }, 401);
  }

  const email = decoded.email?.toLowerCase() ?? "";
  if (!email || decoded.email_verified !== true) return json({ ok: false, error: "email_not_verified" }, 403);

  let claims = claimsFromToken(decoded as unknown as Record<string, unknown>);
  const allowed = allowedRoleFor(email);
  if (allowed) {
    const differs =
      !claims || claims.role !== allowed.role || (allowed.role === "lead" && claims.role === "lead" && claims.domain !== allowed.domain);
    if (differs) {
      // Keep Firebase claims in sync with the allowlist (best effort; access is granted either way)
      try {
        const user = await auth.getUser(decoded.uid);
        const next: Record<string, unknown> = { ...(user.customClaims ?? {}) };
        delete next.domain;
        Object.assign(next, allowed);
        await auth.setCustomUserClaims(decoded.uid, next);
      } catch (err) {
        console.error("[admin] setCustomUserClaims failed", err);
      }
    }
    claims = allowed;
  }

  if (!claims) {
    return json({ ok: false, error: allowlistEmpty() ? "allowlist_not_configured" : "not_allowlisted" }, 403);
  }
  return { uid: decoded.uid, email, name: (decoded.name as string | undefined) ?? "", claims };
}

/** Can this admin see / change applications of this domain? */
export function canAccessDomain(admin: AdminUser, domain: string): boolean {
  return admin.claims.role === "core" || admin.claims.domain === domain;
}
