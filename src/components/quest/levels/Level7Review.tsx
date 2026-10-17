"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { m } from "framer-motion";
import { domains, errors as errorCopy, hoursLabels, level3, level5, level7, site, success } from "@/content";
import { fieldErrors, submitSchema, type ApplyResponse } from "@/lib/schema";
import { Button } from "@/components/ui/Button";
import { ApplicantCard } from "../ApplicantCard";
import { FollowLinks } from "../FollowLinks";
import { Avatar, avatarParts, type AvatarParts } from "../Avatar";
import { LevelShell } from "../LevelShell";
import { NpcChat, type Line } from "../NpcChat";
import { Turnstile, type TurnstileHandle } from "../Turnstile";
import { useInstant, useQuest } from "../state";

const FIELD_LEVEL: Record<string, number> = {
  fullName: 3,
  email: 3,
  rollNo: 3,
  phone: 3,
  semester: 3,
  department: 3,
  domain: 4,
  skillTags: 4,
  experience: 5,
  whyJoin: 5,
  portfolioUrl: 5,
  teamRole: 5,
  hoursPerWeek: 5,
  excitedAbout: 5,
  funFact: 5,
};

const FIELD_LABEL: Record<string, string> = {
  ...level3.labels,
  domain: "House",
  skillTags: "Skills",
  experience: "Experience",
  whyJoin: "Why GDGOC AU",
  portfolioUrl: "Portfolio link",
  teamRole: "Team role",
  hoursPerWeek: "Hours per week",
  excitedAbout: "Excited about",
  funFact: "Fun fact",
};

type Problem = { code: string; message: string; fields?: Record<string, string> };

export function Level7Review() {
  const { state, dispatch, quizScore, clearSaved } = useQuest();
  const d = state.draft;
  const [consent, setConsent] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [done, setDone] = useState<AvatarParts | null>(null);
  const turnstile = useRef<TurnstileHandle>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  if (done) return <Success parts={done} />;

  const house = d.domain ? domains[d.domain] : null;
  const edit = (level: number) => dispatch({ type: "editFromReview", level });

  function showProblem(p: Problem) {
    setProblem(p);
    requestAnimationFrame(() => errorRef.current?.focus());
  }

  async function submit() {
    if (sending) return;
    const payload = {
      ...d,
      semester: d.semester ?? undefined,
      domain: d.domain ?? undefined,
      teamRole: d.teamRole ?? undefined,
      hoursPerWeek: d.hoursPerWeek ?? undefined,
      quizScore,
      website: state.website,
      turnstileToken: token ?? "",
      timeTakenSec: Math.max(0, Math.round((Date.now() - (state.startedAt ?? Date.now())) / 1000)),
    };

    const local = submitSchema.safeParse(payload);
    if (!local.success) {
      const fields = fieldErrors(local.error);
      if (Object.keys(fields).length === 1 && fields.turnstileToken) {
        showProblem({ code: "bot", message: "Complete the bot check first." });
      } else {
        showProblem({ code: "validation", message: errorCopy.validation, fields });
      }
      return;
    }

    setSending(true);
    setProblem(null);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => null)) as ApplyResponse | null;
      if (res.ok && body?.ok) {
        clearSaved();
        dispatch({ type: "submitted" });
        setDone(avatarParts(d));
        return;
      }
      const code = body && !body.ok ? body.code : "server";
      const message =
        code === "duplicate"
          ? errorCopy.duplicate
          : code === "closed"
            ? errorCopy.closed
            : code === "bot"
              ? errorCopy.bot
              : code === "validation"
                ? errorCopy.validation
                : errorCopy.generic;
      showProblem({ code, message, fields: body && !body.ok ? body.fields : undefined });
      // Turnstile tokens are single use
      turnstile.current?.reset();
    } catch {
      showProblem({ code: "network", message: errorCopy.network });
      turnstile.current?.reset();
    } finally {
      setSending(false);
    }
  }

  const chat: Line[] = [
    { host: "ahmed", text: level7.npc.ahmed },
    { host: "rafay", text: level7.npc.rafay },
    { host: "sumaiya", text: level7.npc.sumaiya },
  ];

  const whatsappUrl = `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(
    `Salam, GDG Quest issue. Roll no: ${d.rollNo}`,
  )}`;

  return (
    <LevelShell chatId="l7" chat={chat} hideNav>
      <article className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-4" aria-label="Character sheet">
        <div className="flex items-center gap-3">
          <Avatar parts={avatarParts(d)} size={96} showName={false} animated={false} />
          <div className="min-w-0">
            <p className="truncate text-xl font-bold">{d.fullName || "?"}</p>
            {house && (
              <span
                className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold"
                style={{ background: house.solid, color: house.onColor }}
              >
                {house.house}
              </span>
            )}
            <p className="mt-1 text-sm text-muted">
              Lvl {d.semester ?? "?"} · {d.department || "?"}
            </p>
          </div>
        </div>

        <Section title={level7.sections.character} onEdit={() => edit(3)}>
          <Row label={level3.labels.fullName} value={d.fullName} />
          <Row label={level3.labels.email} value={d.email.trim().toLowerCase()} />
          <Row label={level3.labels.rollNo} value={d.rollNo} />
          <Row label={level3.labels.phone} value={d.phone} />
          <Row label={level3.labels.semester} value={d.semester ? String(d.semester) : ""} />
          <Row label={level3.labels.department} value={d.department} />
        </Section>

        <Section title={level7.sections.house} onEdit={() => edit(4)}>
          <Row label="House" value={house ? `${house.house} (${house.label})` : ""} />
          <Row label="Skills" value={d.skillTags.join(", ") || "None picked"} />
        </Section>

        <Section title={level7.sections.story} onEdit={() => edit(5)}>
          <Row label="Experience" value={d.experience} long />
          <Row label="Why GDGOC AU" value={d.whyJoin} long />
          <Row label={house?.portfolioLabel ?? "Portfolio"} value={d.portfolioUrl || "Not added"} />
        </Section>

        <Section title={level7.sections.extras} onEdit={() => edit(5)}>
          <Row label="Team role" value={d.teamRole ?? ""} />
          <Row label="Hours / week" value={d.hoursPerWeek ? hoursLabels[d.hoursPerWeek] : ""} />
          <Row label="Excited about" value={d.excitedAbout.join(", ")} />
          <Row label={level5.funFactLabel.replace(" (optional)", "")} value={d.funFact || "Not added"} />
          <Row label="Boss check" value={`${quizScore}/2`} />
        </Section>
      </article>

      <label className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 text-[15px] leading-snug">
        <input
          type="checkbox"
          className="mt-0.5 h-5 w-5 shrink-0 accent-g-blue"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>{level7.consent}</span>
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-muted">{level7.botCheck}</span>
        <Turnstile ref={turnstile} onToken={setToken} />
      </div>

      <div ref={errorRef} tabIndex={-1} aria-live="assertive" className="outline-none">
        {problem && (
          <div className="flex flex-col gap-2 rounded-2xl border border-danger/60 bg-g-red/10 p-4">
            <p className="font-semibold">{problem.message}</p>
            {problem.fields && (
              <ul className="flex flex-col gap-1 text-sm">
                {Object.entries(problem.fields)
                  .filter(([k]) => FIELD_LEVEL[k])
                  .map(([k, msg]) => (
                    <li key={k}>
                      <button
                        type="button"
                        className="text-left underline underline-offset-2"
                        onClick={() => edit(FIELD_LEVEL[k])}
                      >
                        {FIELD_LABEL[k] ?? k}: {msg}
                      </button>
                    </li>
                  ))}
              </ul>
            )}
            {(problem.code === "duplicate" || problem.code === "server") && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-g-green-strong px-4 font-semibold text-white"
              >
                💬 {errorCopy.whatsapp} ({site.whatsapp.display})
              </a>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => dispatch({ type: "back" })} aria-label="Previous level">
          ←
        </Button>
        <Button block onClick={submit} disabled={!consent || sending} className="flex-1 text-lg">
          {sending ? level7.submitting : `🚀 ${level7.submit}`}
        </Button>
      </div>
      {!consent && <p className="-mt-3 text-center text-xs text-muted">Tick the consent box to submit</p>}
    </LevelShell>
  );
}

function Section({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 border-t border-line pt-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-wide text-eyebrow uppercase">{title}</h2>
        <button
          type="button"
          onClick={onEdit}
          className="min-h-9 rounded-full border border-line px-3 text-sm font-semibold"
          aria-label={`${level7.edit} ${title}`}
        >
          ✏️ {level7.edit}
        </button>
      </div>
      <dl className="flex flex-col gap-2">{children}</dl>
    </section>
  );
}

function Row({ label, value, long }: { label: string; value: string; long?: boolean }) {
  return (
    <div className={long ? "flex flex-col gap-0.5" : "flex justify-between gap-3"}>
      <dt className="shrink-0 text-sm text-muted">{label}</dt>
      <dd
        className={
          long
            ? "text-[15px] leading-relaxed break-words whitespace-pre-wrap"
            : "min-w-0 text-right text-[15px] font-medium break-words"
        }
      >
        {value || <span className="text-danger">Missing</span>}
      </dd>
    </div>
  );
}

function Success({ parts }: { parts: AvatarParts }) {
  const instant = useInstant();

  useEffect(() => {
    if (instant) return;
    import("canvas-confetti")
      .then(({ default: confetti }) =>
        confetti({
          particleCount: 120,
          spread: 75,
          origin: { y: 0.3 },
          colors: ["#4285F4", "#EA4335", "#FBBC04", "#34A853"],
          disableForReducedMotion: true,
        }),
      )
      .catch(() => {});
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chat: Line[] = [
    { host: "sumaiya", text: success.npc.sumaiya },
    { host: "ahmed", text: success.npc.ahmed },
    { host: "rafay", text: success.npc.rafay },
  ];

  return (
    <section className="flex flex-col gap-6 pt-4 pb-12" aria-labelledby="success-title">
      <m.h1
        id="success-title"
        className="text-3xl font-extrabold"
        initial={instant ? false : { scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {success.title}
      </m.h1>
      <NpcChat id="success" lines={chat} />
      <div className="grid gap-6 md:grid-cols-2 md:items-start">
      <ApplicantCard parts={parts} />

      <div className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
        <h2 className="text-lg font-bold">{success.nextTitle}</h2>
        <ol className="flex flex-col gap-2">
          {success.next.map((step, i) => (
            <li key={i} className="flex gap-3 text-[15px]">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-g-blue-strong text-xs font-bold text-white">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <p className="rounded-2xl bg-surface-2 p-3 text-[15px]">
          📅 <strong>{success.shortlistLabel}:</strong> {site.shortlistNote}
        </p>
        <FollowLinks />
      </div>
      </div>
    </section>
  );
}
