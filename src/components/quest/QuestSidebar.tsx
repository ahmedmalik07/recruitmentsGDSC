"use client";

import Image from "next/image";
import { domains, hosts, levelNames, sidebar, site, ui } from "@/content";
import { cn } from "@/lib/cn";
import { avatarParts } from "./Avatar";
import { PokeAvatar } from "./PokeAvatar";
import { computeXp } from "./progress";
import { useQuest } from "./state";

/**
 * Desktop-only side panel: live character, quest map, help link.
 * Hidden below the lg breakpoint, where the quest stays a single column.
 */
export function QuestSidebar() {
  const { state, dispatch, quizScore } = useQuest();
  const parts = avatarParts(state.draft);
  const house = state.draft.domain ? domains[state.draft.domain] : null;
  const { xp } = computeXp(state, quizScore);
  const started = state.maxLevel > 0 || Boolean(state.draft.fullName);
  const whatsapp = `https://wa.me/${site.whatsapp.number}`;

  return (
    <aside className="hidden lg:block" aria-label="Quest panel">
      <div className="sticky top-6 flex flex-col gap-4 py-6">
        <Image
          src={site.art}
          alt={`${site.chapterName}: the Air University building in Google colors`}
          width={site.artSize.width}
          height={site.artSize.height}
          sizes="300px"
          priority
          className="h-auto w-full drop-shadow-sm"
        />

        <section className="flex flex-col items-center gap-2 rounded-3xl border border-line bg-surface p-5 shadow-sm">
          <h2 className="self-start text-xs font-bold tracking-wide text-eyebrow uppercase">{sidebar.title}</h2>
          <PokeAvatar
            parts={parts}
            size={190}
            unlocked={[parts.face, parts.lanyard, parts.number, parts.sneakers, parts.level, parts.domain, parts.role].filter(Boolean).length}
          />
          {house ? (
            <span
              className="rounded-full px-3 py-1 text-xs font-bold"
              style={{ background: house.solid, color: house.onColor }}
            >
              {house.house}
            </span>
          ) : (
            !started && <p className="text-center text-sm text-muted">{sidebar.empty}</p>
          )}
          <p className="text-sm text-muted">
            {ui.level(state.level)} · <span className="font-semibold text-ink tabular-nums">{xp} XP</span>
          </p>
        </section>

        <nav aria-label={sidebar.map} className="rounded-3xl border border-line bg-surface p-3 shadow-sm">
          <h2 className="px-2 pb-2 text-xs font-bold tracking-wide text-eyebrow uppercase">{sidebar.map}</h2>
          <ol className="flex flex-col gap-0.5">
            {levelNames.map((name, i) => {
              const current = i === state.level;
              const done = i < state.maxLevel || (state.submitted && i === 7);
              const reachable = i <= state.maxLevel && !state.submitted && state.hydrated;
              return (
                <li key={name}>
                  <button
                    type="button"
                    disabled={!reachable || current}
                    aria-current={current ? "step" : undefined}
                    onClick={() => dispatch({ type: "go", level: i })}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm transition-colors",
                      current && "bg-surface-2 font-semibold",
                      reachable && !current && "hover:bg-surface-2",
                      !reachable && !current && "text-muted",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                        done ? "bg-g-green-strong text-white" : current ? "bg-g-blue-strong text-white" : "bg-surface-2",
                      )}
                    >
                      {done ? "✓" : i}
                    </span>
                    {name}
                    {done && <span className="sr-only">(done)</span>}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl px-3 py-2 text-sm text-muted hover:text-ink"
        >
          {sidebar.help} {hosts.ahmed.firstName}: <span className="font-semibold text-link">{site.whatsapp.display}</span>
        </a>
      </div>
    </aside>
  );
}
