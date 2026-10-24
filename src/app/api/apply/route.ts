import { after } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { errors as copy, site } from "@/content";
import { detectLinkKind, fieldErrors, isHttpUrl, normalizeLink, submitSchema, type ApplyResponse } from "@/lib/schema";
import { adminDb } from "@/lib/server/firebaseAdmin";
import { sendConfirmationEmail } from "@/lib/server/email";
import { verifyTurnstile } from "@/lib/server/turnstile";

const MAX_BODY_BYTES = 32 * 1024;
/** gRPC ALREADY_EXISTS, returned by DocumentReference.create() when the doc exists */
const ALREADY_EXISTS = 6;
/** Daily free-plan quota or rate limit hit */
const RESOURCE_EXHAUSTED = 8;
/** Worth a quick retry: DEADLINE_EXCEEDED, ABORTED, INTERNAL, UNAVAILABLE */
const TRANSIENT = new Set([4, 10, 13, 14]);

export const maxDuration = 30;

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

  // 3. Closed, by hand or by the deadline
  const deadline = Date.parse(site.deadline);
  if (site.closed || (Number.isFinite(deadline) && Date.now() > deadline)) {
    return reply({ ok: false, code: "closed", message: copy.closed }, 403);
  }

  // 4. Validate with the shared schema
  const parsed = submitSchema.safeParse(json);
  if (!parsed.success) {
    return reply({ ok: false, code: "validation", message: copy.validation, fields: fieldErrors(parsed.error) }, 422);
  }
  // Honeypot + token are checked, never stored
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { website, turnstileToken, portfolioUrl, ...application } = parsed.data;
  // A page cached from before multiple links sends one portfolioUrl instead
  const legacyUrl = portfolioUrl ? normalizeLink("website", portfolioUrl) : "";
  if (application.links.length === 0 && isHttpUrl(legacyUrl)) {
    application.links = [{ kind: detectLinkKind(legacyUrl) ?? "website", url: legacyUrl }];
  }

  // 5. Turnstile
  if (!(await verifyTurnstile(turnstileToken, clientIp(req)))) {
    return reply({ ok: false, code: "bot", message: copy.bot }, 400);
  }

  // 6. Write once per roll number. create() fails if the doc already exists.
  let ref;
  try {
    ref = adminDb().collection("applications").doc(application.rollNo);
  } catch (err) {
    console.error("[apply] Firebase Admin init failed", err);
    return reply({ ok: false, code: "server", message: copy.generic }, 500);
  }
  const record = {
    ...application,
    status: "submitted",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  for (let attempt = 1; ; attempt++) {
    try {
      await ref.create(record);
      break;
    } catch (err) {
      const code = (err as { code?: number }).code;
      if (code === ALREADY_EXISTS) {
        // Same person retrying after a lost response (e.g. weak signal)? Then it's already saved: success.
        try {
          const existing = await ref.get();
          const created = existing.get("createdAt") as { toMillis?: () => number } | undefined;
          const recent = created?.toMillis ? Date.now() - created.toMillis() < 30 * 60_000 : false;
          if (existing.get("email") === application.email && existing.get("phone") === application.phone && recent) {
            return reply({ ok: true, rollNo: application.rollNo }, 200);
          }
        } catch {
          // fall through to the duplicate message
        }
        return reply({ ok: false, code: "duplicate", message: copy.duplicate }, 409);
      }
      if (code === RESOURCE_EXHAUSTED) {
        console.error("[apply] Firestore quota exhausted", err);
        return reply({ ok: false, code: "busy", message: copy.busy }, 503);
      }
      if (TRANSIENT.has(code ?? -1) && attempt < 3) {
        await new Promise((r) => setTimeout(r, 300 * 2 ** attempt + Math.random() * 200));
        continue;
      }
      console.error("[apply] firestore write failed", err);
      return reply({ ok: false, code: "server", message: copy.generic }, 500);
    }
  }

  // 7. Optional confirmation email, after the response is sent
  after(() =>
    sendConfirmationEmail(application.email, application.fullName, application.domain, application.position),
  );

  return reply({ ok: true, rollNo: application.rollNo }, 201);
}
