import { level5 } from "@/content";
import { WORDS, countWords } from "@/lib/schema";

/** Darker, text-safe versions of the bar colors (AA on light backgrounds) */
const TEXT: Record<string, string> = {
  "#EA4335": "#C5221F",
  "#FBBC04": "#8A5A00",
  "#34A853": "#137333",
  "#4285F4": "#1967D2",
};

/** Fills as they type. 40 to 150 words = full power. */
export function PowerMeter({ id, text }: { id: string; text: string }) {
  const n = countWords(text);
  let label: string;
  let color: string;
  if (n < WORDS.min) {
    label = level5.meter.tooShort(n);
    color = "#EA4335";
  } else if (n < WORDS.sweetMin) {
    label = level5.meter.charging;
    color = "#FBBC04";
  } else if (n <= WORDS.sweetMax) {
    label = level5.meter.full;
    color = "#34A853";
  } else if (n <= WORDS.max) {
    label = level5.meter.long;
    color = "#4285F4";
  } else {
    label = level5.meter.tooLong;
    color = "#EA4335";
  }
  const pct = Math.min(100, (n / WORDS.sweetMin) * 100);

  return (
    <div id={id} className="flex flex-col gap-1">
      <div className="h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
        <div
          className="h-full rounded-full transition-[width,background-color] duration-300"
          style={{ width: `${Math.max(pct, 3)}%`, background: color }}
        />
      </div>
      <p className="flex justify-between text-xs font-medium">
        <span style={{ color: TEXT[color] ?? color }}>
          {label}
        </span>
        <span className="text-muted tabular-nums">
          {n}/{WORDS.max}
        </span>
      </p>
    </div>
  );
}
