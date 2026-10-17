import { json, requireAdmin } from "@/lib/server/adminAuth";
import { loadForAdmin } from "@/lib/server/adminData";

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;
  try {
    return json({ ok: true, ...(await loadForAdmin(admin)) });
  } catch (err) {
    console.error("[admin/applications] load failed", err);
    return json({ ok: false, error: "load_failed", detail: (err as Error).message.split("\n")[0].slice(0, 200) }, 500);
  }
}
