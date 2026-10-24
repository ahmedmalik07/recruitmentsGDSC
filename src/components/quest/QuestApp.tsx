"use client";

import { useEffect, useState, type ComponentType } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m } from "framer-motion";
import { site } from "@/content";
import { music } from "@/lib/music";
import { Hud } from "./Hud";
import { QuestClosed } from "./QuestClosed";
import { BackgroundFX } from "./BackgroundFX";
import { LevelUp } from "./LevelUp";
import { QuestSidebar } from "./QuestSidebar";
import { SiteFooter } from "./SiteFooter";
import { QuestProvider, useInstant, useQuest } from "./state";
import { Toaster } from "./toast";
import { Level0Start } from "./levels/Level0Start";

/**
 * Levels 1-7 are loaded on demand so the title screen ships as little JS as possible.
 * While on a level, the next one is pre-fetched in the background.
 */
const LOADERS: Array<() => Promise<ComponentType>> = [
  async () => Level0Start,
  () => import("./levels/Level1Welcome").then((m) => m.Level1Welcome),
  () => import("./levels/Level2Council").then((m) => m.Level2Council),
  () => import("./levels/Level3Character").then((m) => m.Level3Character),
  () => import("./levels/Level4House").then((m) => m.Level4House),
  () => import("./levels/Level5Story").then((m) => m.Level5Story),
  () => import("./levels/Level6Boss").then((m) => m.Level6Boss),
  () => import("./levels/Level7Review").then((m) => m.Level7Review),
];

function LevelLoading() {
  return (
    <div className="flex flex-col gap-4 pt-4" aria-busy="true" aria-label="Loading level">
      <div className="h-[86px] animate-pulse rounded-3xl bg-surface-2" />
      <div className="h-16 w-3/4 animate-pulse rounded-2xl bg-surface-2" />
      <div className="h-40 animate-pulse rounded-3xl bg-surface-2" />
    </div>
  );
}

const LEVELS: ComponentType[] = LOADERS.map((load, i) =>
  i === 0 ? Level0Start : dynamic(load, { loading: LevelLoading }),
);

export function QuestApp() {
  return (
    <LazyMotion features={domAnimation} strict>
      <QuestProvider>
        <Quest />
      </QuestProvider>
    </LazyMotion>
  );
}

function Quest() {
  const { state } = useQuest();
  const instant = useInstant();
  const [isClosed, setIsClosed] = useState<boolean>(site.closed);

  // Checked on the client after mount (the page is statically rendered).
  // The API enforces the same deadline server side.
  useEffect(() => {
    const deadline = Date.parse(site.deadline);
    const check = () => setIsClosed(site.closed || (Number.isFinite(deadline) && Date.now() > deadline));
    check();
    const id = window.setInterval(check, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const Level = LEVELS[state.level] ?? Level0Start;

  // The soundtrack follows the level (calm while typing, louder for the boss) and the sound toggle
  useEffect(() => music.setLevel(state.level), [state.level]);
  useEffect(() => music.setEnabled(state.soundOn), [state.soundOn]);

  // Warm the next level's code while the player reads this one
  useEffect(() => {
    if (!state.hydrated) return;
    const nextLoad = LOADERS[Math.min(state.level + 1, LOADERS.length - 1)];
    const t = window.setTimeout(() => void nextLoad().catch(() => {}), 1200);
    return () => window.clearTimeout(t);
  }, [state.level, state.hydrated]);

  return (
    <MotionConfig reducedMotion={state.speedMode ? "always" : "user"}>
      <div
        data-speed={state.speedMode ? "on" : "off"}
        className="mx-auto min-h-dvh w-full max-w-md px-4 md:max-w-2xl md:px-6 lg:grid lg:max-w-6xl lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-12 lg:px-8"
      >
        <BackgroundFX />
        {/* Anyone who already applied keeps their success screen and card */}
        {isClosed && !(state.level === 7 && state.submitted) ? (
          <main className="lg:col-span-2 lg:mx-auto lg:w-full lg:max-w-xl">
            <QuestClosed />
          </main>
        ) : (
          <>
            <QuestSidebar />
            <div className="min-w-0 lg:max-w-2xl">
            <Hud />
            <main>
              <AnimatePresence mode="wait" initial={false}>
                <m.div
                  key={state.level}
                  initial={instant ? false : { opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={instant ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, x: -24 }}
                  transition={{ duration: 0.22 }}
                >
                  <Level />
                </m.div>
              </AnimatePresence>
            </main>
            <SiteFooter />
            </div>
            <Toaster />
            <LevelUp />
          </>
        )}
      </div>
    </MotionConfig>
  );
}
