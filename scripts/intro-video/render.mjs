// Renders trailer.html into the intro video, frame by frame.
//
//   node scripts/intro-video/render.mjs               full render (about 3 minutes)
//   node scripts/intro-video/render.mjs --stills 4,10  just PNG stills at those seconds, to check a layout
//
// Needs ffmpeg and Playwright with Chromium (`npm i -D playwright && npx playwright install chromium`,
// or point PLAYWRIGHT_MODULE at an existing install). Outputs:
//   public/intro/gdg-quest-intro.mp4   720x1280, small, used by Level 4 (+ .webm for browsers without H.264)
//   public/intro/poster.jpg            first frame the player shows
//   scripts/intro-video/out/gdg-quest-intro-1080x1920.mp4   full quality, for Instagram / WhatsApp status
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const out = join(here, "out");
const frames = join(out, "frames");
const FPS = 30;

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? "playwright");

const stillsArg = process.argv.indexOf("--stills");
const stills = stillsArg > 0 ? process.argv[stillsArg + 1].split(",").map(Number) : null;

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

rmSync(frames, { recursive: true, force: true });
mkdirSync(frames, { recursive: true });
const count = Math.round(total * FPS);
for (let i = 0; i < count; i++) {
  await page.evaluate((s) => window.seek(s), i / FPS);
  await page.screenshot({ path: join(frames, `f${String(i).padStart(4, "0")}.jpg`), type: "jpeg", quality: 92 });
  if (i % 150 === 0) console.log(`frame ${i}/${count}`);
}
await browser.close();

const input = ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(frames, "f%04d.jpg")];
// Full quality with a silent audio track (some apps refuse videos without one)
execFileSync("ffmpeg", [
  ...input,
  "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-shortest",
  "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
  "-c:a", "aac", "-b:a", "96k",
  join(out, "gdg-quest-intro-1080x1920.mp4"),
]);
// Web version: smaller, no audio
mkdirSync(join(root, "public/intro"), { recursive: true });
execFileSync("ffmpeg", [
  ...input,
  "-vf", "scale=720:1280:flags=lanczos",
  "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-maxrate", "1500k", "-bufsize", "3000k",
  "-profile:v", "main", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an",
  join(root, "public/intro/gdg-quest-intro.mp4"),
]);
// Same thing as WebM/VP9 for browsers without H.264
execFileSync("ffmpeg", [
  ...input,
  "-vf", "scale=720:1280:flags=lanczos",
  "-c:v", "libvpx-vp9", "-crf", "38", "-b:v", "0", "-row-mt", "1", "-deadline", "good", "-cpu-used", "2",
  "-pix_fmt", "yuv420p", "-an",
  join(root, "public/intro/gdg-quest-intro.webm"),
]);
// Poster: the title card
execFileSync("ffmpeg", [
  "-y", "-loglevel", "error", "-i", join(frames, `f${String(Math.round(8.3 * FPS)).padStart(4, "0")}.jpg`),
  "-vf", "scale=540:960:flags=lanczos", "-q:v", "4", join(root, "public/intro/poster.jpg"),
]);
console.log("Done: public/intro/gdg-quest-intro.mp4, public/intro/poster.jpg, scripts/intro-video/out/gdg-quest-intro-1080x1920.mp4");
