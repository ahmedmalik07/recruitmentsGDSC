import { getAuth } from "firebase-admin/auth";
import { adminApp } from "@/lib/server/firebaseAdmin";
import { allowedRoleFor, allowlistEmpty } from "@/lib/server/adminAllowlist";

function reply(body: Record<string, unknown>, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * Self-service admin access. A signed-in admin sends their Firebase ID token;
 * if their verified email is on the env allowlist, we set the matching custom
 * claims. The client then refreshes its token. Nothing is granted to anyone else.
 */
export async function POST(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return reply({ ok: false, error: "missing_token" }, 401);

  const auth = getAuth(adminApp());
  let decoded;
  try {
    decoded = await auth.verifyIdToken(token, true);
  } catch {
    return reply({ ok: false, error: "invalid_token" }, 401);
  }

  const email = decoded.email?.toLowerCase();
  if (!email || decoded.email_verified !== true) {
    return reply({ ok: false, error: "email_not_verified" }, 403);
  }

  const wanted = allowedRoleFor(email);
  if (!wanted) {
    return reply({ ok: false, error: allowlistEmpty() ? "allowlist_not_configured" : "not_allowlisted" }, 403);
  }

  const current = { role: decoded.role as unknown, domain: decoded.domain as unknown };
  const same =
    current.role === wanted.role && (wanted.role === "core" ? current.domain === undefined : current.domain === wanted.domain);
  if (same) return reply({ ok: true, changed: false, ...wanted }, 200);

  try {
    const user = await auth.getUser(decoded.uid);
    const claims: Record<string, unknown> = { ...(user.customClaims ?? {}) };
    delete claims.domain;
    Object.assign(claims, wanted);
    await auth.setCustomUserClaims(decoded.uid, claims);
  } catch (err) {
    console.error("[admin/claim] setCustomUserClaims failed", err);
    return reply({ ok: false, error: "server" }, 500);
  }
  return reply({ ok: true, changed: true, ...wanted }, 200);
}
