import "server-only";
import { DOMAIN_IDS, type DomainId } from "@/content";

export type AllowedRole = { role: "core" } | { role: "lead"; domain: DomainId };

/**
 * Admin allowlist from env, so access can be managed from Vercel without the claims script.
 *   ADMIN_CORE_EMAILS="a@gmail.com,b@gmail.com"
 *   ADMIN_LEAD_EMAILS="lead@gmail.com:technical,other@gmail.com:ops"
 * Core wins if an email is in both lists.
 */
/** True when neither list is set (env missing, or not redeployed after adding it) */
export function allowlistEmpty(): boolean {
  return !(process.env.ADMIN_CORE_EMAILS ?? "").trim() && !(process.env.ADMIN_LEAD_EMAILS ?? "").trim();
}

export function allowedRoleFor(email: string): AllowedRole | null {
  const target = email.trim().toLowerCase();
  const split = (v: string | undefined) =>
    (v ?? "")
      .replace(/["'`]/g, "") // tolerate values pasted with quotes
      .split(/[\s,;]+/) // commas, semicolons, spaces or new lines
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

  if (split(process.env.ADMIN_CORE_EMAILS).includes(target)) return { role: "core" };

  for (const entry of split(process.env.ADMIN_LEAD_EMAILS)) {
    const [leadEmail, domain] = entry.split(":").map((s) => s.trim());
    if (leadEmail === target && (DOMAIN_IDS as readonly string[]).includes(domain)) {
      return { role: "lead", domain: domain as DomainId };
    }
  }
  return null;
}
