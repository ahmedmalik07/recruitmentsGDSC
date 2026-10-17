import "server-only";
import { domains, email as copy, site, type DomainId } from "@/content";

/** "Quest accepted" email. No-op unless RESEND_API_KEY is set. Never throws. */
export async function sendConfirmationEmail(to: string, fullName: string, domain: DomainId): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const from = process.env.RESEND_FROM_EMAIL || `${site.chapterShort} <onboarding@resend.dev>`;
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const firstName = fullName.trim().split(/\s+/)[0];
    const text = copy.body(firstName, `${domains[domain].house} (${domains[domain].label})`);
    const { error } = await resend.emails.send({ from, to, subject: copy.subject, text });
    if (error) console.error("[email] resend error", error);
  } catch (err) {
    console.error("[email] send failed", err);
  }
}
