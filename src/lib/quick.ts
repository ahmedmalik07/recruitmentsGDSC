import { site } from "@/content";

/**
 * Tiny, dependency-free checks for cosmetic things (avatar unlocks, XP bar).
 * The real validation is the Zod schema in ./schema (used on submit and on the server);
 * keeping these separate means Zod isn't downloaded on the title screen.
 */
export const WORDS = { min: 10, max: 250, sweetMin: 40, sweetMax: 150 } as const;

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

const rollRe = new RegExp(site.rollNoRegex);

export const quick = {
  fullName: (v: string) => {
    const t = v.trim();
    return t.length >= 3 && t.length <= 60;
  },
  email: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
  rollNo: (v: string) => rollRe.test(v.trim()),
  phone: (v: string) => /^03\d{9}$/.test(v.trim()),
  longText: (v: string) => {
    const n = countWords(v);
    return n >= WORDS.min && n <= WORDS.max;
  },
};
