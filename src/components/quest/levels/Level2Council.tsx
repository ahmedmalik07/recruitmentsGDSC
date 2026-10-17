"use client";

import { useState } from "react";
import { hosts, level2, type HostId } from "@/content";
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
      {/* Phones: one card per row. Small tablets: Sumaiya + Rafay side by side,
          Ahmed's big card below. Wider screens: one row with Ahmed in the middle. */}
      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-4">
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
    <div
      className={cn(
        "flex flex-col gap-2",
        big ? "sm:col-span-2 md:order-2 md:col-span-1" : id === "rafay" ? "md:order-3" : "md:order-1",
      )}
    >
    <div className={cn("flip", big ? "h-[360px] md:h-[420px]" : "h-[270px] sm:h-[300px] md:h-[390px]")}>
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
          <HostPhoto id={id} size={big ? 132 : 76} portrait={big} priority={big} />
          <span className={cn("font-bold", big ? "text-2xl" : "text-lg")}>{host.name}</span>
          <span className="text-sm text-muted">{host.role}</span>
          <span className="mt-1 text-xs font-semibold text-eyebrow">{level2.flipHint} ↻</span>
        </span>

        {/* Back */}
        <span
          className="flip-face flip-back flex flex-col justify-center gap-2 overflow-hidden rounded-3xl border-2 p-3.5 md:p-4"
          style={{ borderColor: host.accent, background: "var(--color-surface-2)" }}
        >
          <span className="text-xs font-bold tracking-wide uppercase" style={{ color: "var(--color-ink)" }}>
            {host.firstName} · {host.role}
          </span>
          {host.stats && (
            <ul className="flex flex-col gap-1.5">
              {host.stats.map((line) => (
                <li
                  key={line}
                  className={cn("flex items-start gap-2 leading-snug font-semibold", big ? "text-[15px]" : "text-[13px]")}
                >
                  <span aria-hidden="true" className="text-eyebrow">
                    ▸
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          )}
          {(big || !host.stats) && <span className="text-sm leading-snug text-muted">{host.bio}</span>}
          {host.funFact && (
            <span className={cn("leading-snug", big ? "text-sm" : "text-[13px]")}>
              <span aria-hidden="true">💡 </span>
              {host.funFact}
            </span>
          )}
        </span>
      </button>
    </div>
    {host.linkedin && (
      <a
        href={host.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${host.firstName} on LinkedIn (opens in a new tab)`}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-line bg-surface px-4 text-sm font-semibold text-link hover:bg-surface-2"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="#0A66C2">
          <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
        </svg>
        {big ? level2.linkedin : level2.linkedinShort}
      </a>
    )}
    </div>
  );
}
