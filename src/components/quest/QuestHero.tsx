"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { useInstant } from "./state";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

type NetworkInfo = { saveData?: boolean; effectiveType?: string };

/** Decide on the client whether this device should get the 3D scene */
function canRun3D(): boolean {
  try {
    const nav = navigator as Navigator & { connection?: NetworkInfo; deviceMemory?: number };
    if (nav.connection?.saveData || /(^|-)2g$/.test(nav.connection?.effectiveType ?? "")) return false;
    if ((nav.deviceMemory ?? 4) < 3 || (nav.hardwareConcurrency ?? 4) < 4) return false;
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Title-screen hero. An instant SVG of the Air University building in Google-color blocks,
 * upgraded to a live Three.js scene after the page has loaded (capable devices only).
 */
export function QuestHero() {
  const instant = useInstant();
  const [want3D, setWant3D] = useState(false);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    if (instant) return;
    // Wait for the page to settle so the 3D code never competes with first paint
    const go = () => setWant3D(canRun3D());
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(go, { timeout: 1500 });
      return () => (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(go, 600);
    return () => window.clearTimeout(t);
  }, [instant]);

  const show3D = want3D && !instant;

  return (
    <div
      className="relative h-[210px] overflow-hidden rounded-[2rem] border-2 border-line bg-gradient-to-b from-[#eaf1ff] via-[#fdf6e7] to-[#fbf8f1] sm:h-[260px]"
      aria-hidden="true"
    >
      {/* Instant fallback (also what reduced-motion / low-end / data-saver users keep) */}
      <svg
        viewBox="0 0 400 220"
        className={`absolute inset-0 m-auto h-[88%] w-auto transition-opacity duration-700 ${show3D && ready ? "opacity-0" : "opacity-100"}`}
      >
        <polygon points="120,150 330,150 330,40 150,95" fill="#34A853" />
        <polygon points="150,95 330,40 330,52 160,104" fill="#2a8a45" />
        <rect x="70" y="105" width="120" height="60" rx="6" fill="#EA4335" />
        <polygon points="40,175 360,175 360,95 40,160" fill="#4285F4" />
        <polygon points="40,160 360,95 360,103 40,168" fill="#3367d6" />
        <rect x="160" y="150" width="170" height="52" rx="6" fill="#FBBC04" />
        <rect x="105" y="160" width="55" height="42" rx="5" fill="#EA4335" />
        <polygon points="30,165 60,110 60,165" fill="#34A853" />
      </svg>
      {show3D && <HeroScene onReady={onReady} />}
      <span className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold tracking-wide text-ink shadow-sm">
        🏛️ Air University · Islamabad
      </span>
    </div>
  );
}
