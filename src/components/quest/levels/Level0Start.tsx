"use client";

import Image from "next/image";
import { m } from "framer-motion";
import { hosts, levelNames, levelStyle, site, titleScreen, ui, type HostId } from "@/content";
import { Button } from "@/components/ui/Button";
import { music } from "@/lib/music";
import { HostPhoto } from "../HostPhoto";
import { NpcChat, say } from "../NpcChat";
import { QuestHero } from "../QuestHero";
import { Tilt } from "../Tilt";
import { toast } from "../toast";
import { useInstant, useQuest } from "../state";

/** The "music on, tap to mute" tip shows once per visit */
let soundHintShown = false;

export function Level0Start() {
  const { state, dispatch } = useQuest();
  const instant = useInstant();
  const canResume = state.hydrated && state.maxLevel > 1;

  /** Start the soundtrack with the click (browsers block sound before one) */
  function begin(action: Parameters<typeof dispatch>[0]) {
    if (state.soundOn) {
      music.setEnabled(true);
      music.start();
      if (!soundHintShown) toast(ui.soundHint);
      soundHintShown = true;
    }
    dispatch(action);
  }

  return (
    <section className="flex flex-col gap-6 pt-5 pb-6" aria-labelledby="title">
      <Image
        src={site.logo}
        alt={site.chapterName}
        width={site.logoSize.width}
        height={site.logoSize.height}
        priority
        sizes="260px"
        className="h-auto w-full max-w-[260px] lg:hidden"
      />

      <QuestHero />

      <div className="flex flex-col gap-3">
        <p className="text-sm font-extrabold tracking-[0.2em] text-eyebrow uppercase">{titleScreen.tagline}</p>
        <m.h1
          id="title"
          className="text-[3.4rem] leading-[0.95] font-extrabold tracking-tight sm:text-7xl"
          initial={instant ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          {/* Letters hop when hovered or tapped */}
          {(
            [
              ["G", "text-g-blue"],
              ["D", "text-g-red"],
              ["G", "text-g-green-strong"],
            ] as const
          ).map(([ch, cls], i) => (
            <m.span
              key={i}
              className={`inline-block cursor-default ${cls}`}
              whileHover={instant ? undefined : { y: -8, rotate: i % 2 ? 6 : -6 }}
              whileTap={instant ? undefined : { scale: 1.2, y: -4 }}
              transition={{ type: "spring", stiffness: 500, damping: 12 }}
            >
              {ch}
            </m.span>
          ))}{" "}
          <span>Quest</span>
        </m.h1>
        <p className="text-base text-muted sm:text-lg">{titleScreen.subtitle}</p>
        <ul className="flex flex-wrap gap-2" aria-label="Quick facts">
          {titleScreen.facts.map((f) => (
            <li key={f} className="rounded-full border-2 border-line bg-surface px-3 py-1 text-sm font-semibold">
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Hosts: the President and the guide, side by side and equal */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {(["sumaiya", "ahmed"] as HostId[]).map((id) => (
          <Tilt key={id} className="h-full">
            <div
              className="relative flex h-full items-center gap-2.5 rounded-2xl border-2 p-2.5"
              style={{ borderColor: hosts[id].accent, background: `${hosts[id].accent}14` }}
            >
              <span
                className="absolute -top-2.5 right-2 rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-wide whitespace-nowrap text-white uppercase"
                style={{ background: hosts[id].badge.bg }}
              >
                {hosts[id].badge.text}
              </span>
              <HostPhoto id={id} size={48} priority />
              <div className="min-w-0">
                <p className="leading-tight font-bold">{hosts[id].name}</p>
                <p className="text-xs text-muted">{hosts[id].role}</p>
              </div>
            </div>
          </Tilt>
        ))}
      </div>

      <NpcChat id="l0" lines={[...say("sumaiya", titleScreen.npc), ...say("ahmed", titleScreen.npcAhmed)]} />

      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Quest levels">
        {levelNames.slice(1).map((name, i) => {
          const st = levelStyle[i + 1];
          return (
            <li
              key={name}
              className="flex items-center gap-2 rounded-2xl border-2 bg-surface px-2.5 py-2 text-sm font-semibold"
              style={{ borderColor: `${st.color}55` }}
            >
              <span
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-extrabold"
                style={{ background: st.solid, color: st.onSolid }}
              >
                {i + 1}
              </span>
              <span className="leading-tight">
                <span aria-hidden="true">{st.emoji} </span>
                {name}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col gap-3">
        {canResume ? (
          <>
            <Button block onClick={() => begin({ type: "go", level: state.maxLevel })} className="min-h-14 text-lg">
              ▶ {titleScreen.resume(state.maxLevel)}
            </Button>
            <Button block variant="secondary" onClick={() => begin({ type: "restart" })}>
              {titleScreen.restart}
            </Button>
          </>
        ) : (
          <Button block onClick={() => begin({ type: "start" })} className="min-h-14 text-xl">
            ▶ {titleScreen.start}
          </Button>
        )}
        <a
          href={site.whatsappGroup}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-3d inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-[#9fd5b0] bg-tint-green px-4 text-center text-[15px] font-bold text-good"
          style={{ ["--btn-edge" as string]: "#9fd5b0" }}
        >
          👥 {titleScreen.joinGroup}
        </a>
      </div>
    </section>
  );
}
