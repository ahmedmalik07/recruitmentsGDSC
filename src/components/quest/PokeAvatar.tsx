"use client";

import { useEffect, useRef, useState } from "react";
import { m, useAnimationControls } from "framer-motion";
import { avatarQuips, ui } from "@/content";
import { music } from "@/lib/music";
import { Avatar, type AvatarParts } from "./Avatar";
import { toast } from "./toast";
import { useInstant } from "./state";

/** The live character. Tap it and it jumps and says something. It also cheers when `unlocked` goes up. */
export function PokeAvatar({
  parts,
  size,
  showName = true,
  className,
  unlocked = 0,
}: {
  parts: AvatarParts;
  size: number;
  showName?: boolean;
  className?: string;
  /** How many parts are unlocked; each new one makes it jump with a sparkle */
  unlocked?: number;
}) {
  const instant = useInstant();
  const controls = useAnimationControls();
  const pokes = useRef(0);
  const seen = useRef(unlocked);
  const [sparkle, setSparkle] = useState(0);

  useEffect(() => {
    const before = seen.current;
    seen.current = unlocked;
    if (unlocked <= before) return;
    setSparkle((n) => n + 1);
    if (!instant) {
      void controls.start({ y: [0, -size * 0.3, 0], scale: [1, 1.18, 1], transition: { duration: 0.5 } });
    }
  }, [unlocked, instant, controls, size]);

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
      className={`relative cursor-pointer rounded-full ${className ?? ""}`}
    >
      {sparkle > 0 && (
        <span
          key={sparkle}
          aria-hidden="true"
          className="unlock-ring pointer-events-none absolute inset-0 rounded-full"
        />
      )}
      <m.span animate={controls} className="block">
        <span className={instant ? "block" : "avatar-bob block"}>
          <Avatar parts={parts} size={size} showName={showName} animated={!instant} />
        </span>
      </m.span>
    </button>
  );
}
