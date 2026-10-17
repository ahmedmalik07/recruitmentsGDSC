"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { introVideo } from "@/content";
import { music } from "@/lib/music";
import { IntroStory } from "./IntroStory";
import { useQuest } from "./state";

/** Data saver on, or a 2G connection */
function lowData(): boolean {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return Boolean(c?.saveData) || /(^|-)2g$/.test(c?.effectiveType ?? "");
}

/**
 * The council trailer. It starts by itself as soon as Level 4 shows it (only reduced motion and
 * data saver wait for a tap). The video file is silent: its music is the site's own song, played
 * live in sync (music.playTrailer), so it works on every phone, iPhones included, and follows 🔊.
 * If the video can't play, or they'd rather tap, the HTML story takes its place.
 */
export function IntroVideo() {
  const reduced = useReducedMotion();
  const { state } = useQuest();
  const sound = state.soundOn;
  const video = useRef<HTMLVideoElement>(null);
  const [story, setStory] = useState(false);
  const [started, setStarted] = useState(false);

  // Autoplay once on screen; pause when scrolled away or the tab is hidden
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    let resumeOnReturn = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) el.pause();
        else if (!reduced && !lowData() && !el.ended && (el.currentTime === 0 || resumeOnReturn)) {
          resumeOnReturn = false;
          void el.play().catch(() => {});
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    const onVisibility = () => {
      if (document.hidden && !el.paused) {
        resumeOnReturn = true;
        el.pause();
      } else if (!document.hidden && resumeOnReturn) {
        resumeOnReturn = false;
        void el.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced, story]);

  // Keep the music in step with the picture
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const play = () => {
      if (!el.paused && !el.seeking) music.playTrailer(el.currentTime);
    };
    const stop = () => music.stopTrailer();
    const on: Array<[string, () => void]> = [
      ["playing", play],
      ["seeked", play],
      ["pause", stop],
      ["waiting", stop],
      ["seeking", stop],
      ["ended", stop],
      ["emptied", stop],
    ];
    on.forEach(([e, f]) => el.addEventListener(e, f));
    // Sound switched on while it plays
    if (sound) play();
    return () => {
      on.forEach(([e, f]) => el.removeEventListener(e, f));
      music.stopTrailer();
    };
  }, [sound, story]);

  function tapPlay() {
    const el = video.current;
    if (!el) return;
    if (sound) music.start();
    el.play().catch(() => setStory(true));
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {story ? (
        <IntroStory />
      ) : (
        <div className="relative w-full max-w-[340px]">
          <video
            ref={video}
            className="block w-full rounded-[1.75rem] bg-[#1967D2] shadow-xl ring-4 ring-white"
            style={{ aspectRatio: "9 / 16" }}
            poster={introVideo.poster}
            preload="none"
            muted
            playsInline
            controls
            aria-label={introVideo.label}
            aria-describedby="intro-transcript"
            onPlay={() => setStarted(true)}
          >
            <source src={introVideo.src} type="video/mp4" />
            {/* An error on the last source means nothing could play */}
            <source src={introVideo.srcWebm} type="video/webm" onError={() => setStory(true)} />
          </video>
          {!started && (
            <button
              type="button"
              onClick={tapPlay}
              className="absolute inset-x-0 bottom-[10%] mx-auto flex w-max items-center gap-2 rounded-full bg-ink px-5 py-3 text-base font-extrabold text-white shadow-lg"
            >
              <span aria-hidden="true">▶</span> {introVideo.play}
            </button>
          )}
        </div>
      )}
      <p id="intro-transcript" className="sr-only">
        {introVideo.transcript}
      </p>
      <p className="flex flex-wrap items-center justify-center gap-x-2 text-sm text-muted">
        {!story && <span>{introVideo.caption}</span>}
        <button
          type="button"
          onClick={() => setStory((s) => !s)}
          className="font-semibold text-link underline underline-offset-2"
        >
          {story ? introVideo.showVideo : introVideo.showStory}
        </button>
      </p>
    </div>
  );
}
