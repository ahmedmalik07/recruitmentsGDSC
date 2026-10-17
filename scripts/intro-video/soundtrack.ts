/**
 * The intro video's audio: the site's own song (src/lib/music.ts) arranged to trailer.html's timing.
 * render.mjs bundles this file and renders it in the browser with an OfflineAudioContext.
 *
 *   0 s    hook, no drums yet; snare fill into the drop
 *   2 s    drop: everything plays
 *   18 s   "Your quest starts now": snare build
 *   20 s   final hit on C with a crash, exactly when the link pops (bar 10)
 */
import { ALL_LAYERS, Kit, STEP, STEPS_PER_BAR, playStep, type Layer } from "../../src/lib/music";

export const TOTAL = 23;
const HIT = 20;

export async function renderTrailer(sampleRate = 44100): Promise<[Float32Array, Float32Array]> {
  const ctx = new OfflineAudioContext(2, Math.ceil(TOTAL * sampleRate), sampleRate);
  const comp = ctx.createDynamicsCompressor();
  const master = ctx.createGain();
  master.gain.value = 0.85;
  master.connect(comp);
  comp.connect(ctx.destination);
  const kit = new Kit(ctx, master);

  const intro: readonly Layer[] = ["bass", "arp", "hat", "lead"];
  const hitStep = Math.round(HIT / STEP);
  for (let step = 0; step < hitStep; step++) {
    const t = step * STEP;
    const bar = Math.floor(step / STEPS_PER_BAR);
    const s = step % STEPS_PER_BAR;
    playStep(kit, step, t, bar === 0 ? intro : ALL_LAYERS);
    // Fill into the drop (last beat of bar 1) and a build into the final hit (last bar)
    if (bar === 0 && s >= 12) kit.snare(t, 0.18 + (s - 12) * 0.05);
    if (step >= hitStep - 8) kit.snare(t, 0.12 + (step - (hitStep - 8)) * 0.035);
  }

  // Final hit: C major chord, low C, kick and crash, then a little sparkle on top
  kit.kick(HIT, 1);
  kit.crash(HIT, 0.26);
  for (const midi of [72, 76, 79, 84]) kit.tone(HIT, midi, 1.8, { duty: 0.25, gain: 0.075, cutoff: 3800, dest: kit.lead });
  kit.tone(HIT, 36, 1.4, { duty: 0.5, gain: 0.22, cutoff: 600 });
  kit.tone(HIT, 48, 1.4, { duty: 0.5, gain: 0.16, cutoff: 800 });
  [84, 88, 91, 96, 91, 88, 84].forEach((midi, i) =>
    kit.tone(HIT + 0.5 + i * STEP, midi, STEP * 0.9, { duty: 0.125, gain: 0.04, cutoff: 5000, dest: kit.lead }),
  );

  const buffer = await ctx.startRendering();
  return [buffer.getChannelData(0), buffer.getChannelData(1)];
}
