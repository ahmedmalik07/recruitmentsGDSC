"use client";

import { useRef } from "react";
import { m, useAnimationControls } from "framer-motion";
import { avatarQuips, ui } from "@/content";
import { music } from "@/lib/music";
import { Avatar, type AvatarParts } from "./Avatar";
import { toast } from "./toast";
import { useInstant } from "./state";

/** The live character. Tap it and it jumps and says something. */
export function PokeAvatar({
  parts,
  size,
  showName = true,
  className,
}: {
  parts: AvatarParts;
  size: number;
  showName?: boolean;
  className?: string;
}) {
  const instant = useInstant();
  const controls = useAnimationControls();
  const pokes = useRef(0);

  function poke() {
    music.sfx("boing");
    toast(avatarQuips[pokes.current % avatarQuips.length]);
    pokes.current += 1;
    if (!instant) {
      void controls.start({
        y: [0, -size * 0.28, 0, -size * 0.08, 0],
        rotate: [0, -10, 8, -3, 0],
        transition: { duration: 0.6 },
      });
    }
  }

  return (
    <button
      type="button"
      onClick={poke}
      aria-label={ui.poke}
      title={ui.pokeTitle}
      className={`cursor-pointer rounded-full ${className ?? ""}`}
    >
      <m.span animate={controls} className="block">
        <span className={instant ? "block" : "avatar-bob block"}>
          <Avatar parts={parts} size={size} showName={showName} animated={!instant} />
        </span>
      </m.span>
    </button>
  );
}
