"use client";

import { useMemo, useState } from "react";
import { DOMAIN_IDS, domains } from "@/content";
import type { Row } from "./types";

const DAYS = 21;
const BAR = "#4285F4";

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function Stats({ rows }: { rows: Row[] }) {
  const s = useMemo(() => {
    const perDomain = Object.fromEntries(DOMAIN_IDS.map((d) => [d, 0])) as Record<string, number>;
    const perSemester = Array.from({ length: 8 }, () => 0);
    const perDay = new Map<string, number>();
    let shortlisted = 0;
    let selected = 0;
    let reviewed = 0;
    for (const r of rows) {
      perDomain[r.domain] = (perDomain[r.domain] ?? 0) + 1;
      if (r.semester >= 1 && r.semester <= 8) perSemester[r.semester - 1]++;
      const d = r.createdAt?.toDate();
      if (d) perDay.set(dayKey(d), (perDay.get(dayKey(d)) ?? 0) + 1);
      if (r.status === "shortlisted") shortlisted++;
      if (r.status === "selected") selected++;
      if (r.reviews.length) reviewed++;
    }
    const days: Array<{ key: string; date: Date; count: number }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = DAYS - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push({ key: dayKey(date), date, count: perDay.get(dayKey(date)) ?? 0 });
    }
    return { perDomain, perSemester, days, shortlisted, selected, reviewed, today: perDay.get(dayKey(today)) ?? 0 };
  }, [rows]);

  return (
    <section aria-label="Stats" className="mt-6 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Total applications" value={rows.length} />
        <Tile label="Today" value={s.today} />
        <Tile label="Reviewed" value={`${s.reviewed}/${rows.length}`} />
        <Tile label="Shortlisted · Selected" value={`${s.shortlisted} · ${s.selected}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="By house">
          <BarList
            items={DOMAIN_IDS.map((d) => ({ label: domains[d].label, value: s.perDomain[d] ?? 0, color: domains[d].color }))}
          />
        </Card>
        <Card title="By semester">
          <BarList items={s.perSemester.map((v, i) => ({ label: `Semester ${i + 1}`, value: v, color: BAR }))} compact />
        </Card>
        <Card title={`Daily submissions · last ${DAYS} days`}>
          <DailyChart days={s.days} />
        </Card>
      </div>
    </section>
  );
}

function Tile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <figure className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
      <figcaption className="text-sm font-semibold">{title}</figcaption>
      {children}
    </figure>
  );
}

/** Horizontal bars. Every bar is labelled with its name and count, so color is never the only cue. */
function BarList({
  items,
  compact,
}: {
  items: Array<{ label: string; value: number; color: string }>;
  compact?: boolean;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="flex flex-col gap-2">
      {items.map((i) => (
        <li key={i.label} className="flex flex-col gap-1" title={`${i.label}: ${i.value}`}>
          <div className="flex justify-between text-sm">
            <span className="text-muted">{i.label}</span>
            <span className="font-semibold tabular-nums">{i.value}</span>
          </div>
          <div className={`${compact ? "h-1.5" : "h-2.5"} rounded-full bg-surface-2`}>
            <div
              className="h-full rounded-full"
              style={{ width: `${(i.value / max) * 100}%`, minWidth: i.value ? 4 : 0, background: i.color }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function DailyChart({ days }: { days: Array<{ key: string; date: Date; count: number }> }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 320;
  const H = 140;
  const pad = { top: 8, bottom: 22, left: 4, right: 4 };
  const max = Math.max(1, ...days.map((d) => d.count));
  const slot = (W - pad.left - pad.right) / days.length;
  const barW = Math.max(2, slot - 2); // 2px gap between bars
  const plotH = H - pad.top - pad.bottom;
  const fmt = (d: Date) => d.toLocaleDateString("en-PK", { day: "numeric", month: "short" });
  const active = hover !== null ? days[hover] : null;
  const total = days.reduce((s, d) => s + d.count, 0);

  return (
    <div className="flex flex-col gap-2">
      <p className="h-5 text-sm" aria-live="polite">
        {active ? (
          <>
            <span className="font-semibold">{active.count}</span>{" "}
            <span className="text-muted">on {fmt(active.date)}</span>
          </>
        ) : (
          <span className="text-muted">
            {total} in {days.length} days · peak {max}
          </span>
        )}
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Daily submissions for the last ${days.length} days, peak ${max} per day`}
        onMouseLeave={() => setHover(null)}
      >
        <line x1={pad.left} x2={W - pad.right} y1={H - pad.bottom} y2={H - pad.bottom} stroke="#E2DCCB" strokeWidth="1" />
        {days.map((d, i) => {
          const h = d.count ? Math.max(4, (d.count / max) * plotH) : 0;
          const x = pad.left + i * slot + 1;
          const y = H - pad.bottom - h;
          const r = Math.min(4, barW / 2, h);
          return (
            <g key={d.key} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0}>
              {/* Hit target taller and wider than the bar */}
              <rect x={pad.left + i * slot} y={pad.top} width={slot} height={plotH} fill="transparent" />
              {h > 0 && (
                <path
                  d={`M${x},${H - pad.bottom} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${H - pad.bottom} Z`}
                  fill={BAR}
                  opacity={hover === null || hover === i ? 1 : 0.45}
                />
              )}
              <title>{`${fmt(d.date)}: ${d.count}`}</title>
            </g>
          );
        })}
        {[0, Math.floor(days.length / 2), days.length - 1].map((i) => (
          <text
            key={i}
            x={pad.left + i * slot + slot / 2}
            y={H - 6}
            textAnchor={i === 0 ? "start" : i === days.length - 1 ? "end" : "middle"}
            fontSize="10"
            fill="#56608A"
          >
            {fmt(days[i].date)}
          </text>
        ))}
      </svg>
      <details className="text-sm">
        <summary className="cursor-pointer text-muted">Show as table</summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-muted">
            <tr>
              <th scope="col" className="py-1 font-semibold">Day</th>
              <th scope="col" className="py-1 text-right font-semibold">Applications</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.key} className="border-t border-line">
                <td className="py-1">{fmt(d.date)}</td>
                <td className="py-1 text-right tabular-nums">{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
