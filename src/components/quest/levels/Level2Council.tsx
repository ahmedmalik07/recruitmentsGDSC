"use client";

import { useState } from "react";
import { hosts, level2, type HostId } from "@/content";
import { cn } from "@/lib/cn";
import { HostPhoto } from "../HostPhoto";
import { LevelShell } from "../LevelShell";
import { say } from "../NpcChat";
import { Tilt } from "../Tilt";
import { toast } from "../toast";
import { useQuest } from "../state";

/** President first, then the guide, then the General Secretary. All three cards are the same size. */
const ORDER: HostId[] = ["sumaiya", "ahmed", "rafay"];

export function Level2Council() {
  const { state, dispatch } = useQuest();
  const flippedCount = ORDER.filter((id) => state.flipped.includes(id)).length;
  const [faceUp, setFaceUp] = useState<Partial<Record<HostId, boolean>>>({});

  function flip(id: HostId) {
    setFaceUp((f) => ({ ...f, [id]: !f[id] }));
    if (!state.flipped.includes(id)) {
      dispatch({ type: "flip", id });
      toast(level2.unlocked(hosts[id].firstName), 10);
    }
  }

  return (
    <LevelShell
      chatId="l2"
      chat={[...say("ahmed", level2.npc.ahmed), ...say("sumaiya", level2.npc.sumaiya)]}
      canNext={flippedCount === 3}
      nextHint={level2.nextHint}
    >
      <p className="text-sm font-semibold text-muted" aria-live="polite">
        {level2.progress(flippedCount)}
      </p>
      {/* Phones: one per row. Small tablets: two, with the third centred below. Wide: one row. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {ORDER.map((id, i) => (
          <FlipCard
            key={id}
            id={id}
            flipped={Boolean(faceUp[id])}
            onFlip={() => flip(id)}
            className={i === 2 ? "sm:col-span-2 sm:mx-auto sm:w-[calc(50%-0.5rem)] md:col-span-1 md:mx-0 md:w-auto" : undefined}
          />
        ))}
      </div>
    </LevelShell>
  );
}

function FlipCard({
  id,
  flipped,
  onFlip,
  className,
}: {
  id: HostId;
  flipped: boolean;
  onFlip: () => void;
  className?: string;
}) {
  const host = hosts[id];
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Tilt>
        <div className="flip h-[400px] md:h-[440px]">
          <button
            type="button"
            onClick={onFlip}
            aria-pressed={flipped}
            aria-label={`${host.name}, ${host.role}. ${flipped ? "Flipped" : "Tap to flip"}`}
            className={cn("flip-inner block text-left", flipped && "is-flipped")}
          >
            {/* Front */}
            <span
              className="flip-face flex flex-col items-center justify-center gap-2 rounded-3xl border-[3px] p-4 text-center"
              style={{
                borderColor: host.accent,
                background: `linear-gradient(180deg, ${host.accent}24 0%, var(--color-surface) 55%)`,
              }}
            >
              <span
                className="absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm"
                style={{ background: host.badge.bg }}
              >
                {host.badge.text}
              </span>
              <HostPhoto id={id} size={128} portrait priority={id !== "rafay"} />
              <span className="text-2xl font-bold">{host.name}</span>
              <span className="text-sm text-muted">{host.role}</span>
              <span className="mt-1 text-xs font-semibold text-eyebrow">{level2.flipHint} ↻</span>
            </span>

            {/* Back */}
            <span
              className="flip-face flip-back flex flex-col justify-center gap-2 overflow-hidden rounded-3xl border-[3px] p-4"
              style={{ borderColor: host.accent, background: "var(--color-surface-2)" }}
            >
              <span className="text-xs font-bold tracking-wide uppercase" style={{ color: "var(--color-ink)" }}>
                {host.firstName} · {host.role}
              </span>
              {host.stats && (
                <ul className="flex flex-col gap-1.5">
                  {host.stats.map((line) => (
                    <li key={line} className="flex items-start gap-2 text-[14px] leading-snug font-semibold">
                      <span aria-hidden="true" style={{ color: host.badge.bg }}>
                        ▸
                      </span>
                      {line}
                    </li>
                  ))}
                </ul>
              )}
              {(!host.stats || host.stats.length <= 3) && (
                <span className="text-[13px] leading-snug text-muted">{host.bio}</span>
              )}
              {host.funFact && (
                <span className="text-[13px] leading-snug">
                  <span aria-hidden="true">💡 </span>
                  {host.funFact}
                </span>
              )}
            </span>
          </button>
        </div>
      </Tilt>
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
          {level2.linkedin}
        </a>
      )}
    </div>
  );
}
