import { level5 } from "@/content";
import { WORDS, countWords } from "@/lib/schema";

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
        <span style={{ color: color === "#EA4335" ? "#FF8A80" : color === "#4285F4" ? "#8AB4F8" : color }}>
          {label}
        </span>
        <span className="text-muted tabular-nums">
          {n}/{WORDS.max}
        </span>
      </p>
    </div>
  );
}
