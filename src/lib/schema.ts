import { z } from "zod";
import {
  DOMAIN_IDS,
  EXCITED,
  HOURS,
  TEAM_ROLES,
  domains,
  quiz,
  site,
  type DomainId,
} from "@/content";

/** Shared between the candidate UI and /api/apply. */

export { WORDS, countWords } from "./quick";
import { WORDS, countWords } from "./quick";

export const MAX_TEXT_CHARS = 2500;

/** Strip spaces/dashes and convert +92 / 92 prefixes to the local 03 format. */
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("92") && digits.length === 12) digits = "0" + digits.slice(2);
  return digits.slice(0, 11);
}

/** Add https:// when the user typed a bare domain. Leaves empty strings alone. */
export function normalizeUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && url.hostname.includes(".");
  } catch {
    return false;
  }
}

const rollNoRe = new RegExp(site.rollNoRegex);

const longText = (label: string) =>
  z
    .string({ error: "Required" })
    .trim()
    .max(MAX_TEXT_CHARS, { error: `${label} is too long` })
    .refine((v) => countWords(v) >= WORDS.min, { error: `At least ${WORDS.min} words please` })
    .refine((v) => countWords(v) <= WORDS.max, { error: `Keep it under ${WORDS.max} words` });

// ---------------------------------------------------------------------------
// Per-level shapes (no refinements, so they can be merged)
// ---------------------------------------------------------------------------

export const characterShape = {
  fullName: z
    .string({ error: "Required" })
    .trim()
    .min(3, { error: "Name should be at least 3 characters" })
    .max(60, { error: "Name should be under 60 characters" }),
  email: z
    .string({ error: "Required" })
    .trim()
    .toLowerCase()
    .max(120, { error: "Email is too long" })
    .pipe(z.email({ error: "That email doesn't look right" })),
  rollNo: z.string({ error: "Required" }).trim().regex(rollNoRe, { error: `Enter a valid roll no (${site.rollNoHint})` }),
  phone: z.string({ error: "Required" }).trim().regex(/^03\d{9}$/, { error: "Use 03XXXXXXXXX format (11 digits)" }),
  semester: z
    .number({ error: "Pick your semester" })
    .int()
    .min(1, { error: "Pick your semester" })
    .max(8, { error: "Pick your semester" }),
  department: z
    .string({ error: "Write your department" })
    .trim()
    .min(2, { error: "Write your department" })
    .max(80, { error: "Keep it under 80 characters" }),
};

export const houseShape = {
  domain: z.enum(DOMAIN_IDS, { error: "Pick one house" }),
  position: z.string({ error: "Pick a position" }).trim().min(1, { error: "Pick a position" }).max(30),
  skillTags: z.array(z.string().max(40)).max(10).default([]),
};

export const storyShape = {
  experience: longText("Experience"),
  achievements: z
    .string()
    .trim()
    .max(1500, { error: "Keep it under 1500 characters" })
    .refine((v) => countWords(v) <= 200, { error: "Keep it under 200 words" })
    .default(""),
  whyJoin: longText("Your answer"),
  portfolioUrl: z
    .string()
    .trim()
    .max(300, { error: "Link is too long" })
    .refine((v) => v === "" || isHttpUrl(v), { error: "Enter a valid link (https://…)" })
    .default(""),
  teamRole: z.enum(TEAM_ROLES, { error: "Pick one" }),
  hoursPerWeek: z.enum(HOURS, { error: "Pick one" }),
  excitedAbout: z
    .array(z.enum(EXCITED))
    .min(1, { error: "Pick at least one" })
    .max(EXCITED.length)
    .refine((arr) => new Set(arr).size === arr.length, { error: "Duplicate choice" }),
  funFact: z.string().trim().max(120, { error: "Max 120 characters" }).default(""),
};

export const quizShape = {
  quizScore: z.number().int().min(0).max(quiz.length),
};

/** position and skillTags must belong to the chosen domain */
function refineSkills(
  data: { domain: DomainId; position: string; skillTags: string[] },
  ctx: z.RefinementCtx,
): void {
  const positions = domains[data.domain]?.positions ?? [];
  if (data.position && !positions.some((p) => p.id === data.position)) {
    ctx.addIssue({ code: "custom", path: ["position"], message: "Pick a position from this team" });
  }
  const allowed = domains[data.domain]?.skills ?? [];
  const bad = data.skillTags.filter((s) => !allowed.includes(s));
  if (bad.length) {
    ctx.addIssue({ code: "custom", path: ["skillTags"], message: "Skill doesn't match your house" });
  }
  if (new Set(data.skillTags).size !== data.skillTags.length) {
    ctx.addIssue({ code: "custom", path: ["skillTags"], message: "Duplicate skill" });
  }
}

export const characterSchema = z.object(characterShape);
export const houseSchema = z.object(houseShape).superRefine(refineSkills);
export const storySchema = z.object(storyShape);

export const applicationSchema = z
  .object({ ...characterShape, ...houseShape, ...storyShape, ...quizShape })
  .superRefine(refineSkills);

/** What the client POSTs to /api/apply */
export const submitSchema = z
  .object({
    ...characterShape,
    ...houseShape,
    ...storyShape,
    ...quizShape,
    website: z.string().max(200).default(""),
    turnstileToken: z.string().min(1, { error: "Bot check missing" }).max(2048),
    timeTakenSec: z.number().int().min(0).max(60 * 60 * 24 * 30),
  })
  .superRefine(refineSkills);

export type ApplicationInput = z.input<typeof applicationSchema>;
export type Application = z.output<typeof applicationSchema>;
export type SubmitPayload = z.input<typeof submitSchema>;

export const STATUSES = ["submitted", "shortlisted", "rejected", "selected"] as const;
export type Status = (typeof STATUSES)[number];

/** Flatten Zod issues into { field: firstMessage } for forms. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** API response contract */
export type ApplyResponse =
  | { ok: true; rollNo: string }
  | {
      ok: false;
      code: "duplicate" | "closed" | "bot" | "validation" | "bad_request" | "server" | "busy";
      message: string;
      fields?: Record<string, string>;
    };
