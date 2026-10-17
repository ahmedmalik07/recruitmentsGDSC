import { FieldValue } from "firebase-admin/firestore";
import { domains, type DomainId } from "@/content";
import { STATUSES, type Status } from "@/lib/schema";
import { canAccessDomain, json, requireAdmin } from "@/lib/server/adminAuth";
import { adminDb } from "@/lib/server/firebaseAdmin";

/** Change an application's status (and the position given on selection). */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  const body = (await req.json().catch(() => null)) as { rollNo?: unknown; status?: unknown; assignedPosition?: unknown } | null;
  const rollNo = typeof body?.rollNo === "string" ? body.rollNo : "";
  const status = body?.status as Status;
  if (!/^[\w-]{1,40}$/.test(rollNo) || !(STATUSES as readonly string[]).includes(status)) {
    return json({ ok: false, error: "bad_request" }, 400);
  }

  const ref = adminDb().collection("applications").doc(rollNo);
  const snap = await ref.get();
  if (!snap.exists) return json({ ok: false, error: "not_found" }, 404);
  const domain = snap.get("domain") as DomainId;
  if (!canAccessDomain(admin, domain)) return json({ ok: false, error: "forbidden" }, 403);

  let assignedPosition: string | null = null;
  if (status === "selected") {
    const wanted = typeof body?.assignedPosition === "string" ? body.assignedPosition : "";
    const valid = domains[domain]?.positions.some((p) => p.id === wanted);
    if (!valid) return json({ ok: false, error: "bad_position" }, 400);
    assignedPosition = wanted;
  }

  await ref.update({
    status,
    assignedPosition,
    updatedAt: FieldValue.serverTimestamp(),
    statusBy: admin.email,
  });
  return json({ ok: true });
}
