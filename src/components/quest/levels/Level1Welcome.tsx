"use client";

import { useState } from "react";
import { AnimatePresence, m, type PanInfo } from "framer-motion";
import { introCards, level1 } from "@/content";
import { LevelShell } from "../LevelShell";
import { NpcChat, say } from "../NpcChat";
import { useInstant, useQuest } from "../state";

export function Level1Welcome() {
  const instant = useInstant();
  const { state } = useQuest();
  const [index, setIndex] = useState(0);
  const [seenAll, setSeenAll] = useState(state.maxLevel > 1);
  const [dir, setDir] = useState(1);

  function go(to: number) {
    const clamped = Math.max(0, Math.min(introCards.length - 1, to));
    setDir(clamped > index ? 1 : -1);
    setIndex(clamped);
    if (clamped === introCards.length - 1) setSeenAll(true);
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -50 || info.velocity.x < -400) go(index + 1);
    else if (info.offset.x > 50 || info.velocity.x > 400) go(index - 1);
  }

  const card = introCards[index];

  return (
    <LevelShell
      chatId="l1"
      chat={say("sumaiya", level1.npcIntro)}
      canNext={seenAll}
      nextHint="Swipe through all 3 cards first"
    >
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="About GDG on Campus"
        className="flex flex-col gap-3"
      >
        <div className="relative h-[260px] overflow-hidden">
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <m.article
              key={index}
              custom={dir}
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${introCards.length}`}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={onDragEnd}
              initial={instant ? false : { x: dir * 280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={instant ? { opacity: 0 } : { x: dir * -280, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-0 flex cursor-grab touch-pan-y flex-col justify-between rounded-3xl border border-line bg-surface p-6 active:cursor-grabbing"
            >
              <span className="text-5xl" aria-hidden="true">
                {card.emoji}
              </span>
              <div>
                <h2 className="mb-2 text-xl font-bold">{card.title}</h2>
                <p className="text-[15px] leading-relaxed text-muted">{card.body}</p>
              </div>
            </m.article>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            aria-label="Previous card"
            className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-lg disabled:opacity-30"
          >
            ‹
          </button>
          <div className="flex gap-2" aria-hidden="true">
            {introCards.map((_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-g-blue" : "w-2 bg-line"}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(index + 1)}
            disabled={index === introCards.length - 1}
            aria-label="Next card"
            className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-lg disabled:opacity-30"
          >
            ›
          </button>
        </div>
        <p className="text-center text-xs text-muted">{level1.swipeHint}</p>
      </div>

      {seenAll && <NpcChat id="l1-handover" lines={say("sumaiya", [level1.handover])} />}
    </LevelShell>
  );
}
