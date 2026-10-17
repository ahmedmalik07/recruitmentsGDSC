import { getFirestore } from "firebase-admin/firestore";
import { AdminConfigError, adminApp } from "@/lib/server/firebaseAdmin";

/**
 * Setup check: open /api/health in a browser after changing Vercel variables.
 * Reports only yes/no and counts, never the values themselves.
 */
export async function GET() {
  const count = (v: string | undefined) =>
    (v ?? "")
      .replace(/["'`]/g, "")
      .split(/[\s,;]+/)
      .filter(Boolean).length;

  let firebaseAdmin = "ok";
  try {
    // A cheap authenticated call proves the key actually works, not just that it parses
    await getFirestore(adminApp()).collection("applications").limit(1).get();
  } catch (err) {
    firebaseAdmin =
      err instanceof AdminConfigError ? err.message : `error: ${(err as Error).message.split("\n")[0].slice(0, 160)}`;
  }

  return Response.json(
    {
      firebaseAdmin,
      adminCoreEmails: count(process.env.ADMIN_CORE_EMAILS),
      adminLeadEmails: count(process.env.ADMIN_LEAD_EMAILS),
      turnstileSecretSet: Boolean(process.env.TURNSTILE_SECRET_KEY),
      turnstileSiteKeySet: Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
      firebaseWebConfigSet: Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
      deadline: process.env.NEXT_PUBLIC_APPLICATIONS_DEADLINE || "none (open)",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
