"use client";

import { useState, type ReactNode } from "react";
import { m } from "framer-motion";
import { level7, ui } from "@/content";
import { Button } from "@/components/ui/Button";
import { NpcChat, type Line } from "./NpcChat";
import { useInstant, useQuest } from "./state";

type Props = {
  chatId: string;
  chat: Line[];
  title?: string;
  children: ReactNode;
  /** Return false to block (e.g. show validation errors). */
  onNext?: () => boolean | void;
  canNext?: boolean;
  nextLabel?: string;
  nextHint?: string;
  hideNav?: boolean;
  hideBack?: boolean;
};

/**
 * Standard level layout: NPC chat on top, content revealed after the chat,
 * sticky Back / Next bar at the bottom.
 */
export function LevelShell({
  chatId,
  chat,
  title,
  children,
  onNext,
  canNext = true,
  nextLabel = ui.next,
  nextHint,
  hideNav,
  hideBack,
}: Props) {
  const { state, next, back } = useQuest();
  const instant = useInstant();
  const [ready, setReady] = useState(instant);

  function handleNext() {
    if (onNext && onNext() === false) return;
    next();
  }

  return (
    <section className="flex flex-col gap-5 pt-4 pb-4 md:pt-6" aria-labelledby={title ? `${chatId}-title` : undefined}>
      {title && (
        <h1 id={`${chatId}-title`} className="text-2xl leading-tight font-bold">
          {title}
        </h1>
      )}
      <NpcChat id={chatId} lines={chat} onDone={() => setReady(true)} />
      {(ready || instant) && (
        <m.div
          initial={instant ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-5"
        >
          {children}
        </m.div>
      )}

      {!hideNav && (
        <nav
          aria-label="Level navigation"
          className="sticky bottom-0 z-30 -mx-4 mt-2 border-t border-line bg-bg/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] md:-mx-6 md:px-6 lg:bottom-4 lg:mx-0 lg:rounded-2xl lg:border lg:bg-surface/95 lg:px-4 lg:pb-3 lg:shadow-lg"
        >
          <div className="flex items-center gap-3">
            {!state.editingFromReview && !hideBack && (
              <Button variant="secondary" onClick={back} aria-label="Previous level">
                ←
              </Button>
            )}
            <div className="flex flex-1 flex-col items-stretch">
              <Button block onClick={handleNext} disabled={!canNext || !(ready || instant)}>
                {state.editingFromReview ? level7.backToReview : nextLabel} →
              </Button>
            </div>
          </div>
          {nextHint && !canNext && (
            <p className="mt-1.5 text-center text-xs text-muted">{nextHint}</p>
          )}
        </nav>
      )}
    </section>
  );
}
