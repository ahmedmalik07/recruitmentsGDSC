"use client";

import { level6, quiz } from "@/content";
import { cn } from "@/lib/cn";
import { LevelShell } from "../LevelShell";
import { say } from "../NpcChat";
import { toast } from "../toast";
import { useQuest } from "../state";

export function Level6Boss() {
  const { state, dispatch } = useQuest();
  const answeredAll = state.quizAnswers.every((a) => a !== null);

  return (
    <LevelShell
      chatId="l6"
      chat={say("rafay", level6.npc)}
      canNext={answeredAll}
      nextHint="Answer both to continue"
    >
      {quiz.map((q, qi) => {
        const picked = state.quizAnswers[qi];
        const done = picked !== null;
        const right = picked === q.answer;
        return (
          <fieldset key={qi} className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
            <legend className="sr-only">Question {qi + 1}</legend>
            <p className="text-xs font-bold tracking-wide text-g-yellow uppercase">Boss question {qi + 1}/{quiz.length}</p>
            <p className="text-lg leading-snug font-bold">{q.question}</p>
            <div className="flex flex-col gap-2">
              {q.options.map((opt, oi) => {
                const isAnswer = oi === q.answer;
                const isPicked = oi === picked;
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={done}
                    aria-pressed={isPicked}
                    onClick={() => {
                      dispatch({ type: "answer", index: qi, option: oi });
                      if (oi === q.answer) toast("Boss hit!", 20);
                    }}
                    className={cn(
                      "min-h-12 rounded-2xl border-[1.5px] px-4 text-left text-[15px] font-medium transition-colors disabled:cursor-default",
                      !done && "border-line bg-surface-2 hover:border-g-blue",
                      done && isAnswer && "border-g-green bg-g-green/15",
                      done && isPicked && !isAnswer && "border-g-red bg-g-red/15",
                      done && !isAnswer && !isPicked && "border-line bg-surface-2 opacity-60",
                    )}
                  >
                    {done && isAnswer && <span aria-hidden="true">✓ </span>}
                    {done && isPicked && !isAnswer && <span aria-hidden="true">✗ </span>}
                    {opt}
                  </button>
                );
              })}
            </div>
            <div aria-live="polite">
              {done && (
                <p className="text-[15px] font-semibold">
                  {right ? (
                    level6.correct[qi % level6.correct.length]
                  ) : (
                    <>
                      {level6.wrong[qi % level6.wrong.length]}{" "}
                      <span className="font-normal text-muted">
                        {level6.answerWas} <span className="font-semibold text-ink">{q.options[q.answer]}</span>
                      </span>
                    </>
                  )}
                </p>
              )}
            </div>
          </fieldset>
        );
      })}
    </LevelShell>
  );
}
