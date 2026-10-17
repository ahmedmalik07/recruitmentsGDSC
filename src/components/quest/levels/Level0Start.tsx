"use client";

import Image from "next/image";
import { m } from "framer-motion";
import { hosts, levelNames, site, titleScreen } from "@/content";
import { Button } from "@/components/ui/Button";
import { HostPhoto } from "../HostPhoto";
import { NpcChat, say } from "../NpcChat";
import { useInstant, useQuest } from "../state";

export function Level0Start() {
  const { state, dispatch } = useQuest();
  const instant = useInstant();
  const canResume = state.hydrated && state.maxLevel > 1;

  return (
    <section className="flex flex-col gap-6 pt-6 pb-10" aria-labelledby="title">
      <Image
        src={site.logo}
        alt={site.chapterName}
        width={360}
        height={64}
        priority
        unoptimized
        className="h-auto w-full max-w-[280px] lg:hidden"
      />

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold tracking-widest text-eyebrow uppercase">{titleScreen.tagline}</p>
        <m.h1
          id="title"
          className="text-5xl leading-none font-extrabold tracking-tight"
          initial={instant ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-g-blue">G</span>
          <span className="text-g-red">D</span>
          <span className="text-eyebrow">G</span> <span>Quest</span>
        </m.h1>
        <p className="text-base text-muted">{titleScreen.subtitle}</p>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
        <HostPhoto id="sumaiya" size={56} priority />
        <div>
          <p className="font-semibold">{hosts.sumaiya.name}</p>
          <p className="text-sm text-muted">{hosts.sumaiya.role}, {site.chapterShort}</p>
        </div>
      </div>

      <NpcChat id="l0" lines={say("sumaiya", titleScreen.npc)} />

      <ol className="grid grid-cols-2 gap-2 text-sm text-muted" aria-label="Quest levels">
        {levelNames.slice(1).map((name, i) => (
          <li key={name} className="rounded-xl bg-surface px-3 py-2">
            <span className="font-semibold text-ink">{i + 1}.</span> {name}
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-3">
        {canResume ? (
          <>
            <Button block onClick={() => dispatch({ type: "go", level: state.maxLevel })}>
              ▶ {titleScreen.resume(state.maxLevel)}
            </Button>
            <Button block variant="secondary" onClick={() => dispatch({ type: "restart" })}>
              {titleScreen.restart}
            </Button>
          </>
        ) : (
          <Button block onClick={() => dispatch({ type: "start" })} className="text-lg">
            ▶ {titleScreen.start}
          </Button>
        )}
      </div>
    </section>
  );
}
