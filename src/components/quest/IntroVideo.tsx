"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ahmedVideo, level4 } from "@/content";

type NetworkInfo = { saveData?: boolean; effectiveType?: string };

/**
 * Ahmed's 15 sec intro. Muted autoplay with burned-in style captions,
 * lazy: nothing downloads until it scrolls into view. No autoplay in
 * speed mode, reduced motion, Save-Data or 2G.
 */
export function IntroVideo({ instant }: { instant: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  // No IntersectionObserver (very old browsers): treat as visible right away
  const [inView, setInView] = useState(() => typeof window !== "undefined" && !("IntersectionObserver" in window));
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [slowNetwork] = useState(() => {
    if (typeof navigator === "undefined") return true;
    const conn = (navigator as Navigator & { connection?: NetworkInfo }).connection;
    return Boolean(conn?.saveData) || /(^|-)2g$/.test(conn?.effectiveType ?? "");
  });
  const autoplay = !instant && !slowNetwork;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "100px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !inView || !autoplay) return;
    v.play().catch(() => setPlaying(false));
  }, [inView, autoplay]);

  const caption = ahmedVideo.captions.find((c) => time >= c.start && time < c.end)?.text ?? (playing ? "" : ahmedVideo.captions[0].text);

  function play() {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = v.ended ? 0 : v.currentTime;
    v.play().catch(() => setFailed(true));
  }

  return (
    <figure ref={wrapRef} className="flex flex-col gap-2">
      <div className="relative mx-auto aspect-[9/16] max-h-[52vh] w-full max-w-[260px] overflow-hidden rounded-3xl border border-line bg-surface">
        {inView && !failed ? (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            src={ahmedVideo.src}
            poster={ahmedVideo.poster}
            muted
            playsInline
            preload={autoplay ? "auto" : "none"}
            aria-label={level4.videoLabel}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            onError={() => setFailed(true)}
          />
        ) : (
          <Image
            src={ahmedVideo.poster}
            alt=""
            fill
            unoptimized={ahmedVideo.poster.endsWith(".svg")}
            className="object-cover"
            sizes="260px"
          />
        )}

        {/* Captions (video is muted, so these carry the message) */}
        {caption && (
          <p className="absolute inset-x-3 bottom-3 rounded-xl bg-black/75 px-3 py-2 text-center text-sm leading-snug font-medium text-white">
            {caption}
          </p>
        )}

        {!playing && !failed && (
          <button
            type="button"
            onClick={() => {
              setInView(true);
              requestAnimationFrame(play);
            }}
            className="absolute inset-0 m-auto grid h-16 w-16 place-items-center rounded-full bg-white/90 text-2xl text-[#202124] shadow-lg"
            aria-label={level4.playVideo}
          >
            ▶
          </button>
        )}
      </div>

      {/* Full transcript for screen readers and when the video can't load */}
      <figcaption className={failed ? "rounded-2xl bg-surface p-3 text-sm text-muted" : "sr-only"}>
        {ahmedVideo.captions.map((c) => c.text).join(" ")}
      </figcaption>
    </figure>
  );
}
