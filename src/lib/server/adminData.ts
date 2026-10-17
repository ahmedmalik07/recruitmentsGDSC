import "server-only";
import { Timestamp, type DocumentData } from "firebase-admin/firestore";
import { adminDb } from "./firebaseAdmin";
import type { AdminUser } from "./adminAuth";

/** Firestore Timestamps become epoch millis so they survive JSON */
function plain(data: DocumentData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) out[k] = v instanceof Timestamp ? v.toMillis() : v;
  return out;
}

/** Applications + reviews this admin may see. Leads only get their own domain. */
export async function loadForAdmin(admin: AdminUser) {
  const db = adminDb();
  const appsQuery =
    admin.claims.role === "lead"
      ? db.collection("applications").where("domain", "==", admin.claims.domain)
      : db.collection("applications");
  const [appsSnap, reviewsSnap] = await Promise.all([appsQuery.get(), db.collectionGroup("reviews").get()]);

  const applications = appsSnap.docs.map((d) => ({ id: d.id, ...plain(d.data()) }));
  const visible = new Set(applications.map((a) => a.id));
  const reviews = reviewsSnap.docs
    .filter((d) => visible.has(d.ref.parent.parent?.id ?? ""))
    .map((d) => ({ reviewerUid: d.id, rollNo: d.ref.parent.parent!.id, ...plain(d.data()) }));
  return { applications, reviews };
}
