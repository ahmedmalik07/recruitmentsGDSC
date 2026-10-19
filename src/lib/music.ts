/**
 * GDG Quest soundtrack: an original chill synth-pop tune made in code with the Web Audio API.
 * Electric piano, a warm pad, round bass and soft lo-fi drums over the "royal road" progression
 * (Fmaj7, G6, Em7, Am7). Nothing to download, it loops without gaps, and the mix follows the level.
 * The intro video's music is the same song arranged as a trailer (trailerStep), played in sync with it.
 */

export const BPM = 120;
/** One 16th note, in seconds */
export const STEP = 60 / BPM / 4;
export const STEPS_PER_BAR = 16;
/** Offbeat 16ths land a little late, for a relaxed feel */
const SWING = 0.2;

const MUSIC_VOLUME = 0.55;
const SFX_VOLUME = 0.6;

type Chord = { keys: readonly number[]; bass: number };
/** Fmaj7, G6, Em7, Am7: one bar each */
const CHORDS: readonly Chord[] = [
  { keys: [53, 57, 60, 64], bass: 41 },
  { keys: [55, 59, 62, 64], bass: 43 },
  { keys: [52, 55, 59, 62], bass: 40 },
  { keys: [55, 57, 60, 64], bass: 45 },
];
/** Cmaj9, for the big finish */
const FINAL: Chord = { keys: [48, 55, 59, 62, 64], bass: 36 };

/** [step in bar, MIDI note, length in steps]. 8 bars: the hook, then the answer an octave up */
type Note = readonly [number, number, number];
const LEAD: ReadonlyArray<ReadonlyArray<Note>> = [
  [[0, 81, 2], [2, 79, 2], [4, 76, 4], [10, 72, 2], [12, 74, 4]],
  [[0, 76, 2], [2, 79, 2], [4, 81, 4], [10, 79, 2], [12, 76, 4]],
  [[0, 79, 2], [2, 76, 2], [4, 74, 4], [10, 76, 2], [12, 79, 4]],
  [[0, 81, 6], [8, 79, 2], [10, 76, 2], [12, 74, 2], [14, 72, 2]],
  [[0, 84, 2], [2, 81, 2], [4, 79, 2], [6, 81, 6], [12, 84, 4]],
  [[0, 86, 3], [3, 84, 1], [4, 81, 2], [6, 79, 8]],
  [[0, 76, 2], [2, 79, 2], [4, 83, 2], [6, 86, 6], [12, 83, 4]],
  [[0, 84, 4], [4, 81, 4], [8, 79, 2], [10, 76, 2], [12, 81, 4]],
];
/** Electric piano comping: [step, length, velocity] */
const KEYS_HITS: ReadonlyArray<readonly [number, number, number]> = [
  [0, 6, 1],
  [6, 2, 0.55],
  [10, 6, 0.8],
];
/** Bass line: [step, semitones above the root, length] */
const BASS_LINE: ReadonlyArray<readonly [number, number, number]> = [
  [0, 0, 5],
  [6, 0, 2],
  [8, 12, 2],
  [10, 0, 4],
  [14, 7, 2],
];

export type Layer = "keys" | "pad" | "bass" | "hat" | "kick" | "snare" | "lead" | "arp";
export type Mix = { layers: readonly Layer[]; groove: "half" | "full" };
const ALL_LAYERS: readonly Layer[] = ["keys", "pad", "bass", "hat", "kick", "snare", "lead", "arp"];
const INTRO: readonly Layer[] = ["keys", "pad", "bass", "hat", "kick", "snare", "lead"];
const CALM: readonly Layer[] = ["keys", "pad", "bass", "hat"];

/** What plays on each level: laid back with the melody, calmer while typing, full power for the boss (8 = submitted) */
export const LEVEL_MIX: Record<number, Mix> = {
  1: { layers: INTRO, groove: "half" },
  2: { layers: INTRO, groove: "half" },
  3: { layers: CALM, groove: "half" },
  4: { layers: INTRO, groove: "half" },
  5: { layers: CALM, groove: "half" },
  6: { layers: ALL_LAYERS, groove: "full" },
  7: { layers: [...INTRO, "arp"], groove: "half" },
  8: { layers: ALL_LAYERS, groove: "full" },
};

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
/** Repeatable "random" 0..1 per step, so every render sounds the same */
const jitter = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

/** Buffers shared by every Kit on the same context */
const shared = new WeakMap<BaseAudioContext, { noise: AudioBuffer; room: AudioBuffer }>();
function buffers(ctx: BaseAudioContext) {
  let b = shared.get(ctx);
  if (!b) {
    const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const nd = noise.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    // Small warm room: 2 s of decaying stereo noise
    const len = Math.floor(ctx.sampleRate * 2);
    const room = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = room.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3.2;
    }
    b = { noise, room };
    shared.set(ctx, b);
  }
  return b;
}

/** Instruments and a small mixer for one output */
export class Kit {
  private readonly noise: AudioBuffer;
  /** Keys, pad and arp duck on every kick (the modern "pumping" feel) */
  private readonly pump: GainNode;
  private readonly bus: Record<"keys" | "pad" | "arp" | "lead" | "bass" | "drums" | "snare", GainNode>;

  constructor(
    private readonly ctx: BaseAudioContext,
    destination: AudioNode,
  ) {
    const { noise, room } = buffers(ctx);
    this.noise = noise;
    // FM at a 1:1 ratio makes a DC offset; nobody can hear below 30 Hz anyway
    const out = ctx.createBiquadFilter();
    out.type = "highpass";
    out.frequency.value = 30;
    out.connect(destination);
    const gain = (value: number, to?: AudioNode) => {
      const g = ctx.createGain();
      g.gain.value = value;
      if (to) g.connect(to);
      return g;
    };

    // Reverb and echo returns
    const reverb = ctx.createConvolver();
    reverb.buffer = room;
    const reverbTone = ctx.createBiquadFilter();
    reverbTone.type = "lowpass";
    reverbTone.frequency.value = 4500;
    reverb.connect(reverbTone);
    reverbTone.connect(gain(0.5, out));
    const echo = ctx.createDelay(1);
    echo.delayTime.value = STEP * 3;
    const echoTone = ctx.createBiquadFilter();
    echoTone.type = "lowpass";
    echoTone.frequency.value = 2200;
    echo.connect(echoTone);
    echoTone.connect(gain(0.3, echo));
    echoTone.connect(gain(0.22, out));

    this.pump = gain(1, out);
    const withSends = (level: number, dest: AudioNode, wet: number, delay = 0) => {
      const g = gain(level, dest);
      if (wet) g.connect(gain(wet, reverb));
      if (delay) g.connect(gain(delay, echo));
      return g;
    };
    this.bus = {
      keys: withSends(1, this.pump, 0.28),
      pad: withSends(1, this.pump, 0.4),
      arp: withSends(1, this.pump, 0.18, 0.2),
      lead: withSends(1, out, 0.3, 0.28),
      bass: withSends(1, out, 0),
      drums: withSends(1, out, 0),
      snare: withSends(1, out, 0.22),
    };
  }

  /** Attack, decay to sustain, release at `end` */
  private env(t: number, end: number, peak: number, sustain: number, decay: number, release: number) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.006);
    g.gain.setTargetAtTime(peak * sustain, t + 0.006, decay);
    g.gain.setTargetAtTime(0, end, release);
    return g;
  }

  /** Two-operator FM voice: ratio 1 sounds like an electric piano, ratio 3.5 like a bell */
  private fm(t: number, midi: number, length: number, gain: number, ratio: number, index: number, dest: AudioNode, decay = 0.5) {
    const { ctx } = this;
    const f = hz(midi);
    const carrier = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const depth = ctx.createGain();
    carrier.frequency.value = f;
    mod.frequency.value = f * ratio;
    depth.gain.setValueAtTime(f * index, t);
    depth.gain.setTargetAtTime(f * index * 0.2, t, 0.25);
    mod.connect(depth);
    depth.connect(carrier.frequency);
    const env = this.env(t, t + length, gain, 0.45, decay, 0.12);
    carrier.connect(env);
    env.connect(dest);
    const stop = t + length + 0.8;
    carrier.start(t);
    mod.start(t);
    carrier.stop(stop);
    mod.stop(stop);
  }

  keys(t: number, midi: number, length: number, gain = 0.08) {
    this.fm(t, midi, length, gain, 1, 2.1, this.bus.keys, 0.7);
  }

  bell(t: number, midi: number, length: number, gain = 0.11, dest: AudioNode = this.bus.lead) {
    this.fm(t, midi, length, gain, 3.5, 1.4, dest, 0.35);
  }

  /** Warm pad: two slightly detuned saws per note through one soft filter */
  pad(t: number, notes: readonly number[], length: number, gain = 0.016) {
    const { ctx } = this;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1400;
    filter.Q.value = 0.4;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(1, t + 0.5);
    env.gain.setTargetAtTime(0, t + length, 0.35);
    filter.connect(env);
    env.connect(this.bus.pad);
    for (const midi of notes) {
      for (const cents of [-7, 7]) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.value = hz(midi);
        osc.detune.value = cents;
        g.gain.value = gain;
        osc.connect(g);
        g.connect(filter);
        osc.start(t);
        osc.stop(t + length + 1.5);
      }
    }
  }

  bass(t: number, midi: number, length: number, gain = 0.11) {
    const { ctx } = this;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    const env = this.env(t, t + length, gain, 0.7, 0.25, 0.06);
    filter.connect(env);
    env.connect(this.bus.bass);
    for (const [type, level] of [["sine", 0.7], ["triangle", 0.8]] as const) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = hz(midi);
      g.gain.value = level;
      osc.connect(g);
      g.connect(filter);
      osc.start(t);
      osc.stop(t + length + 0.4);
    }
  }

  /** Short plucked triangle for arpeggios */
  pluck(t: number, midi: number, gain = 0.03) {
    const { ctx } = this;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = hz(midi);
    const env = this.env(t, t + 0.05, gain, 0.3, 0.05, 0.05);
    osc.connect(env);
    env.connect(this.bus.arp);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  private noiseHit(t: number, length: number, gain: number, type: BiquadFilterType, freq: number, dest: AudioNode, q = 0.7) {
    const { ctx } = this;
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const env = ctx.createGain();
    src.buffer = this.noise;
    src.loop = true;
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    env.gain.setValueAtTime(gain, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + length);
    src.connect(filter);
    filter.connect(env);
    env.connect(dest);
    src.start(t, jitter(t * 1000) * 0.5);
    src.stop(t + length + 0.05);
  }

  kick(t: number, gain = 0.36) {
    const { ctx } = this;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.frequency.setValueAtTime(115, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    env.gain.setValueAtTime(gain, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    osc.connect(env);
    env.connect(this.bus.drums);
    osc.start(t);
    osc.stop(t + 0.35);
    this.noiseHit(t, 0.01, gain * 0.35, "highpass", 3000, this.bus.drums);
    // Duck the keys and pad under the kick
    this.pump.gain.setValueAtTime(0.5, t);
    this.pump.gain.setTargetAtTime(1, t + 0.03, 0.1);
  }

  snare(t: number, gain = 0.3) {
    this.noiseHit(t, 0.17, gain, "bandpass", 1900, this.bus.snare, 0.8);
    const { ctx } = this;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.frequency.setValueAtTime(190, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.08);
    env.gain.setValueAtTime(gain * 0.6, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(env);
    env.connect(this.bus.snare);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  hat(t: number, gain = 0.1, open = false) {
    this.noiseHit(t, open ? 0.14 : 0.04, gain * 1.6, "highpass", 7000, this.bus.drums);
  }

  crash(t: number, gain = 0.14) {
    this.noiseHit(t, 2, gain, "highpass", 5000, this.bus.snare);
  }

  /** Rising noise sweep into a drop */
  riser(t: number, length: number, gain = 0.1) {
    const { ctx } = this;
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const env = ctx.createGain();
    src.buffer = this.noise;
    src.loop = true;
    filter.type = "bandpass";
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.exponentialRampToValueAtTime(7000, t + length);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(gain, t + length);
    env.gain.setTargetAtTime(0, t + length, 0.02);
    src.connect(filter);
    filter.connect(env);
    env.connect(this.bus.snare);
    src.start(t);
    src.stop(t + length + 0.2);
  }
}

/** Schedule one 16th note of the song. `step` counts from the start of the song. */
export function loopStep(kit: Kit, step: number, t: number, mix: Mix) {
  const bar = Math.floor(step / STEPS_PER_BAR);
  const s = step % STEPS_PER_BAR;
  const chord = CHORDS[bar % CHORDS.length];
  const has = (l: Layer) => mix.layers.includes(l);
  const full = mix.groove === "full";
  const swung = s % 2 ? t + SWING * STEP : t;
  const vel = 0.85 + 0.15 * jitter(step);

  if (has("pad") && s === 0) kit.pad(t, chord.keys, STEP * STEPS_PER_BAR);
  if (has("keys")) {
    for (const [at, len, v] of KEYS_HITS) {
      if (at === s) for (const midi of chord.keys) kit.keys(swung, midi, len * STEP, 0.08 * v * vel);
    }
  }
  if (has("bass")) {
    for (const [at, interval, len] of BASS_LINE) if (at === s) kit.bass(swung, chord.bass + interval, len * STEP * 0.9);
  }
  if (has("kick") && (full ? s % 4 === 0 : s === 0 || s === 10)) kit.kick(t);
  if (has("snare") && (full ? s === 4 || s === 12 : s === 8)) kit.snare(t);
  if (has("hat")) {
    if (full) kit.hat(swung, (s % 4 === 2 ? 0.1 : 0.06) * vel, s === 14);
    else if (s % 2 === 0) kit.hat(t, (s % 4 === 2 ? 0.09 : 0.055) * vel);
  }
  if (has("arp")) kit.pluck(swung, chord.keys[s % chord.keys.length] + (s < 8 ? 12 : 24), 0.05 * vel);
  if (has("lead")) {
    for (const [at, midi, len] of LEAD[bar % LEAD.length]) if (at === s) kit.bell(t, midi, len * STEP);
  }
}

/** The intro video's arrangement. Matches scripts/intro-video/trailer.html: 15 s, final hit at 12 s (bar 6). */
export const TRAILER_SECONDS = 15;
const TRAILER_HIT = 12;
const TRAILER_INTRO: Mix = { layers: ["keys", "pad", "lead"], groove: "half" };
const TRAILER_FULL: Mix = { layers: ALL_LAYERS, groove: "full" };

export function trailerStep(kit: Kit, step: number, t: number) {
  const hitStep = Math.round(TRAILER_HIT / STEP);
  if (step < hitStep) {
    const bar = Math.floor(step / STEPS_PER_BAR);
    const s = step % STEPS_PER_BAR;
    loopStep(kit, step, t, bar === 0 ? TRAILER_INTRO : TRAILER_FULL);
    // Build into the drop at 2 s, and into the final hit
    if (bar === 0 && s === 4) kit.riser(t, 12 * STEP);
    if (bar === 0 && s >= 12) kit.snare(t, 0.08 + (s - 12) * 0.04);
    if (step === hitStep - 16) kit.riser(t, 16 * STEP, 0.12);
    if (step >= hitStep - 8) kit.snare(t, 0.08 + (step - (hitStep - 8)) * 0.025);
  } else if (step === hitStep) {
    kit.kick(t, 1);
    kit.crash(t);
    kit.pad(t, FINAL.keys, 2.4, 0.02);
    for (const midi of FINAL.keys) kit.keys(t, midi, 2.4, 0.09);
    kit.bass(t, FINAL.bass + 12, 1.8, 0.18);
    [84, 88, 91, 95, 98].forEach((midi, i) => kit.bell(t + 0.25 + i * STEP * 1.5, midi, 0.6, 0.08));
  }
}

export type Sfx = "levelUp" | "coin" | "boing" | "fanfare";

export function playSfx(kit: Kit, name: Sfx, t: number) {
  switch (name) {
    case "levelUp":
      [72, 76, 79, 84].forEach((n, i) => kit.bell(t + i * 0.07, n, i === 3 ? 0.4 : 0.1, 0.09));
      break;
    case "coin":
      kit.bell(t, 83, 0.05, 0.06);
      kit.bell(t + 0.06, 88, 0.25, 0.06);
      break;
    case "boing":
      kit.pluck(t, 67, 0.08);
      kit.pluck(t + 0.08, 74, 0.08);
      kit.pluck(t + 0.16, 79, 0.08);
      break;
    case "fanfare":
      [72, 76, 79].forEach((n, i) => kit.bell(t + i * 0.1, n, 0.1, 0.09));
      kit.pad(t + 0.3, FINAL.keys, 1.4, 0.014);
      for (const midi of FINAL.keys) kit.keys(t + 0.3, midi, 1.4, 0.055);
      kit.bell(t + 0.3, 88, 1.2, 0.08);
      break;
  }
}

/** Runs a song step by step, a little ahead of the audio clock */
class Scheduler {
  private timer = 0;
  private nextTime = 0;
  private step = 0;

  constructor(
    private readonly ctx: AudioContext,
    private readonly play: (step: number, t: number) => void,
    private readonly endStep = Infinity,
  ) {}

  get running() {
    return this.timer !== 0;
  }

  start(fromStep: number, at: number) {
    this.stop();
    this.step = fromStep;
    this.nextTime = at;
    this.timer = window.setInterval(this.tick, 25);
    this.tick();
  }

  stop() {
    window.clearInterval(this.timer);
    this.timer = 0;
  }

  private tick = () => {
    const { ctx } = this;
    // Fell behind (slow device or throttled timer): skip ahead instead of firing a burst of notes
    if (this.nextTime < ctx.currentTime - 0.2) {
      const skip = Math.ceil((ctx.currentTime + 0.05 - this.nextTime) / STEP);
      this.step += skip;
      this.nextTime += skip * STEP;
    }
    while (this.nextTime < ctx.currentTime + 0.15 && this.step <= this.endStep) {
      this.play(this.step, this.nextTime);
      this.nextTime += STEP;
      this.step++;
    }
    if (this.step > this.endStep) this.stop();
  };
}

/** Background music and the intro video's soundtrack. One instance for the whole page. */
class Player {
  private ctx?: AudioContext;
  private out?: AudioNode;
  private musicGain?: GainNode;
  private sfxKit?: Kit;
  private loop?: Scheduler;
  private mix: Mix = LEVEL_MIX[1];
  private pending?: Mix;
  private trailer?: { scheduler: Scheduler; gain: GainNode };
  enabled = true;

  /** Call from a click or tap: browsers only allow sound after one */
  start() {
    if (!this.enabled || typeof window === "undefined") return;
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.knee.value = 10;
      comp.ratio.value = 3;
      comp.connect(ctx.destination);
      this.musicGain = ctx.createGain();
      this.musicGain.gain.value = 0;
      this.musicGain.connect(comp);
      const sfxGain = ctx.createGain();
      sfxGain.gain.value = SFX_VOLUME;
      sfxGain.connect(comp);
      this.sfxKit = new Kit(ctx, sfxGain);
      const kit = new Kit(ctx, this.musicGain);
      this.loop = new Scheduler(ctx, (step, t) => {
        if (step % STEPS_PER_BAR === 0 && this.pending) {
          this.mix = this.pending;
          this.pending = undefined;
        }
        loopStep(kit, step, t, this.mix);
      });
      this.ctx = ctx;
      this.out = comp;
      document.addEventListener("visibilitychange", this.onVisibility);
    }
    void this.ctx.resume();
    if (!this.loop?.running) this.loop?.start(0, this.ctx.currentTime + 0.08);
    this.fadeMusic();
  }

  stop() {
    this.loop?.stop();
    this.stopTrailer();
    void this.ctx?.suspend();
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (!on) this.stop();
  }

  /** Switches the mix at the next bar so it never cuts mid-phrase */
  setLevel(level: number) {
    const next = LEVEL_MIX[level] ?? LEVEL_MIX[1];
    if (next !== this.mix) this.pending = next;
  }

  /** The intro video's music, from `offset` seconds, in sync with the video. The background loop steps aside. */
  playTrailer(offset: number) {
    const { ctx, out } = this;
    if (!this.enabled || !ctx || !out || ctx.state !== "running") return;
    this.stopTrailer();
    const gain = ctx.createGain();
    gain.connect(out);
    const kit = new Kit(ctx, gain);
    const from = Math.ceil(offset / STEP - 0.001);
    const scheduler = new Scheduler(ctx, (step, t) => trailerStep(kit, step, t), Math.round(TRAILER_SECONDS / STEP));
    scheduler.start(from, ctx.currentTime + 0.02 + (from * STEP - offset));
    this.trailer = { scheduler, gain };
    this.fadeMusic();
  }

  stopTrailer() {
    const tr = this.trailer;
    if (!tr || !this.ctx) return;
    tr.scheduler.stop();
    tr.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.03);
    window.setTimeout(() => tr.gain.disconnect(), 400);
    this.trailer = undefined;
    this.fadeMusic();
  }

  sfx(name: Sfx) {
    if (!this.enabled || !this.ctx || !this.sfxKit || this.ctx.state !== "running") return;
    playSfx(this.sfxKit, name, this.ctx.currentTime + 0.01);
  }

  private fadeMusic() {
    if (!this.ctx || !this.musicGain) return;
    this.musicGain.gain.setTargetAtTime(this.trailer ? 0 : MUSIC_VOLUME, this.ctx.currentTime, 0.25);
  }

  /** Silence in background tabs */
  private onVisibility = () => {
    if (!this.ctx) return;
    if (document.hidden) void this.ctx.suspend();
    else if (this.enabled && this.loop?.running) void this.ctx.resume();
  };
}

export const music = new Player();
