import "server-only";
import { Timestamp, type DocumentData } from "firebase-admin/firestore";
import { adminDb } from "./firebaseAdmin";
import type { AdminUser } from "./adminAuth";

/** Firestore Timestamps become epoch millis so they survive JSON (also inside nested maps) */
function plain(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toMillis();
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as DocumentData)) out[k] = plain(v);
    return out;
  }
  return value;
}

/**
 * Applications this admin may see (leads: their team only).
 * With `since`, only documents changed after that time are read, so the 30-60s refresh costs
 * ~1 read instead of one per application (keeps us far below the free plan's 50k reads/day).
 * Ratings live on each application (`ratings` map), so no extra reads for reviews.
 */
export async function loadForAdmin(admin: AdminUser, since?: number) {
  const db = adminDb();
  const syncedAt = Date.now();
  let docs;
  if (since) {
    // Small overlap so nothing slips between clocks; the client de-duplicates by id
    const snap = await db
      .collection("applications")
      .where("updatedAt", ">", Timestamp.fromMillis(since - 5000))
      .get();
    docs = snap.docs;
  } else {
    const snap =
      admin.claims.role === "lead"
        ? await db.collection("applications").where("domain", "==", admin.claims.domain).get()
        : await db.collection("applications").get();
    docs = snap.docs;
  }
  const applications: Array<Record<string, unknown> & { id: string }> = docs
    .map((d) => Object.assign(plain(d.data()) as Record<string, unknown>, { id: d.id }))
    .filter((a) => admin.claims.role === "core" || a["domain"] === (admin.claims as { domain: string }).domain);
  return { applications, syncedAt, full: !since };
}

/** Everything, including the reviews subcollection, for the JSON backup */
export async function loadBackup(admin: AdminUser) {
  const db = adminDb();
  const { applications } = await loadForAdmin(admin);
  const visible = new Set(applications.map((a) => a.id));
  const reviewsSnap = await db.collectionGroup("reviews").get();
  const reviews = reviewsSnap.docs
    .filter((d) => visible.has(d.ref.parent.parent?.id ?? ""))
    .map((d) => ({ reviewerUid: d.id, rollNo: d.ref.parent.parent!.id, ...(plain(d.data()) as Record<string, unknown>) }));
  return { applications, reviews };
}
