import { domains } from "@/content";
import type { Row } from "./types";

/** Quote every cell and neutralise spreadsheet formulas (=, +, -, @). */
function cell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

const COLUMNS: Array<[string, (r: Row) => unknown]> = [
  ["Roll no", (r) => r.rollNo],
  ["Name", (r) => r.fullName],
  ["Email", (r) => r.email],
  ["WhatsApp", (r) => r.phone],
  ["Semester", (r) => r.semester],
  ["Department", (r) => r.department],
  ["Domain", (r) => domains[r.domain]?.label ?? r.domain],
  ["Skills", (r) => r.skillTags?.join(", ")],
  ["Status", (r) => r.status],
  ["Avg rating", (r) => (r.avgRating === null ? "" : r.avgRating.toFixed(2))],
  ["Reviews", (r) => r.reviews.length],
  ["Team role", (r) => r.teamRole],
  ["Hours/week", (r) => r.hoursPerWeek],
  ["Excited about", (r) => r.excitedAbout?.join(", ")],
  ["Portfolio", (r) => r.portfolioUrl],
  ["Quiz", (r) => r.quizScore],
  ["Time taken (sec)", (r) => r.timeTakenSec],
  ["Applied at", (r) => r.createdAt?.toDate().toISOString() ?? ""],
  ["Experience", (r) => r.experience],
  ["Why join", (r) => r.whyJoin],
  ["Fun fact", (r) => r.funFact],
];

export function toCsv(rows: Row[]): string {
  const header = COLUMNS.map(([h]) => cell(h)).join(",");
  const body = rows.map((r) => COLUMNS.map(([, get]) => cell(get(r))).join(","));
  // BOM so Excel opens UTF-8 (Urdu names, emojis) correctly
  return "﻿" + [header, ...body].join("\r\n");
}

export function downloadCsv(rows: Row[], name: string) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
