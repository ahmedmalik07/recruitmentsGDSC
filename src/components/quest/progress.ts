import { WORDS, countWords, quick } from "@/lib/quick";
import { LAST_LEVEL, type QuestState } from "./state";

/**
 * XP: 50 per level cleared, 10 per valid field, 20 per correct boss answer.
 * Purely cosmetic, never sent to the server.
 */
export function computeXp(state: QuestState, quizScore: number): { xp: number; pct: number } {
  const d = state.draft;
  const valid = (ok: boolean) => (ok ? 1 : 0);

  const character =
    valid(quick.fullName(d.fullName)) +
    valid(quick.email(d.email)) +
    valid(quick.rollNo(d.rollNo)) +
    valid(quick.phone(d.phone)) +
    valid(d.semester !== null) +
    valid(Boolean(d.department));
  const house = valid(Boolean(d.domain)) + valid(Boolean(d.position)) + valid(d.skillTags.length > 0);
  const story =
    valid(quick.longText(d.experience)) +
    valid(Boolean(d.achievements.trim())) +
    valid(quick.longText(d.whyJoin)) +
    valid(Boolean(d.teamRole)) +
    valid(Boolean(d.hoursPerWeek)) +
    valid(d.excitedAbout.length > 0) +
    valid(d.links.some((l) => l.url.trim() !== "")) +
    valid(Boolean(d.funFact));
  const fullPower =
    valid(inSweetSpot(d.experience)) + valid(inSweetSpot(d.whyJoin));

  const cleared = Math.min(state.maxLevel, LAST_LEVEL);
  const xp = cleared * 50 + (character + house + story) * 10 + fullPower * 15 + quizScore * 20;

  // Bar: whole levels plus partial credit inside the form levels
  const partial =
    state.level === 3 ? character / 6 : state.level === 5 ? Math.min(story, 5) / 5 : state.level === 4 ? house / 3 : 0;
  const pct = Math.min(1, (state.level + partial * 0.9) / LAST_LEVEL);
  return { xp, pct };
}

export function inSweetSpot(text: string): boolean {
  const n = countWords(text);
  return n >= WORDS.sweetMin && n <= WORDS.sweetMax;
}
