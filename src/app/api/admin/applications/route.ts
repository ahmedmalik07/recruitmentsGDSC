import { json, requireAdmin } from "@/lib/server/adminAuth";
import { loadForAdmin } from "@/lib/server/adminData";

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;
  const sinceParam = Number(new URL(req.url).searchParams.get("since"));
  const since = Number.isFinite(sinceParam) && sinceParam > 0 ? sinceParam : undefined;
  try {
    return json({ ok: true, ...(await loadForAdmin(admin, since)) });
  } catch (err) {
    console.error("[admin/applications] load failed", err);
    return json({ ok: false, error: "load_failed", detail: (err as Error).message.split("\n")[0].slice(0, 200) }, 500);
  }
}
