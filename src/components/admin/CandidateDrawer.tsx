"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { domains, positionLabel, hoursLabels, type Hours } from "@/content";
import type { Status } from "@/lib/schema";
import { adminFetch, ApiError, ERROR_TEXT } from "./api";
import { Button } from "@/components/ui/Button";
import { statusStyle } from "./status";
import type { Row } from "./types";

export function CandidateDrawer({
  row,
  user,
  onClose,
  onChanged,
}: {
  row: Row;
  user: User;
  onClose: () => void;
  /** Reload data after a change */
  onChanged: () => void;
}) {
  const mine = row.reviews.find((r) => r.reviewerUid === user.uid);
  const others = row.reviews.filter((r) => r.reviewerUid !== user.uid);
  const [rating, setRating] = useState<number>(mine?.rating ?? 0);
  const [notes, setNotes] = useState(mine?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>();
  const [statusBusy, setStatusBusy] = useState<Status | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const house = domains[row.domain];

  useEffect(() => {
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const positions = domains[row.domain]?.positions ?? [];
  const [assignTo, setAssignTo] = useState<string>(row.assignedPosition ?? row.position ?? positions[0]?.id ?? "");

  async function setStatus(status: Status) {
    setStatusBusy(status);
    setMsg(undefined);
    try {
      // Only selected people carry an assigned position
      await adminFetch(user, "/api/admin/status", {
        method: "POST",
        body: JSON.stringify({ rollNo: row.id, status, assignedPosition: status === "selected" ? assignTo : null }),
      });
      onChanged();
    } catch (e) {
      const code = e instanceof ApiError ? e.code : "network";
      setMsg(`Couldn't update status: ${ERROR_TEXT[code] ?? code}`);
    } finally {
      setStatusBusy(null);
    }
  }

  async function saveReview() {
    if (rating < 1) return setMsg("Pick a rating from 1 to 5");
    setSaving(true);
    setMsg(undefined);
    try {
      await adminFetch(user, "/api/admin/review", {
        method: "POST",
        body: JSON.stringify({ rollNo: row.id, rating, notes }),
      });
      setMsg("Saved ✓");
      onChanged();
    } catch (e) {
      const code = e instanceof ApiError ? e.code : "network";
      setMsg(`Couldn't save: ${ERROR_TEXT[code] ?? code}`);
    } finally {
      setSaving(false);
    }
  }

  const portfolioSafe = /^https?:\/\//i.test(row.portfolioUrl ?? "");

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-line bg-bg outline-none"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-bg px-5 py-4">
          <div className="min-w-0">
            <h2 id="drawer-title" className="truncate text-xl font-bold">
              {row.fullName}
            </h2>
            <p className="text-sm text-muted">
              {row.rollNo} · Sem {row.semester} · {row.department}
            </p>
            <span
              className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold"
              style={{ background: house?.solid, color: house?.onColor }}
            >
              {house?.label ?? row.domain}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-lg"
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-6 px-5 py-5">
          {/* Status */}
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-bold tracking-wide text-muted uppercase">Status</h3>
            <p>
              Current:{" "}
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[row.status]?.className}`}>
                {statusStyle[row.status]?.label ?? row.status}
                {row.status === "selected" && row.assignedPosition
                  ? ` as ${positionLabel(row.domain, row.assignedPosition)}`
                  : ""}
              </span>
            </p>
            <p className="text-[15px]">
              Applied for: <strong>{positionLabel(row.domain, row.position) || "Not specified"}</strong>
            </p>
            <label className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              Select as
              <select
                className="field-input min-h-10 w-auto py-2 font-normal"
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
              >
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                    {p.id === row.position ? " (applied)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              {(["shortlisted", "rejected", "selected", "submitted"] as const).map((s) => (
                <Button
                  key={s}
                  variant={row.status === s ? "primary" : "secondary"}
                  className="min-h-10 px-4 text-sm"
                  disabled={
                    statusBusy !== null ||
                    (row.status === s && (s !== "selected" || (row.assignedPosition ?? "") === assignTo))
                  }
                  onClick={() => setStatus(s)}
                >
                  {s === "shortlisted" ? "Shortlist" : s === "rejected" ? "Reject" : s === "selected" ? "Select" : "Reset"}
                </Button>
              ))}
            </div>
          </section>

          {/* Contact */}
          <section className="grid grid-cols-1 gap-2 text-[15px] sm:grid-cols-2">
            <Info label="Email">
              <a className="break-all text-link underline" href={`mailto:${row.email}`}>
                {row.email}
              </a>
            </Info>
            <Info label="WhatsApp">
              <a
                className="text-link underline"
                href={`https://wa.me/92${row.phone.slice(1)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {row.phone}
              </a>
            </Info>
            <Info label="Portfolio">
              {row.portfolioUrl ? (
                portfolioSafe ? (
                  <a className="break-all text-link underline" href={row.portfolioUrl} target="_blank" rel="noopener noreferrer nofollow">
                    {row.portfolioUrl}
                  </a>
                ) : (
                  <span className="break-all">{row.portfolioUrl}</span>
                )
              ) : (
                <span className="text-muted">Not added</span>
              )}
            </Info>
            <Info label="Skills">{row.skillTags?.length ? row.skillTags.join(", ") : <span className="text-muted">None</span>}</Info>
          </section>

          <LongAnswer label="Past experience" text={row.experience} />
          {row.achievements && <LongAnswer label="Achievements" text={row.achievements} />}
          <LongAnswer label="Why GDGOC AU" text={row.whyJoin} />

          <section className="grid grid-cols-2 gap-2 text-[15px]">
            <Info label="Team role">{row.teamRole}</Info>
            <Info label="Hours / week">{hoursLabels[row.hoursPerWeek as Hours] ?? row.hoursPerWeek}</Info>
            <Info label="Excited about">{row.excitedAbout?.join(", ")}</Info>
            <Info label="Boss check">{row.quizScore}/2</Info>
            <Info label="Time taken">{formatDuration(row.timeTakenSec)}</Info>
            <Info label="Applied">{row.createdAt ? new Date(row.createdAt).toLocaleString("en-PK") : "…"}</Info>
            {row.funFact && (
              <div className="col-span-2">
                <Info label="Fun fact">{row.funFact}</Info>
              </div>
            )}
          </section>

          {/* My review */}
          <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
            <h3 className="font-bold">Your review</h3>
            <div role="radiogroup" aria-label="Rating" className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} out of 5`}
                  onClick={() => setRating(n)}
                  className={`grid h-11 w-11 place-items-center rounded-xl border-[1.5px] text-lg ${
                    n <= rating ? "border-g-yellow bg-g-yellow/15 text-eyebrow" : "border-line text-muted"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Notes (only reviewers in this house + core see these)
              <textarea
                className="field-input min-h-[100px] font-normal"
                maxLength={2000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <div className="flex items-center gap-3">
              <Button onClick={saveReview} disabled={saving}>
                {saving ? "Saving…" : mine ? "Update review" : "Save review"}
              </Button>
              {msg && (
                <span role="status" className="text-sm text-muted">
                  {msg}
                </span>
              )}
            </div>
          </section>

          {/* Others */}
          <section className="flex flex-col gap-2">
            <h3 className="font-bold">
              Other reviewers{" "}
              <span className="text-muted">
                ({others.length}
                {row.avgRating !== null && ` · avg ★ ${row.avgRating.toFixed(1)}`})
              </span>
            </h3>
            {others.length === 0 && <p className="text-sm text-muted">No other reviews yet.</p>}
            {others.map((r) => (
              <div key={r.reviewerUid} className="rounded-xl border border-line p-3 text-sm">
                <p className="font-semibold">
                  ★ {r.rating} · {r.reviewerName || r.reviewerEmail || "Reviewer"}
                </p>
                {r.notes && <p className="mt-1 whitespace-pre-wrap text-muted">{r.notes}</p>}
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <span>{children}</span>
    </div>
  );
}

function LongAnswer({ label, text }: { label: string; text: string }) {
  const words = text?.trim() ? text.trim().split(/\s+/).length : 0;
  return (
    <section className="flex flex-col gap-1">
      <h3 className="text-sm font-bold tracking-wide text-muted uppercase">
        {label} <span className="font-normal normal-case">({words} words)</span>
      </h3>
      <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{text}</p>
    </section>
  );
}

function formatDuration(sec: number) {
  if (!Number.isFinite(sec)) return "-";
  const m = Math.floor(sec / 60);
  return `${m}m ${sec % 60}s`;
}

