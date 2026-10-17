"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { levelStyle, levelUp } from "@/content";
import { music } from "@/lib/music";
import { useInstant, useQuest } from "./state";

/** "Level 3 cleared! +50 XP" burst when moving forward to a new level */
export function LevelUp() {
  const { state } = useQuest();
  const instant = useInstant();
  const prev = useRef(state.level);
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    const from = prev.current;
    prev.current = state.level;
    // Only forward steps from a real level (not the title screen, not resuming)
    if (!state.hydrated || state.level !== from + 1 || from < 1) return;
    music.sfx("levelUp");
    if (instant) return;
    const show = window.setTimeout(() => setShown(from), 0);
    const hide = window.setTimeout(() => setShown(null), 1300);
    import("canvas-confetti")
      .then(({ default: confetti }) =>
        confetti({
          particleCount: 45,
          spread: 60,
          startVelocity: 32,
          origin: { y: 0.25 },
          colors: ["#4285F4", "#EA4335", "#FBBC04", "#34A853"],
          disableForReducedMotion: true,
        }),
      )
      .catch(() => {});
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [state.level, state.hydrated, instant]);

  const style = shown ? levelStyle[shown] : null;
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-24 z-50 flex justify-center px-4">
      <AnimatePresence>
        {shown && style && (
          <m.div
            key={shown}
            initial={{ scale: 0.4, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 420, damping: 18 }}
            className="flex items-center gap-3 rounded-3xl border-4 bg-surface px-5 py-3 shadow-2xl"
            style={{ borderColor: style.color }}
          >
            <span className="text-3xl" aria-hidden="true">
              🏆
            </span>
            <span className="flex flex-col">
              <span className="text-lg leading-tight font-extrabold">{levelUp.cleared(shown)}</span>
              <span className="text-sm font-bold text-good">{levelUp.xp}</span>
            </span>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
