// Renders trailer.html + soundtrack.ts into the intro video, frame by frame.
//
//   node scripts/intro-video/render.mjs               full render (about 3 minutes)
//   node scripts/intro-video/render.mjs --stills 4,10  just PNG stills at those seconds, to check a layout
//   node scripts/intro-video/render.mjs --audio        just the soundtrack, as out/music.wav
//
// Needs ffmpeg and Playwright with Chromium (`npm i -D playwright && npx playwright install chromium`,
// or point PLAYWRIGHT_MODULE at an existing install). Outputs:
//   public/intro/gdg-quest-intro.mp4   720x1280 with sound, used by Level 4 (+ .webm for browsers without H.264)
//   public/intro/poster.jpg            first frame the player shows
//   scripts/intro-video/out/gdg-quest-intro-1080x1920.mp4   full quality, for Instagram / WhatsApp status
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const out = join(here, "out");
const frames = join(out, "frames");
const wavPath = join(out, "music.wav");
const FPS = 30;
const POSTER_AT = 5.4; // the GDG QUEST title card

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const esbuild = require("esbuild");

const stillsArg = process.argv.indexOf("--stills");
const stills = stillsArg > 0 ? process.argv[stillsArg + 1].split(",").map(Number) : null;
const audioOnly = process.argv.includes("--audio");

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(pathToFileURL(join(here, "trailer.html")).href);
await page.evaluate(() => window.ready);
const total = await page.evaluate(() => window.TOTAL);

if (stills) {
  for (const t of stills) {
    await page.evaluate((s) => window.seek(s), t);
    await page.screenshot({ path: join(out, `still-${t}.png`) });
  }
  console.log(`Stills in ${out}`);
  await browser.close();
  process.exit(0);
}

// 1. Soundtrack: the site's own song, rendered offline in the browser
const bundle = esbuild.buildSync({
  entryPoints: [join(here, "soundtrack.ts")],
  bundle: true,
  format: "iife",
  globalName: "Soundtrack",
  write: false,
});
await page.addScriptTag({ content: bundle.outputFiles[0].text });
const { b64, peak, seconds } = await page.evaluate(async () => {
  const rate = 44100;
  const [l, r] = await window.Soundtrack.renderTrailer(rate);
  const n = l.length;
  const buf = new ArrayBuffer(44 + n * 4);
  const v = new DataView(buf);
  const str = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  v.setUint32(4, 36 + n * 4, true);
  str(8, "WAVEfmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 2, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 4, true);
  v.setUint16(32, 4, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, n * 4, true);
  let o = 44;
  let peak = 0;
  for (let i = 0; i < n; i++) {
    for (const ch of [l, r]) {
      const x = Math.max(-1, Math.min(1, ch[i]));
      peak = Math.max(peak, Math.abs(x));
      v.setInt16(o, x * 32767, true);
      o += 2;
    }
  }
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return { b64: btoa(bin), peak, seconds: n / rate };
});
writeFileSync(wavPath, Buffer.from(b64, "base64"));
console.log(`Soundtrack: ${seconds.toFixed(1)} s, peak ${peak.toFixed(2)} → ${wavPath}`);
if (audioOnly) {
  await browser.close();
  process.exit(0);
}

// 2. Frames
rmSync(frames, { recursive: true, force: true });
mkdirSync(frames, { recursive: true });
const count = Math.round(total * FPS);
for (let i = 0; i < count; i++) {
  await page.evaluate((s) => window.seek(s), i / FPS);
  await page.screenshot({ path: join(frames, `f${String(i).padStart(4, "0")}.jpg`), type: "jpeg", quality: 92 });
  if (i % 150 === 0) console.log(`frame ${i}/${count}`);
}
await browser.close();

// 3. Encode
const input = ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(frames, "f%04d.jpg"), "-i", wavPath, "-shortest"];
const web = ["-vf", "scale=720:1280:flags=lanczos"];
execFileSync("ffmpeg", [
  ...input,
  "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
  "-c:a", "aac", "-b:a", "192k",
  join(out, "gdg-quest-intro-1080x1920.mp4"),
]);
mkdirSync(join(root, "public/intro"), { recursive: true });
execFileSync("ffmpeg", [
  ...input, ...web,
  "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-maxrate", "1500k", "-bufsize", "3000k",
  "-profile:v", "main", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
  "-c:a", "aac", "-b:a", "96k",
  join(root, "public/intro/gdg-quest-intro.mp4"),
]);
// Same thing as WebM/VP9 for browsers without H.264
execFileSync("ffmpeg", [
  ...input, ...web,
  "-c:v", "libvpx-vp9", "-crf", "38", "-b:v", "0", "-row-mt", "1", "-deadline", "good", "-cpu-used", "2",
  "-pix_fmt", "yuv420p", "-c:a", "libopus", "-b:a", "80k",
  join(root, "public/intro/gdg-quest-intro.webm"),
]);
execFileSync("ffmpeg", [
  "-y", "-loglevel", "error", "-i", join(frames, `f${String(Math.round(POSTER_AT * FPS)).padStart(4, "0")}.jpg`),
  "-vf", "scale=540:960:flags=lanczos", "-q:v", "4", join(root, "public/intro/poster.jpg"),
]);
console.log("Done: public/intro/gdg-quest-intro.{mp4,webm}, public/intro/poster.jpg, scripts/intro-video/out/gdg-quest-intro-1080x1920.mp4");
