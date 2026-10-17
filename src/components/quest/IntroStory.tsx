"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, m } from "framer-motion";
import { DOMAIN_IDS, domains, hosts, introStory } from "@/content";
import { HostPhoto } from "./HostPhoto";
import { useInstant } from "./state";

const BACKGROUNDS = [
  "linear-gradient(135deg, #1967D2 0%, #4285F4 55%, #8AB4F8 100%)",
  "linear-gradient(135deg, #202124 0%, #3c4043 100%)",
  "linear-gradient(135deg, #C5221F 0%, #EA4335 55%, #F28B82 100%)",
  "linear-gradient(135deg, #0b3d91 0%, #1967D2 100%)",
  "linear-gradient(135deg, #137333 0%, #34A853 55%, #81C995 100%)",
];

/**
 * Instagram-style story starring the council. Replaces a recorded intro video:
 * zero download, works offline, autoplays (except in speed / reduced motion).
 * Tap right = next, tap left = back, hold = pause.
 */
export function IntroStory() {
  const instant = useInstant();
  const slides = introStory.slides;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const holding = useRef(false);
  const progressRef = useRef(0);
  const autoplay = !instant && !paused && !done;

  const go = useCallback(
    (to: number) => {
      progressRef.current = 0;
      if (to >= slides.length) {
        setDone(true);
        setProgress(1);
        return;
      }
      setIndex(Math.max(0, to));
      setProgress(0);
      setDone(false);
    },
    [slides.length],
  );

  // Progress timer (resumes from where it was paused)
  useEffect(() => {
    if (!autoplay) return;
    const total = introStory.secondsPerSlide * 1000;
    const from = progressRef.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = from + (now - t0) / total;
      if (p >= 1) {
        go(index + 1);
        return;
      }
      progressRef.current = p;
      setProgress(p);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoplay, index, go]);

  const slide = slides[index];

  return (
    <section
      aria-roledescription="carousel"
      aria-label={introStory.label}
      className="relative mx-auto w-full max-w-[340px] overflow-hidden rounded-[1.75rem] shadow-xl ring-4 ring-white select-none"
      style={{ aspectRatio: "4 / 5" }}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <m.div
          key={index}
          initial={instant ? false : { opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-white"
          style={{ background: BACKGROUNDS[index % BACKGROUNDS.length] }}
          aria-roledescription="slide"
          aria-label={`${index + 1} of ${slides.length}`}
        >
          {slide.backdrop && (
            <>
              <Image src={slide.backdrop} alt="" fill sizes="340px" className="object-cover" />
              <span className="absolute inset-0 bg-gradient-to-t from-[#0b3d91]/95 via-[#0b3d91]/55 to-transparent" />
            </>
          )}

          <div className="relative flex flex-col items-center gap-4">
            {slide.hosts && (
              <div className="flex items-end justify-center -space-x-3">
                {slide.hosts.map((h, i) => (
                  <m.div
                    key={h}
                    initial={instant ? false : { y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.12 * i, type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <HostPhoto
                      id={h}
                      size={slide.hosts!.length > 1 ? 84 : slide.backdrop ? 72 : 120}
                      portrait={slide.hosts!.length === 1}
                      className="ring-4 ring-white"
                    />
                  </m.div>
                ))}
              </div>
            )}

            {slide.teams && (
              <div className="grid grid-cols-2 gap-2">
                {DOMAIN_IDS.map((id, i) => (
                  <m.span
                    key={id}
                    initial={instant ? false : { scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.08 * i, type: "spring", stiffness: 400, damping: 18 }}
                    className={`rounded-xl px-3 py-2 text-sm font-extrabold ${i === DOMAIN_IDS.length - 1 ? "col-span-2" : ""}`}
                    style={{ background: domains[id].solid, color: domains[id].onColor }}
                  >
                    {domains[id].label}
                  </m.span>
                ))}
              </div>
            )}

            <p className="text-[1.35rem] leading-snug font-extrabold drop-shadow-sm" aria-live={autoplay ? "off" : "polite"}>
              {slide.text}
            </p>
            <p className="text-sm font-semibold opacity-90">{slide.sub}</p>
            {slide.hosts?.length === 1 && (
              <span className="sr-only">{hosts[slide.hosts[0]].name} says this.</span>
            )}
          </div>
        </m.div>
      </AnimatePresence>

      {/* Progress bars */}
      <div className="absolute inset-x-3 top-3 z-10 flex gap-1" aria-hidden="true">
        {slides.map((_, i) => (
          <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/35">
            <span
              className="block h-full rounded-full bg-white"
              style={{ width: `${i < index || (done && i === index) ? 100 : i === index ? progress * 100 : 0}%` }}
            />
          </span>
        ))}
      </div>

      {/* Tap zones: left = back, right = next; hold anywhere = pause */}
      <button
        type="button"
        className="absolute inset-y-0 left-0 z-10 w-1/3"
        aria-label="Previous slide"
        onClick={() => go(index - 1)}
        onPointerDown={() => {
          holding.current = true;
          setPaused(true);
        }}
        onPointerUp={() => holding.current && setPaused(false)}
        onPointerLeave={() => holding.current && setPaused(false)}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 z-10 w-2/3"
        aria-label="Next slide"
        onClick={() => go(index + 1)}
        onPointerDown={() => {
          holding.current = true;
          setPaused(true);
        }}
        onPointerUp={() => holding.current && setPaused(false)}
        onPointerLeave={() => holding.current && setPaused(false)}
      />

      {/* Pause / replay */}
      <div className="absolute right-3 bottom-3 z-20">
        {done ? (
          <button
            type="button"
            onClick={() => go(0)}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-ink shadow"
          >
            ↺ {introStory.replay}
          </button>
        ) : (
          !instant && (
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-pressed={paused}
              className="grid h-9 w-9 place-items-center rounded-full bg-black/35 text-sm text-white"
              aria-label={paused ? introStory.play : introStory.pause}
            >
              {paused ? "▶" : "❚❚"}
            </button>
          )
        )}
      </div>
    </section>
  );
}
