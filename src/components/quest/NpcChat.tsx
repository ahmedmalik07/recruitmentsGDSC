"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { hosts, ui, type HostId } from "@/content";
import { HostPhoto } from "./HostPhoto";
import { useInstant } from "./state";

export type Line = { host: HostId; text: string };

export function say(host: HostId, lines: readonly string[]): Line[] {
  return lines.map((text) => ({ host, text }));
}

const TINT: Record<HostId, string> = {
  sumaiya: "var(--color-tint-red)",
  ahmed: "var(--color-tint-blue)",
  rafay: "var(--color-tint-green)",
};

/** Chats already played this session. Going Back to a level shows them instantly. */
const played = new Set<string>();

/**
 * NPC chat bubbles. Each line shows a typing indicator, then the message.
 * Speed mode / reduced motion / replays show everything at once.
 */
export function NpcChat({
  id,
  lines,
  onDone,
}: {
  /** Unique per chat, used to skip replays */
  id: string;
  lines: Line[];
  onDone?: () => void;
}) {
  const instant = useInstant();
  const skip = instant || played.has(id);
  const [shown, setShown] = useState(0);
  const visible = skip ? lines.length : Math.min(shown, lines.length);
  const done = visible >= lines.length;

  useEffect(() => {
    if (done) {
      played.add(id);
      onDone?.();
      return;
    }
    const delay = Math.min(1100, 450 + lines[visible].text.length * 12);
    const t = window.setTimeout(() => setShown((n) => n + 1), delay);
    return () => window.clearTimeout(t);
    // onDone / lines intentionally omitted: callers pass inline values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, done, id]);

  const nextHost = lines[Math.min(visible, lines.length - 1)]?.host;

  return (
    <div
      className="flex flex-col gap-2"
      aria-live="polite"
      onClick={() => !done && setShown(lines.length)}
    >
      {lines.slice(0, visible).map((line, i) => {
        const firstOfRun = i === 0 || lines[i - 1].host !== line.host;
        return (
          <Bubble key={i} line={line} showHost={firstOfRun} animate={!skip} />
        );
      })}
      {!done && nextHost && (
        <div className="flex items-end gap-2" aria-label={`${hosts[nextHost].firstName} is typing`}>
          <HostPhoto id={nextHost} size={32} />
          <div className="flex gap-1 rounded-2xl rounded-bl-md px-4 py-3" style={{ background: TINT[nextHost] }}>
            {[0, 1, 2].map((d) => (
              <span
                key={d}
                className="typing-dot h-2 w-2 rounded-full bg-muted"
                style={{ animationDelay: `${d * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}
      {!done && (
        <button
          type="button"
          onClick={() => setShown(lines.length)}
          className="self-start px-1 text-xs text-muted underline underline-offset-2"
        >
          {ui.skipChat}
        </button>
      )}
    </div>
  );
}

function Bubble({ line, showHost, animate }: { line: Line; showHost: boolean; animate: boolean }) {
  const host = hosts[line.host];
  return (
    <m.div
      initial={animate ? { opacity: 0, y: 6 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-end gap-2"
    >
      {showHost ? <HostPhoto id={line.host} size={32} /> : <span className="w-8 shrink-0" />}
      <div
        className="max-w-[85%] rounded-2xl rounded-bl-md border-l-4 px-4 py-2.5 text-[15px] leading-snug shadow-sm"
        style={{ background: TINT[line.host], borderLeftColor: host.accent }}
      >
        {showHost && (
          <span className="mb-0.5 flex items-center gap-1.5 text-xs font-semibold text-muted">
            <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: host.accent }} />
            {host.firstName} · {host.role}
          </span>
        )}
        {line.text}
      </div>
    </m.div>
  );
}
