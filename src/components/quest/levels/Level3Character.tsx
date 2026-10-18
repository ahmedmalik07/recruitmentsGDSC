"use client";

import { useEffect, useRef, useState } from "react";
import { departmentSuggestions, level3, site } from "@/content";
import { characterSchema, characterShape, fieldErrors, normalizePhone } from "@/lib/schema";
import { describedBy, Field } from "@/components/ui/Field";
import { ChipRadio } from "@/components/ui/Chips";
import { Avatar, avatarParts } from "../Avatar";
import { LevelShell } from "../LevelShell";
import { say } from "../NpcChat";
import { toast } from "../toast";
import { useInstant, useQuest } from "../state";

type Key = keyof typeof characterShape;
const KEYS: Key[] = ["fullName", "email", "rollNo", "phone", "semester", "department"];

export function Level3Character() {
  const { state, set, dispatch } = useQuest();
  const instant = useInstant();
  const d = state.draft;
  const [touched, setTouched] = useState<Partial<Record<Key, boolean>>>({});
  const [showAll, setShowAll] = useState(false);

  const result = characterSchema.safeParse(d);
  const errors = result.success ? {} : fieldErrors(result.error);
  const err = (k: Key) => (showAll || touched[k] ? errors[k] : undefined);

  // Unlock toasts when a field becomes valid
  const prevValid = useRef<Set<Key> | null>(null);
  useEffect(() => {
    const valid = new Set(KEYS.filter((k) => !errors[k]));
    if (prevValid.current) {
      for (const k of valid) {
        if (!prevValid.current.has(k)) toast(level3.unlocks[k], 10);
      }
    }
    prevValid.current = valid;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [KEYS.map((k) => !errors[k]).join()]);

  function onNext() {
    if (result.success) return true;
    setShowAll(true);
    const first = KEYS.find((k) => errors[k]);
    if (first) document.getElementById(`f-${first}`)?.focus();
    return false;
  }

  const blur = (k: Key) => () => setTouched((t) => ({ ...t, [k]: true }));

  return (
    <LevelShell chatId="l3" chat={[...say("rafay", level3.npc), ...say("ahmed", level3.npcAhmed)]} onNext={onNext}>
      {/* Compact so the first field is on screen; the character also stays in the top bar while typing */}
      <div className="flex items-center gap-3 rounded-3xl border border-line bg-surface p-3 lg:hidden">
        <div className={`shrink-0 ${instant ? "" : "avatar-bob"}`}>
          <Avatar parts={avatarParts(d)} size={96} showName={false} animated={!instant} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 text-xs font-bold tracking-wide text-eyebrow uppercase">{level3.parts.title}</p>
          <ul className="grid grid-cols-2 gap-x-2 gap-y-1 text-[13px] leading-tight">
            {KEYS.map((k) => {
              const done = !errors[k];
              return (
                <li key={k} className={`flex items-center gap-1.5 ${done ? "font-semibold text-ink" : "text-muted"}`}>
                  <span
                    aria-hidden="true"
                    className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-[10px] ${done ? "bg-g-green-strong text-white" : "border border-line"}`}
                  >
                    {done ? "✓" : ""}
                  </span>
                  {level3.parts[k]}
                  <span className="sr-only">{done ? " unlocked" : " locked"}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Honeypot: hidden from humans and assistive tech */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={state.website}
          onChange={(e) => dispatch({ type: "honeypot", value: e.target.value })}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2 md:items-start md:gap-4">
      <Field id="f-fullName" label={level3.labels.fullName} error={err("fullName")}>
        <input
          id="f-fullName"
          className="field-input"
          autoComplete="name"
          autoCapitalize="words"
          maxLength={60}
          placeholder={level3.placeholders.fullName}
          value={d.fullName}
          onChange={(e) => set({ fullName: e.target.value })}
          onBlur={blur("fullName")}
          aria-invalid={Boolean(err("fullName"))}
          aria-describedby={describedBy("f-fullName", err("fullName"))}
        />
      </Field>

      <Field id="f-email" label={level3.labels.email} error={err("email")}>
        <input
          id="f-email"
          className="field-input"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={120}
          placeholder={level3.placeholders.email}
          value={d.email}
          onChange={(e) => set({ email: e.target.value })}
          onBlur={blur("email")}
          aria-invalid={Boolean(err("email"))}
          aria-describedby={describedBy("f-email", err("email"))}
        />
      </Field>
      </div>

      <div className="grid gap-5 md:grid-cols-2 md:items-start md:gap-4">
      <Field id="f-rollNo" label={level3.labels.rollNo} error={err("rollNo")} help={site.rollNoHint}>
          <input
            id="f-rollNo"
            className="field-input"
            inputMode="numeric"
            autoComplete="off"
            maxLength={20}
            placeholder={level3.placeholders.rollNo}
            value={d.rollNo}
            onChange={(e) => set({ rollNo: e.target.value.replace(/\s/g, "") })}
            onBlur={blur("rollNo")}
            aria-invalid={Boolean(err("rollNo"))}
            aria-describedby={describedBy("f-rollNo", err("rollNo"), true)}
          />
        </Field>
      <Field id="f-phone" label={level3.labels.phone} error={err("phone")} help={level3.help.phone}>
          <input
            id="f-phone"
            className="field-input"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder={level3.placeholders.phone}
            value={d.phone}
            onChange={(e) => set({ phone: normalizePhone(e.target.value) })}
            onBlur={blur("phone")}
            aria-invalid={Boolean(err("phone"))}
            aria-describedby={describedBy("f-phone", err("phone"), true)}
          />
        </Field>
      </div>

      <ChipRadio
        label={level3.labels.semester}
        labelId="f-semester"
        options={[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ value: n, label: String(n) }))}
        value={d.semester}
        onChange={(v) => set({ semester: v })}
        error={showAll ? errors.semester : undefined}
      />

      <Field id="f-department" label={level3.labels.department} error={err("department")}>
        <input
          id="f-department"
          className="field-input"
          list="department-suggestions"
          autoComplete="off"
          autoCapitalize="words"
          maxLength={80}
          placeholder={level3.placeholders.department}
          value={d.department}
          onChange={(e) => set({ department: e.target.value })}
          onBlur={(e) => {
            set({ department: e.target.value.trim().replace(/\s+/g, " ") });
            blur("department")();
          }}
          aria-invalid={Boolean(err("department"))}
          aria-describedby={describedBy("f-department", err("department"))}
        />
        <datalist id="department-suggestions">
          {departmentSuggestions.map((dep) => (
            <option key={dep} value={dep} />
          ))}
        </datalist>
      </Field>
      <DepartmentChips value={d.department} onPick={(v) => set({ department: v })} />
    </LevelShell>
  );
}

/** Tappable suggestions under the department field (free text still allowed) */
function DepartmentChips({ value, onPick }: { value: string; onPick: (v: string) => void }) {
  const q = value.trim().toLowerCase();
  const exact = departmentSuggestions.some((dep) => dep.toLowerCase() === q);
  const list = departmentSuggestions.filter((dep) => !q || dep.toLowerCase().includes(q)).slice(0, 8);
  if (exact || list.length === 0) return null;
  return (
    <div className="-mt-3 flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-muted">{level3.departmentHint}</span>
      <div className="flex flex-wrap gap-1.5">
        {list.map((dep) => (
          <button
            key={dep}
            type="button"
            onClick={() => onPick(dep)}
            className="min-h-9 rounded-full border-2 border-line bg-surface px-3 text-[13px] font-semibold hover:border-g-blue hover:bg-tint-blue active:scale-95"
          >
            {dep}
          </button>
        ))}
      </div>
    </div>
  );
}
