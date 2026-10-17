import { json, requireAdmin } from "@/lib/server/adminAuth";
import { loadBackup } from "@/lib/server/adminData";

/** Full JSON backup of everything this admin can see (core: the whole database). */
export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;
  try {
    const data = await loadBackup(admin);
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
    return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), exportedBy: admin.email, ...data }, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="gdg-quest-backup-${stamp}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[admin/backup] failed", err);
    return json({ ok: false, error: "load_failed" }, 500);
  }
}
