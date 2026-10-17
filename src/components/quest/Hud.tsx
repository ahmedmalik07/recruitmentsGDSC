"use client";

import { useEffect, useRef } from "react";
import { m } from "framer-motion";
import { levelNames, ui } from "@/content";
import { Avatar, avatarParts } from "./Avatar";
import { useInstant, useQuest } from "./state";
import { computeXp } from "./progress";

export function Hud() {
  const { state, dispatch, quizScore } = useQuest();
  const { xp, pct } = computeXp(state, quizScore);
  const instant = useInstant();
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // Announce the new level to screen readers by moving focus to its heading
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    heading.current?.focus({ preventScroll: true });
  }, [state.level]);

  const showAvatar = state.level >= 3;

  return (
    <header className="sticky top-0 z-40 -mx-4 border-b border-line/60 bg-bg/95 px-4 pt-2.5 pb-2.5 backdrop-saturate-150 md:-mx-6 md:px-6 lg:mx-0 lg:px-0 lg:pt-6">
      <div className="flex items-center justify-between gap-2.5">
        {/* Live character on phones/tablets so every change is visible while filling the form */}
        {showAvatar && (
          <div className="-my-1 shrink-0 lg:hidden" aria-hidden="true">
            <div className="avatar-bob">
              <Avatar parts={avatarParts(state.draft)} size={46} showName={false} animated={!instant} />
            </div>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-wide text-eyebrow uppercase">{ui.level(state.level)}</p>
          {state.level > 0 ? (
            <h1 ref={heading} tabIndex={-1} className="truncate text-sm font-semibold outline-none">
              {levelNames[state.level]}
            </h1>
          ) : (
            <p className="truncate text-sm font-semibold">{levelNames[state.level]}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <m.span
            key={xp}
            initial={instant ? false : { scale: 1.25 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
            className="inline-flex items-center gap-1 rounded-full border-2 border-[#f6d36b] bg-tint-yellow px-2.5 py-0.5 text-xs font-extrabold tabular-nums"
          >
            <span aria-hidden="true">⭐</span>
            {xp}
            <span className="sr-only">{ui.xp}</span>
          </m.span>
          <button
            type="button"
            aria-pressed={state.speedMode}
            onClick={() => dispatch({ type: "speed", on: !state.speedMode })}
            className="flex min-h-9 items-center gap-1.5 rounded-full border-2 border-line bg-surface px-2.5 text-xs font-bold"
            title={state.speedMode ? ui.speedModeOn : ui.speedMode}
          >
            <span aria-hidden="true">⚡</span>
            <span className="sr-only">{ui.speedMode}</span>
            <span aria-hidden="true">{ui.speedShort}</span>
            <span
              aria-hidden="true"
              className={`relative h-4 w-7 rounded-full transition-colors ${state.speedMode ? "bg-g-green" : "bg-line"}`}
            >
              <span
                className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-[left] ${state.speedMode ? "left-3.5" : "left-0.5"}`}
              />
            </span>
          </button>
        </div>
      </div>
      <div
        className="relative mt-2 h-3 overflow-hidden rounded-full bg-surface-2 ring-1 ring-line"
        role="progressbar"
        aria-label="Quest progress"
        aria-valuemin={0}
        aria-valuemax={7}
        aria-valuenow={state.level}
        aria-valuetext={ui.level(state.level)}
      >
        <m.div
          className="xp-shimmer relative h-full overflow-hidden rounded-full"
          style={{
            background: "linear-gradient(90deg,#4285F4,#EA4335,#FBBC04,#34A853)",
            backgroundSize: "360px 100%",
            originX: 0,
          }}
          initial={false}
          animate={{ scaleX: Math.max(pct, 0.02) }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
        {/* Level notches */}
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <span key={n} aria-hidden="true" className="absolute top-0 h-full w-0.5 bg-white/80" style={{ left: `${(n / 7) * 100}%` }} />
        ))}
      </div>
    </header>
  );
}
