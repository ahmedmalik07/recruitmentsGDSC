/**
 * Offline renders of the site's own song (src/lib/music.ts), for render.mjs:
 * the intro video's soundtrack, and a preview of the background music.
 * render.mjs bundles this file and runs it in the browser with an OfflineAudioContext.
 */
import { Kit, LEVEL_MIX, STEP, TRAILER_SECONDS, loopStep, trailerStep } from "../../src/lib/music";

type Play = (kit: Kit, step: number, t: number) => void;

async function render(seconds: number, sampleRate: number, play: Play): Promise<[Float32Array, Float32Array]> {
  const ctx = new OfflineAudioContext(2, Math.ceil(seconds * sampleRate), sampleRate);
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.knee.value = 10;
  comp.ratio.value = 3;
  comp.connect(ctx.destination);
  const master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(comp);
  const kit = new Kit(ctx, master);
  for (let step = 0; step * STEP < seconds; step++) play(kit, step, step * STEP);
  const buffer = await ctx.startRendering();
  return [buffer.getChannelData(0), buffer.getChannelData(1)];
}

/** The intro video's music: 15 s, final hit at 12 s */
export const renderTrailer = (sampleRate = 44100) => render(TRAILER_SECONDS, sampleRate, trailerStep);

/** 36 s of the background music: the intro levels, then the calm typing mix, then the Boss Check */
export const renderPreview = (sampleRate = 44100) =>
  render(36, sampleRate, (kit, step, t) =>
    loopStep(kit, step, t, step < 128 ? LEVEL_MIX[1] : step < 192 ? LEVEL_MIX[3] : LEVEL_MIX[6]),
  );
