"use client";

import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

type Option<T extends string | number> = { value: T; label: string };

const chipBase =
  "min-h-11 rounded-full border-2 px-4 text-[15px] font-semibold transition-[transform,background-color,border-color] select-none active:scale-95 hover:-translate-y-px";

/** Single choice. Arrow keys move between options like a native radio group. */
export function ChipRadio<T extends string | number>({
  label,
  labelId,
  options,
  value,
  onChange,
  color = "#1967D2",
  error,
}: {
  label: string;
  labelId: string;
  options: readonly Option<T>[];
  value: T | null;
  onChange: (v: T) => void;
  color?: string;
  error?: string;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = options.findIndex((o) => o.value === value);

  function onKey(e: KeyboardEvent, i: number) {
    const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const nextIndex = (i + dir + options.length) % options.length;
    onChange(options[nextIndex].value);
    refs.current[nextIndex]?.focus();
  }

  return (
    <div className="flex flex-col gap-2">
      <span id={labelId} className="text-[15px] leading-snug font-semibold">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={error ? `${labelId}-error` : undefined}
        className="flex flex-wrap gap-2"
      >
        {options.map((o, i) => {
          const checked = o.value === value;
          return (
            <button
              key={String(o.value)}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked || (selectedIndex === -1 && i === 0) ? 0 : -1}
              onClick={() => onChange(o.value)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(chipBase, checked ? "text-white" : "border-line bg-surface text-ink")}
              style={checked ? { background: color, borderColor: color, color: pickText(color) } : undefined}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {error && (
        <p id={`${labelId}-error`} role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Multi choice, each chip is a toggle button. */
export function ChipMulti<T extends string>({
  label,
  labelId,
  options,
  values,
  onChange,
  color = "#1967D2",
  error,
}: {
  label: string;
  labelId: string;
  options: readonly T[];
  values: readonly T[];
  onChange: (v: T[]) => void;
  color?: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span id={labelId} className="text-[15px] leading-snug font-semibold">
        {label}
      </span>
      <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = values.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? values.filter((v) => v !== o) : [...values, o])}
              className={cn(chipBase, !on && "border-line bg-surface text-ink")}
              style={on ? { background: color, borderColor: color, color: pickText(color) } : undefined}
            >
              {on && <span aria-hidden="true">✓ </span>}
              {o}
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
  );
}

/** Dark text on yellow, white on everything else */
export function pickText(bg: string): string {
  return bg.toUpperCase() === "#FBBC04" ? "#202124" : "#FFFFFF";
}
