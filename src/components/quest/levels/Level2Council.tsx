"use client";

import { useState } from "react";
import { ahmedStats, hosts, level2, type HostId } from "@/content";
import { cn } from "@/lib/cn";
import { HostPhoto } from "../HostPhoto";
import { LevelShell } from "../LevelShell";
import { say } from "../NpcChat";
import { toast } from "../toast";
import { useQuest } from "../state";

const ORDER: HostId[] = ["sumaiya", "rafay", "ahmed"];

export function Level2Council() {
  const { state, dispatch } = useQuest();
  const flippedCount = ORDER.filter((id) => state.flipped.includes(id)).length;
  const [faceUp, setFaceUp] = useState<Partial<Record<HostId, boolean>>>({});

  function flip(id: HostId) {
    setFaceUp((f) => ({ ...f, [id]: !f[id] }));
    if (!state.flipped.includes(id)) {
      dispatch({ type: "flip", id });
      toast(`${hosts[id].firstName} unlocked`, 10);
    }
  }

  return (
    <LevelShell
      chatId="l2"
      chat={say("ahmed", level2.npc.ahmed)}
      canNext={flippedCount === 3}
      nextHint="Flip all 3 cards to continue"
    >
      <p className="text-sm font-semibold text-muted" aria-live="polite">
        {level2.progress(flippedCount)}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {ORDER.map((id) => (
          <FlipCard key={id} id={id} big={id === "ahmed"} flipped={Boolean(faceUp[id])} onFlip={() => flip(id)} />
        ))}
      </div>
    </LevelShell>
  );
}

function FlipCard({
  id,
  big,
  flipped,
  onFlip,
}: {
  id: HostId;
  big: boolean;
  flipped: boolean;
  onFlip: () => void;
}) {
  const host = hosts[id];
  return (
    <div className={cn("flip", big ? "col-span-2 h-[340px]" : "h-[240px]")}>
      <button
        type="button"
        onClick={onFlip}
        aria-pressed={flipped}
        aria-label={`${host.name}, ${host.role}. ${flipped ? "Flipped" : "Tap to flip"}`}
        className={cn("flip-inner block text-left", flipped && "is-flipped")}
      >
        {/* Front */}
        <span
          className="flip-face flex flex-col items-center justify-center gap-2 rounded-3xl border-2 bg-surface p-4 text-center"
          style={{ borderColor: big ? host.accent : "var(--color-line)" }}
        >
          {big && (
            <span className="absolute top-3 left-3 rounded-full bg-g-blue-strong px-3 py-1 text-xs font-bold text-white">
              ⭐ {level2.guideBadge}
            </span>
          )}
          <HostPhoto id={id} size={big ? 112 : 76} />
          <span className={cn("font-bold", big ? "text-2xl" : "text-lg")}>{host.name}</span>
          <span className="text-sm text-muted">{host.role}</span>
          <span className="mt-1 text-xs font-semibold text-g-yellow">{level2.flipHint} ↻</span>
        </span>

        {/* Back */}
        <span
          className="flip-face flip-back flex flex-col justify-center gap-2 rounded-3xl border-2 p-4"
          style={{ borderColor: host.accent, background: "var(--color-surface-2)" }}
        >
          <span className="text-xs font-bold tracking-wide uppercase" style={{ color: "#F1F3F9" }}>
            {host.firstName} · {host.role}
          </span>
          {big ? (
            <>
              <ul className="flex flex-col gap-1.5">
                {ahmedStats.map((s) => (
                  <li key={s} className="flex items-center gap-2 text-[15px] font-semibold">
                    <span aria-hidden="true" className="text-g-yellow">
                      ▸
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
              <span className="text-sm text-muted">{host.bio}</span>
              <span className="text-sm">
                <span aria-hidden="true">💡 </span>
                {host.funFact}
              </span>
            </>
          ) : (
            <>
              <span className="text-sm leading-snug text-muted">{host.bio}</span>
              <span className="text-sm leading-snug">
                <span aria-hidden="true">💡 </span>
                {host.funFact}
              </span>
            </>
          )}
        </span>
      </button>
    </div>
  );
}
