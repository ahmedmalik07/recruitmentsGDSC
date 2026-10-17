"use client";

import { useEffect, useState, type ComponentType } from "react";
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m } from "framer-motion";
import { site } from "@/content";
import { Hud } from "./Hud";
import { QuestClosed } from "./QuestClosed";
import { QuestProvider, useInstant, useQuest } from "./state";
import { Toaster } from "./toast";
import { Level0Start } from "./levels/Level0Start";
import { Level1Welcome } from "./levels/Level1Welcome";
import { Level2Council } from "./levels/Level2Council";
import { Level3Character } from "./levels/Level3Character";
import { Level4House } from "./levels/Level4House";
import { Level5Story } from "./levels/Level5Story";
import { Level6Boss } from "./levels/Level6Boss";
import { Level7Review } from "./levels/Level7Review";

const LEVELS: ComponentType[] = [
  Level0Start,
  Level1Welcome,
  Level2Council,
  Level3Character,
  Level4House,
  Level5Story,
  Level6Boss,
  Level7Review,
];

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
  const [isClosed, setIsClosed] = useState(false);

  // Checked on the client after mount (the page is statically rendered).
  // The API enforces the same deadline server side.
  useEffect(() => {
    const deadline = Date.parse(site.deadline);
    const check = () => setIsClosed(Number.isFinite(deadline) && Date.now() > deadline);
    check();
    const id = window.setInterval(check, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const Level = LEVELS[state.level] ?? Level0Start;

  return (
    <MotionConfig reducedMotion={state.speedMode ? "always" : "user"}>
      <div data-speed={state.speedMode ? "on" : "off"} className="mx-auto min-h-dvh w-full max-w-md px-4">
        {isClosed && state.level !== 7 ? (
          <QuestClosed />
        ) : (
          <>
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
            <Toaster />
          </>
        )}
      </div>
    </MotionConfig>
  );
}
