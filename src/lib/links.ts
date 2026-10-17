import { LINK_KINDS, linkKinds, type LinkKind } from "@/content";

/** Zod-free link helpers shared by Level 5, /api/apply and the admin panel. */

export type PortfolioLink = { kind: LinkKind; url: string };

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && url.hostname.includes(".");
  } catch {
    return false;
  }
}

function hostOf(value: string): string {
  try {
    return new URL(value).hostname
      .toLowerCase()
      .replace(/^www\./, "")
      .replace(/^m\./, "");
  } catch {
    return "";
  }
}

/** Which kind a URL belongs to, from its hostname. null for anything unknown. */
export function detectLinkKind(url: string): LinkKind | null {
  const host = hostOf(url);
  if (!host) return null;
  for (const kind of LINK_KINDS) {
    if (linkKinds[kind].hosts.some((h) => host === h || host.endsWith(`.${h}`))) return kind;
  }
  return null;
}

const HANDLE = /^@?[A-Za-z0-9_.-]{1,60}$/;

/**
 * Turn whatever was typed into a full link:
 * "@ahmed" on Instagram → https://www.instagram.com/ahmed, "github.com/x" → https://github.com/x.
 */
export function normalizeLink(kind: LinkKind, raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const base = linkKinds[kind].handleBase;
  const looksLikeDomain = value.includes("/") || detectLinkKind(`https://${value}`) !== null;
  // Handles: "@name", or a bare word. Instagram handles can contain dots, so allow those there.
  if (
    base &&
    HANDLE.test(value) &&
    !looksLikeDomain &&
    (value.startsWith("@") || !value.includes(".") || kind === "instagram")
  ) {
    return base + value.replace(/^@/, "");
  }
  return `https://${value}`;
}

/** Rows the candidate actually filled in */
export function filledLinks(links: readonly PortfolioLink[]): PortfolioLink[] {
  return links.filter((l) => l.url.trim() !== "");
}

/** Links on a stored application, including the single portfolioUrl older applications have */
export function linksOf(doc: { links?: PortfolioLink[]; portfolioUrl?: string }): PortfolioLink[] {
  if (doc.links?.length) return doc.links;
  return doc.portfolioUrl ? [{ kind: detectLinkKind(doc.portfolioUrl) ?? "website", url: doc.portfolioUrl }] : [];
}
