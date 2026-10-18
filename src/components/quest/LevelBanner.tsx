"use client";

import { levelNames, levelStyle } from "@/content";
import { HostPhoto } from "./HostPhoto";

/** Big colorful level header. Visual only: the level's <h1> lives in the HUD for screen readers. */
export function LevelBanner({ level }: { level: number }) {
  const style = levelStyle[level];
  if (!style) return null;
  return (
    <div
      aria-hidden="true"
      className="pop-in relative flex items-center gap-3 overflow-hidden rounded-3xl border-2 p-3 pr-4"
      style={{ borderColor: `${style.color}66`, background: `linear-gradient(120deg, ${style.color}26, ${style.color}0d 60%, #ffffff00)` }}
    >
      <div
        className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-center shadow-[0_4px_0_rgb(0_0_0/0.15)]"
        style={{ background: style.solid, color: style.onSolid }}
      >
        <span className="text-[10px] leading-none font-bold tracking-widest">LVL</span>
        <span className="-mt-3 text-2xl leading-none font-extrabold">{level}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold tracking-wide text-muted uppercase">
          {style.emoji} Level {level} of 7
        </p>
        <p className="text-xl leading-tight font-extrabold text-balance">{levelNames[level]}</p>
      </div>
      <div className="flex shrink-0 -space-x-2">
        {style.hosts.map((h) => (
          <HostPhoto key={h} id={h} size={30} className="ring-2 ring-white" />
        ))}
      </div>
    </div>
  );
}
