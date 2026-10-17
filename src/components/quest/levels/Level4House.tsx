"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { DOMAIN_IDS, domains, level4, type DomainId } from "@/content";
import { fieldErrors, houseSchema } from "@/lib/schema";
import { ChipMulti, ChipRadio } from "@/components/ui/Chips";
import { Avatar, avatarParts } from "../Avatar";
import { IntroVideo } from "../IntroVideo";
import { LevelShell } from "../LevelShell";
import { NpcChat, say } from "../NpcChat";
import { toast } from "../toast";
import { useInstant, useQuest } from "../state";

export function Level4House() {
  const { state, set } = useQuest();
  const instant = useInstant();
  const d = state.draft;
  const [error, setError] = useState<string>();
  const [positionError, setPositionError] = useState<string>();
  const doorRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function pick(id: DomainId) {
    if (d.domain !== id) toast(`${domains[id].house} emblem unlocked`, 10);
    set({ domain: id });
    setError(undefined);
  }

  function onKey(e: KeyboardEvent, i: number) {
    const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const n = (i + dir + DOMAIN_IDS.length) % DOMAIN_IDS.length;
    pick(DOMAIN_IDS[n]);
    doorRefs.current[n]?.focus();
  }

  function onNext() {
    const r = houseSchema.safeParse({ domain: d.domain ?? undefined, position: d.position, skillTags: d.skillTags });
    if (r.success) return true;
    const errs = fieldErrors(r.error);
    if (errs.domain) {
      setError("Pick one door to continue");
      doorRefs.current[0]?.focus();
    } else if (errs.position) {
      setPositionError(errs.position);
      document.querySelector<HTMLButtonElement>('[aria-labelledby="f-position"] [role="radio"]')?.focus();
    }
    return false;
  }

  const house = d.domain ? domains[d.domain] : null;
  const selectedIndex = d.domain ? DOMAIN_IDS.indexOf(d.domain) : -1;

  return (
    <LevelShell chatId="l4" chat={say("ahmed", level4.npc)} onNext={onNext}>
      <IntroVideo instant={instant} />

      <div className="flex flex-col gap-3">
        <h2 id="doors-label" className="text-lg font-bold">
          {level4.doorsTitle}
        </h2>
        <div
          role="radiogroup"
          aria-labelledby="doors-label"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 [&>*:last-child:nth-child(odd)]:col-span-2 sm:[&>*:last-child:nth-child(odd)]:col-span-1"
        >
          {DOMAIN_IDS.map((id, i) => {
            const dom = domains[id];
            const checked = d.domain === id;
            return (
              <button
                key={id}
                ref={(el) => {
                  doorRefs.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={checked}
                tabIndex={checked || (selectedIndex === -1 && i === 0) ? 0 : -1}
                onClick={() => pick(id)}
                onKeyDown={(e) => onKey(e, i)}
                className="door relative flex min-h-[200px] flex-col overflow-hidden rounded-t-[48px] rounded-b-2xl border-2 bg-surface text-left"
                style={{ borderColor: checked ? dom.color : "var(--color-line)" }}
              >
                {/* Door panel swings open when picked */}
                <span
                  aria-hidden="true"
                  className="door-panel absolute inset-0 rounded-t-[46px]"
                  style={{ background: dom.color, opacity: checked ? 0.18 : 0.1 }}
                />
                <span className="relative flex flex-1 flex-col gap-1.5 p-3 pt-5">
                  <span
                    className="self-start rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                    style={{ background: dom.solid, color: dom.onColor }}
                  >
                    {dom.house}
                  </span>
                  <span className="text-[17px] leading-tight font-bold">{dom.label}</span>
                  <span className="text-[13px] leading-snug text-muted">{dom.description[0]}</span>
                  <span className="text-[13px] leading-snug text-muted">{dom.description[1]}</span>
                  {dom.lead && <span className="mt-auto text-xs text-muted">Lead: {dom.lead}</span>}
                </span>
                {checked && (
                  <span
                    className="relative py-1.5 text-center text-xs font-bold"
                    style={{ background: dom.solid, color: dom.onColor }}
                  >
                    ✓ {level4.chosen}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}
      </div>

      {house && (
        <>
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
            <Avatar parts={avatarParts(d)} size={64} showName={false} animated={!instant} />
            <NpcChat id={`l4-pick-${house.id}`} lines={say("ahmed", [level4.npcAfterPick(house.house)])} />
          </div>
          <div className="flex flex-col gap-2">
            <ChipRadio
              label={level4.positionTitle}
              labelId="f-position"
              options={house.positions.map((p) => ({ value: p.id, label: p.label }))}
              value={d.position || null}
              onChange={(v) => {
                set({ position: v });
                setPositionError(undefined);
              }}
              color={house.solid}
              error={positionError}
            />
            {house.positions.some((p) => p.id === "lead") && (
              <p className="text-sm text-muted">{level4.positionNote}</p>
            )}
          </div>
          <ChipMulti
            label={level4.skillsTitle}
            labelId="f-skills"
            options={house.skills}
            values={d.skillTags}
            onChange={(v) => set({ skillTags: v })}
            color={house.solid}
          />
        </>
      )}
    </LevelShell>
  );
}

