import { after } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { errors as copy, site } from "@/content";
import { fieldErrors, submitSchema, type ApplyResponse } from "@/lib/schema";
import { adminDb } from "@/lib/server/firebaseAdmin";
import { sendConfirmationEmail } from "@/lib/server/email";
import { verifyTurnstile } from "@/lib/server/turnstile";

const MAX_BODY_BYTES = 32 * 1024;
/** gRPC ALREADY_EXISTS, returned by DocumentReference.create() when the doc exists */
const ALREADY_EXISTS = 6;

function reply(body: ApplyResponse, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function clientIp(req: Request): string | null {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null
  );
}

export async function POST(req: Request) {
  // 1. Size + JSON
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return reply({ ok: false, code: "bad_request", message: "Payload too large" }, 413);
  }
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return reply({ ok: false, code: "bad_request", message: "Invalid JSON" }, 400);
  }

  // 2. Honeypot: real people never see the "website" field
  if (json && typeof json === "object" && "website" in json && String((json as { website: unknown }).website ?? "").trim()) {
    return reply({ ok: false, code: "bot", message: copy.bot }, 400);
  }

  // 3. Deadline
  const deadline = Date.parse(site.deadline);
  if (Number.isFinite(deadline) && Date.now() > deadline) {
    return reply({ ok: false, code: "closed", message: copy.closed }, 403);
  }

  // 4. Validate with the shared schema
  const parsed = submitSchema.safeParse(json);
  if (!parsed.success) {
    return reply({ ok: false, code: "validation", message: copy.validation, fields: fieldErrors(parsed.error) }, 422);
  }
  // Honeypot + token are checked, never stored
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { website, turnstileToken, ...application } = parsed.data;

  // 5. Turnstile
  if (!(await verifyTurnstile(turnstileToken, clientIp(req)))) {
    return reply({ ok: false, code: "bot", message: copy.bot }, 400);
  }

  // 6. Write once per roll number. create() fails if the doc already exists.
  try {
    const ref = adminDb().collection("applications").doc(application.rollNo);
    await ref.create({
      ...application,
      status: "submitted",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    if ((err as { code?: number }).code === ALREADY_EXISTS) {
      return reply({ ok: false, code: "duplicate", message: copy.duplicate }, 409);
    }
    console.error("[apply] firestore write failed", err);
    return reply({ ok: false, code: "server", message: copy.generic }, 500);
  }

  // 7. Optional confirmation email, after the response is sent
  after(() =>
    sendConfirmationEmail(application.email, application.fullName, application.domain, application.position),
  );

  return reply({ ok: true, rollNo: application.rollNo }, 201);
}
