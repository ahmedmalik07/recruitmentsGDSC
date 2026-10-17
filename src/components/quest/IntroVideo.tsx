"use client";

import { useEffect, useRef, useState } from "react";
import { introVideo } from "@/content";
import { IntroStory } from "./IntroStory";
import { useInstant } from "./state";

/** Data saver on, or a 2G connection */
function lowData(): boolean {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return Boolean(c?.saveData) || /(^|-)2g$/.test(c?.effectiveType ?? "");
}

/**
 * The council trailer. Nothing downloads until it's on screen (preload="none"), then it plays muted.
 * Speed mode, reduced motion and data saver get the poster and a play button instead.
 * If the video can't play, or they'd rather tap, the HTML story takes its place.
 */
export function IntroVideo() {
  const instant = useInstant();
  const video = useRef<HTMLVideoElement>(null);
  const [story, setStory] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) el.pause();
        else if (!instant && !lowData() && el.currentTime === 0) void el.play().catch(() => {});
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [instant, story]);

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
              onClick={() => void video.current?.play().catch(() => setStory(true))}
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
