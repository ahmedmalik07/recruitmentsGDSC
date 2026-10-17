import { FieldValue } from "firebase-admin/firestore";
import { canAccessDomain, json, requireAdmin } from "@/lib/server/adminAuth";
import { adminDb } from "@/lib/server/firebaseAdmin";

/** Save the signed-in admin's own rating + notes for an application. */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  const body = (await req.json().catch(() => null)) as { rollNo?: unknown; rating?: unknown; notes?: unknown } | null;
  const rollNo = typeof body?.rollNo === "string" ? body.rollNo : "";
  const rating = body?.rating;
  const notes = typeof body?.notes === "string" ? body.notes.trim().slice(0, 2000) : "";
  if (!/^[\w-]{1,40}$/.test(rollNo) || typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return json({ ok: false, error: "bad_request" }, 400);
  }

  const db = adminDb();
  const appSnap = await db.collection("applications").doc(rollNo).get();
  if (!appSnap.exists) return json({ ok: false, error: "not_found" }, 404);
  const domain = appSnap.get("domain") as string;
  if (!canAccessDomain(admin, domain)) return json({ ok: false, error: "forbidden" }, 403);

  const ref = appSnap.ref.collection("reviews").doc(admin.uid);
  await db.runTransaction(async (tx) => {
    const existing = await tx.get(ref);
    tx.set(ref, {
      rating,
      notes,
      domain,
      rollNo,
      reviewerName: admin.name,
      reviewerEmail: admin.email,
      createdAt: existing.exists ? existing.get("createdAt") : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  return json({ ok: true });
}
