"use client";

import { useRef, useState } from "react";
import { domains, errors, site, success } from "@/content";
import { Button } from "@/components/ui/Button";
import { Avatar, type AvatarParts } from "./Avatar";

const W = 1080;
const H = 1920;
const PREVIEW_SCALE = 0.25;

/**
 * 1080x1920 (IG story) card. Rendered once at full size inside a scaled
 * preview; html-to-image is only downloaded when they tap share/download.
 */
export function ApplicantCard({ parts }: { parts: AvatarParts }) {
  const node = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function makeBlob(): Promise<Blob> {
    const { toBlob } = await import("html-to-image");
    const blob = await toBlob(node.current!, {
      width: W,
      height: H,
      pixelRatio: 1,
      cacheBust: true,
      style: { transform: "none" },
    });
    if (!blob) throw new Error("render failed");
    return blob;
  }

  async function share() {
    setBusy(true);
    setError(undefined);
    try {
      const blob = await makeBlob();
      const file = new File([blob], "gdg-quest-card.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        try {
          await nav.share({ files: [file], title: site.appName, text: `${success.cardLine} ${site.igHandle}` });
          return;
        } catch (e) {
          if ((e as Error).name === "AbortError") return;
          // fall through to download
        }
      }
      download(blob);
    } catch {
      setError(errors.cardFailed);
    } finally {
      setBusy(false);
    }
  }

  async function onDownload() {
    setBusy(true);
    setError(undefined);
    try {
      download(await makeBlob());
    } catch {
      setError(errors.cardFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="overflow-hidden rounded-2xl border border-line shadow-2xl"
        style={{ width: W * PREVIEW_SCALE, height: H * PREVIEW_SCALE }}
      >
        <div
          ref={node}
          style={{ width: W, height: H, transform: `scale(${PREVIEW_SCALE})`, transformOrigin: "top left" }}
        >
          <CardArt parts={parts} />
        </div>
      </div>
      <div className="flex w-full flex-col gap-2">
        <Button block onClick={share} disabled={busy}>
          {busy ? success.generating : `📤 ${success.share}`}
        </Button>
        <Button block variant="secondary" onClick={onDownload} disabled={busy}>
          ⬇ {success.download}
        </Button>
        {error && (
          <p role="alert" className="text-center text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function download(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "gdg-quest-card.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function CardArt({ parts }: { parts: AvatarParts }) {
  const house = parts.domain ? domains[parts.domain] : null;
  const color = house?.color ?? "#4285F4";
  return (
    <div
      aria-hidden="true"
      style={{
        width: W,
        height: H,
        position: "relative",
        overflow: "hidden",
        fontFamily: "var(--font-outfit), system-ui, sans-serif",
        color: "#1D2A5C",
        background: `radial-gradient(circle at 12% 8%, ${color}33 0, transparent 440px),
          radial-gradient(circle at 92% 88%, #34A85326 0, transparent 480px),
          radial-gradient(circle at 88% 18%, #EA433522 0, transparent 380px),
          radial-gradient(circle at 8% 92%, #FBBC0430 0, transparent 420px),
          #F8F4E9`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "110px 80px 90px",
        boxSizing: "border-box",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={site.logo} alt="" width={640} height={111} style={{ width: 640, height: "auto" }} />

      <div style={{ marginTop: 70, fontSize: 56, fontWeight: 800, letterSpacing: 8 }}>
        <span style={{ color: "#4285F4" }}>G</span>
        <span style={{ color: "#EA4335" }}>D</span>
        <span style={{ color: "#FBBC04" }}>G</span> <span>QUEST</span>
      </div>

      <div style={{ marginTop: 40 }}>
        <Avatar parts={parts} size={540} showName={false} animated={false} />
      </div>

      <div style={{ marginTop: 30, fontSize: 132, fontWeight: 800, lineHeight: 1, textAlign: "center" }}>
        {parts.firstName || "Player"}
      </div>

      {house && (
        <div
          style={{
            marginTop: 36,
            padding: "18px 44px",
            borderRadius: 999,
            background: house.solid,
            color: house.onColor,
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          {house.house} · {parts.position || house.label}
        </div>
      )}

      <div style={{ marginTop: 56, fontSize: 64, fontWeight: 700, textAlign: "center" }}>{success.cardLine}</div>

      <div style={{ marginTop: "auto", textAlign: "center" }}>
        <div style={{ fontSize: 46, fontWeight: 700 }}>{site.igHandle}</div>
        <div style={{ marginTop: 10, fontSize: 34, color: "#56608A" }}>{site.link}</div>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", height: 22 }}>
        {["#4285F4", "#EA4335", "#FBBC04", "#34A853"].map((c) => (
          <div key={c} style={{ flex: 1, background: c }} />
        ))}
      </div>
    </div>
  );
}
