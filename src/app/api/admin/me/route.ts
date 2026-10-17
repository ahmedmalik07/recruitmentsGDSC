import { json, requireAdmin } from "@/lib/server/adminAuth";

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;
  return json({ ok: true, email: admin.email, ...admin.claims });
}
