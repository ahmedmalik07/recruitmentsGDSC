"use client";

import { useState } from "react";
import { m } from "framer-motion";
import {
  EXCITED,
  HOURS,
  TEAM_ROLES,
  domains,
  hoursLabels,
  level5,
  roleAccessory,
} from "@/content";
import { countWords, detectLinkKind, fieldErrors, filledLinks, normalizeLink, storySchema } from "@/lib/schema";
import { describedBy, Field } from "@/components/ui/Field";
import { ChipMulti, ChipRadio } from "@/components/ui/Chips";
import { HostPhoto } from "../HostPhoto";
import { LevelShell } from "../LevelShell";
import { linkInputId, linkRowError, LinksEditor } from "../LinksEditor";
import { say } from "../NpcChat";
import { PowerMeter } from "../PowerMeter";
import { toast } from "../toast";
import { useInstant, useQuest } from "../state";

type Key =
  | "experience"
  | "achievements"
  | "whyJoin"
  | "links"
  | "teamRole"
  | "hoursPerWeek"
  | "excitedAbout"
  | "funFact";
const ORDER: Key[] = [
  "experience",
  "achievements",
  "whyJoin",
  "links",
  "teamRole",
  "hoursPerWeek",
  "excitedAbout",
  "funFact",
];

export function Level5Story() {
  const { state, set } = useQuest();
  const d = state.draft;
  const house = d.domain ? domains[d.domain] : domains.technical;
  const [focus, setFocus] = useState<"experience" | "whyJoin" | null>(null);
  const [touched, setTouched] = useState<Partial<Record<Key, boolean>>>({});
  const [showAll, setShowAll] = useState(false);

  const check = (links = d.links) =>
    storySchema.safeParse({
      ...d,
      links: filledLinks(links),
      teamRole: d.teamRole ?? undefined,
      hoursPerWeek: d.hoursPerWeek ?? undefined,
    });
  const result = check();
  const errors = result.success ? {} : fieldErrors(result.error);
  const err = (k: Key) => (showAll || touched[k] ? errors[k] : undefined);
  const blur = (k: Key) => () => setTouched((t) => ({ ...t, [k]: true }));

  function onNext() {
    // Tidy links typed without leaving the field ("github.com/x", "@handle") and drop empty rows
    const links = filledLinks(d.links).map((l) => {
      const url = normalizeLink(l.kind, l.url);
      return { kind: detectLinkKind(url) ?? l.kind, url };
    });
    set({ links });
    const r = check(links);
    if (r.success) return true;
    setShowAll(true);
    const errs = fieldErrors(r.error);
    const first = ORDER.find((k) => errs[k]);
    if (first === "links") {
      const bad = links.findIndex((l) => linkRowError(l));
      document.getElementById(linkInputId(Math.max(0, bad)))?.focus();
    } else if (first) document.getElementById(`f-${first}`)?.focus();
    return false;
  }

  return (
    <LevelShell chatId="l5" chat={[...say("ahmed", level5.npc), ...say("sumaiya", level5.npcSumaiya)]} onNext={onNext}>
      <StoryBox
        id="experience"
        label={level5.experience.label}
        helper={level5.experience.helper}
        value={d.experience}
        error={err("experience")}
        focused={focus === "experience"}
        hintOffset={0}
        onChange={(v) => set({ experience: v })}
        onFocus={() => setFocus("experience")}
        onBlur={() => {
          setFocus(null);
          blur("experience")();
        }}
      />

      <Field
        id="f-achievements"
        label={level5.achievements.label}
        optional
        error={err("achievements")}
        help={level5.achievements.helper}
      >
        <textarea
          id="f-achievements"
          className="field-input min-h-[96px] resize-y"
          rows={3}
          maxLength={1500}
          placeholder={level5.achievements.placeholder}
          value={d.achievements}
          onChange={(e) => set({ achievements: e.target.value })}
          onBlur={blur("achievements")}
          aria-invalid={Boolean(err("achievements"))}
          aria-describedby={describedBy("f-achievements", err("achievements"), true)}
        />
      </Field>

      <StoryBox
        id="whyJoin"
        label={level5.whyJoin.label}
        helper={level5.whyJoin.helper}
        value={d.whyJoin}
        error={err("whyJoin")}
        focused={focus === "whyJoin"}
        hintOffset={2}
        onChange={(v) => set({ whyJoin: v })}
        onFocus={() => setFocus("whyJoin")}
        onBlur={() => {
          setFocus(null);
          blur("whyJoin")();
        }}
      />

      <LinksEditor
        links={d.links}
        house={house}
        showErrors={showAll}
        touched={Boolean(touched.links)}
        onChange={(links) => set({ links })}
        onBlur={blur("links")}
      />

      <ChipRadio
        label={level5.teamRoleLabel}
        labelId="f-teamRole"
        options={TEAM_ROLES.map((r) => ({ value: r, label: r }))}
        value={d.teamRole}
        onChange={(v) => {
          if (v !== d.teamRole) toast(`${roleAccessory[v]} equipped`, 10);
          set({ teamRole: v });
        }}
        color={house.solid}
        error={showAll ? errors.teamRole : undefined}
      />

      <ChipRadio
        label={level5.hoursLabel}
        labelId="f-hoursPerWeek"
        options={HOURS.map((h) => ({ value: h, label: hoursLabels[h] }))}
        value={d.hoursPerWeek}
        onChange={(v) => set({ hoursPerWeek: v })}
        color={house.solid}
        error={showAll ? errors.hoursPerWeek : undefined}
      />

      <ChipMulti
        label={level5.excitedLabel}
        labelId="f-excitedAbout"
        options={EXCITED}
        values={d.excitedAbout}
        onChange={(v) => set({ excitedAbout: v })}
        color={house.solid}
        error={showAll ? errors.excitedAbout : undefined}
      />

      <Field
        id="f-funFact"
        label={level5.funFactLabel}
        error={err("funFact")}
        help={`${d.funFact.length}/120`}
      >
        <input
          id="f-funFact"
          className="field-input"
          maxLength={120}
          placeholder={level5.funFactPlaceholder}
          value={d.funFact}
          onChange={(e) => set({ funFact: e.target.value })}
          onBlur={blur("funFact")}
          aria-invalid={Boolean(err("funFact"))}
          aria-describedby={describedBy("f-funFact", err("funFact"), true)}
        />
      </Field>
    </LevelShell>
  );
}

function StoryBox({
  id,
  label,
  helper,
  value,
  error,
  focused,
  hintOffset,
  onChange,
  onFocus,
  onBlur,
}: {
  id: "experience" | "whyJoin";
  label: string;
  helper: string;
  value: string;
  error?: string;
  focused: boolean;
  hintOffset: number;
  onChange: (v: string) => void;
  onFocus: () => void;
  onBlur: () => void;
}) {
  const instant = useInstant();
  const words = countWords(value);
  // While focused, a new hint every ~12 words; otherwise this box's starter hint
  const step = focused ? Math.floor(words / 12) : 0;
  const hint = level5.hints[(step + hintOffset) % level5.hints.length];
  const fid = `f-${id}`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={fid} className="text-[15px] leading-snug font-semibold">
        {label}
      </label>
      <p id={`${fid}-helper`} className="text-sm text-muted">
        {helper}
      </p>

      {/* Always rendered so focusing doesn't shift the layout; brightens while typing */}
      <m.div
        key={hint}
        initial={instant ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-2"
        role={focused ? "status" : undefined}
      >
          <HostPhoto id="ahmed" size={28} />
          <p
            className={`rounded-2xl rounded-tl-md bg-surface-2 px-3 py-2 text-sm leading-snug ring-2 transition-shadow ${
              focused ? "ring-g-blue/60" : "ring-transparent"
            }`}
          >
            <span className="sr-only">Hint from Ahmed: </span>
            {hint}
          </p>
      </m.div>

      <textarea
        id={fid}
        className="field-input min-h-[140px] resize-y"
        value={value}
        rows={5}
        maxLength={2500}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        aria-describedby={[`${fid}-helper`, `${fid}-meter`, error ? `${fid}-error` : ""].filter(Boolean).join(" ")}
      />
      <PowerMeter id={`${fid}-meter`} text={value} />
      {error && (
        <p id={`${fid}-error`} role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
