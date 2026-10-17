/**
 * GDG Quest soundtrack: an original chiptune written in code with the Web Audio API.
 * Nothing to download, loops without gaps, and the arrangement changes with the level.
 * scripts/intro-video renders the intro video's audio from this same song.
 */

export const BPM = 120;
/** One 16th note, in seconds */
export const STEP = 60 / BPM / 4;
export const STEPS_PER_BAR = 16;

/** Volume of the background loop on the site (sound effects sit a bit above it) */
const MUSIC_VOLUME = 0.3;
const SFX_VOLUME = 0.45;

/** C, G, Am, F: one chord per bar */
const CHORDS: ReadonlyArray<readonly [number, number, number]> = [
  [60, 64, 67],
  [67, 71, 74],
  [69, 72, 76],
  [65, 69, 72],
];
const BASS_ROOTS = [48, 43, 45, 41];

/** [step in bar, MIDI note, length in steps]. 8 bars: the hook, then the answer */
type Note = readonly [number, number, number];
const LEAD: ReadonlyArray<ReadonlyArray<Note>> = [
  [[0, 76, 2], [2, 79, 2], [4, 84, 3], [7, 83, 1], [8, 81, 2], [10, 79, 2], [12, 76, 4]],
  [[0, 74, 2], [2, 79, 2], [4, 83, 3], [7, 81, 1], [8, 79, 2], [10, 74, 2], [12, 79, 4]],
  [[0, 84, 2], [2, 83, 2], [4, 81, 3], [7, 76, 1], [8, 81, 2], [10, 84, 2], [12, 88, 4]],
  [[0, 86, 2], [2, 84, 2], [4, 81, 3], [7, 77, 1], [8, 79, 2], [10, 81, 2], [12, 79, 4]],
  [[0, 79, 1], [1, 79, 1], [3, 84, 2], [5, 79, 2], [7, 76, 1], [8, 79, 2], [10, 84, 2], [12, 86, 2], [14, 88, 2]],
  [[0, 86, 3], [3, 83, 3], [6, 79, 2], [8, 86, 3], [11, 83, 2], [13, 79, 1], [14, 81, 1], [15, 83, 1]],
  [[0, 84, 3], [3, 81, 3], [6, 76, 2], [8, 84, 3], [11, 81, 2], [13, 88, 3]],
  [[0, 81, 2], [2, 84, 2], [4, 89, 2], [6, 88, 2], [8, 86, 2], [10, 84, 2], [12, 81, 2], [14, 79, 2]],
];

export type Layer = "bass" | "arp" | "hat" | "kick" | "snare" | "lead";
export const ALL_LAYERS: readonly Layer[] = ["bass", "arp", "hat", "kick", "snare", "lead"];

/** What plays on each level: calm while typing, full power for the Boss Check and after submitting (8) */
export const LEVEL_LAYERS: Record<number, readonly Layer[]> = {
  1: ["bass", "arp", "hat", "lead"],
  2: ["bass", "arp", "hat", "lead"],
  3: ["bass", "arp", "hat"],
  4: ["bass", "arp", "hat", "lead"],
  5: ["bass", "arp", "hat"],
  6: ALL_LAYERS,
  7: ["bass", "arp", "hat", "kick", "lead"],
  8: ALL_LAYERS,
};

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

type ToneOptions = {
  /** Pulse width: 0.5 is a square wave, smaller is thinner */
  duty?: number;
  gain?: number;
  cutoff?: number;
  dest?: AudioNode;
  /** Glide to this note over the length of the tone */
  slideTo?: number;
};

/** Instruments for one audio context (live or offline) */
export class Kit {
  private readonly noise: AudioBuffer;
  private readonly waves = new Map<number, PeriodicWave>();
  /** Lead bus with a dotted-8th echo */
  readonly lead: AudioNode;

  constructor(
    private readonly ctx: BaseAudioContext,
    private readonly out: AudioNode,
  ) {
    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const bus = ctx.createGain();
    const delay = ctx.createDelay(1);
    const feedback = ctx.createGain();
    const wet = ctx.createGain();
    const tone = ctx.createBiquadFilter();
    delay.delayTime.value = STEP * 3;
    feedback.gain.value = 0.28;
    wet.gain.value = 0.22;
    tone.type = "lowpass";
    tone.frequency.value = 2400;
    bus.connect(out);
    bus.connect(delay);
    delay.connect(tone);
    tone.connect(feedback);
    feedback.connect(delay);
    tone.connect(wet);
    wet.connect(out);
    this.lead = bus;
  }

  /** Band-limited pulse wave (softer than a raw square) */
  private pulse(duty: number): PeriodicWave {
    let wave = this.waves.get(duty);
    if (!wave) {
      const n = 40;
      const real = new Float32Array(n);
      const imag = new Float32Array(n);
      for (let k = 1; k < n; k++) real[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
      wave = this.ctx.createPeriodicWave(real, imag);
      this.waves.set(duty, wave);
    }
    return wave;
  }

  tone(t: number, midi: number, length: number, { duty = 0.5, gain = 0.1, cutoff = 4000, dest, slideTo }: ToneOptions = {}) {
    const { ctx } = this;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const env = ctx.createGain();
    osc.setPeriodicWave(this.pulse(duty));
    osc.frequency.setValueAtTime(hz(midi), t);
    if (slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(hz(slideTo), t + length);
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(gain, t + 0.005);
    env.gain.setTargetAtTime(gain * 0.6, t + 0.005, 0.08);
    env.gain.setTargetAtTime(0, t + length, 0.025);
    osc.connect(filter);
    filter.connect(env);
    env.connect(dest ?? this.out);
    osc.start(t);
    osc.stop(t + length + 0.2);
  }

  private burst(t: number, length: number, gain: number, type: BiquadFilterType, freq: number, dest?: AudioNode) {
    const { ctx } = this;
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const env = ctx.createGain();
    src.buffer = this.noise;
    src.loop = true;
    filter.type = type;
    filter.frequency.value = freq;
    env.gain.setValueAtTime(gain, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + length);
    src.connect(filter);
    filter.connect(env);
    env.connect(dest ?? this.out);
    src.start(t, Math.random() * 0.5);
    src.stop(t + length + 0.05);
  }

  kick(t: number, gain = 0.9) {
    const { ctx } = this;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(48, t + 0.12);
    env.gain.setValueAtTime(gain, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(env);
    env.connect(this.out);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  snare(t: number, gain = 0.35) {
    this.burst(t, 0.14, gain, "bandpass", 1800);
    this.tone(t, 54, 0.05, { duty: 0.5, gain: gain * 0.5, cutoff: 1200 });
  }

  hat(t: number, open = false, gain = 0.1) {
    this.burst(t, open ? 0.09 : 0.03, open ? gain * 0.7 : gain, "highpass", 7500);
  }

  crash(t: number, gain = 0.22) {
    this.burst(t, 1.6, gain, "highpass", 4000);
  }
}

/** Schedule one 16th note of the song. `step` counts from the start of the song. */
export function playStep(kit: Kit, step: number, t: number, layers: readonly Layer[]) {
  const bar = Math.floor(step / STEPS_PER_BAR);
  const s = step % STEPS_PER_BAR;
  const chord = CHORDS[bar % 4];
  const has = (l: Layer) => layers.includes(l);

  if (has("bass") && s % 2 === 0) {
    kit.tone(t, BASS_ROOTS[bar % 4] + (s % 4 === 2 ? 12 : 0), STEP * 1.6, { duty: 0.5, gain: 0.2, cutoff: 800 });
  }
  if (has("arp")) {
    const note = [chord[0], chord[1], chord[2], chord[0] + 12][s % 4] + 12;
    kit.tone(t, note, STEP * 0.9, { duty: 0.125, gain: 0.035, cutoff: 3500 });
  }
  if (has("hat") && s % 2 === 0) kit.hat(t, s % 4 === 2);
  if (has("kick") && s % 4 === 0) kit.kick(t);
  if (has("snare") && (s === 4 || s === 12)) kit.snare(t);
  if (has("lead")) {
    for (const [at, midi, len] of LEAD[bar % LEAD.length]) {
      if (at === s) kit.tone(t, midi, len * STEP * 0.92, { duty: 0.25, gain: 0.085, cutoff: 3800, dest: kit.lead });
    }
  }
}

export type Sfx = "levelUp" | "coin" | "boing" | "fanfare";

export function playSfx(kit: Kit, name: Sfx, t: number, dest?: AudioNode) {
  const o = { duty: 0.25, gain: 0.12, dest };
  switch (name) {
    case "levelUp":
      [72, 76, 79, 84].forEach((n, i) => kit.tone(t + i * 0.07, n, i === 3 ? 0.25 : 0.08, o));
      break;
    case "coin":
      kit.tone(t, 83, 0.06, { ...o, duty: 0.5, gain: 0.07 });
      kit.tone(t + 0.06, 88, 0.2, { ...o, duty: 0.5, gain: 0.07 });
      break;
    case "boing":
      kit.tone(t, 60, 0.18, { ...o, duty: 0.5, gain: 0.1, slideTo: 79 });
      break;
    case "fanfare":
      [67, 72, 76].forEach((n, i) => kit.tone(t + i * 0.1, n, 0.09, o));
      [72, 76, 79, 84].forEach((n) => kit.tone(t + 0.32, n, 1.1, { ...o, gain: 0.07 }));
      break;
  }
}

/** Background music for the quest. One instance for the whole page. */
class Player {
  private ctx?: AudioContext;
  private kit?: Kit;
  private musicGain?: GainNode;
  private sfxGain?: GainNode;
  private timer = 0;
  private nextTime = 0;
  private step = 0;
  private layers: readonly Layer[] = LEVEL_LAYERS[1];
  private pending?: readonly Layer[];
  private ducked = false;
  enabled = true;

  /** Call from a click or tap: browsers only allow sound after one */
  start() {
    if (!this.enabled || typeof window === "undefined") return;
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const comp = ctx.createDynamicsCompressor();
      comp.connect(ctx.destination);
      this.musicGain = ctx.createGain();
      this.musicGain.gain.value = 0;
      this.musicGain.connect(comp);
      this.sfxGain = ctx.createGain();
      this.sfxGain.gain.value = SFX_VOLUME;
      this.sfxGain.connect(comp);
      this.kit = new Kit(ctx, this.musicGain);
      this.ctx = ctx;
      document.addEventListener("visibilitychange", this.onVisibility);
    }
    void this.ctx.resume();
    if (!this.timer) {
      this.nextTime = this.ctx.currentTime + 0.08;
      this.timer = window.setInterval(this.tick, 25);
    }
    this.applyVolume();
  }

  stop() {
    window.clearInterval(this.timer);
    this.timer = 0;
    void this.ctx?.suspend();
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (!on) this.stop();
  }

  /** Switches the arrangement at the next bar so it never cuts mid-phrase */
  setLevel(level: number) {
    const next = LEVEL_LAYERS[level] ?? LEVEL_LAYERS[1];
    if (next !== this.layers) this.pending = next;
  }

  /** Fade the music out while something else (the intro video) plays sound */
  duck(on: boolean) {
    this.ducked = on;
    this.applyVolume();
  }

  sfx(name: Sfx) {
    if (!this.enabled || !this.ctx || !this.kit || this.ctx.state !== "running") return;
    playSfx(this.kit, name, this.ctx.currentTime + 0.01, this.sfxGain);
  }

  private applyVolume() {
    if (!this.ctx || !this.musicGain) return;
    this.musicGain.gain.setTargetAtTime(this.ducked ? 0 : MUSIC_VOLUME, this.ctx.currentTime, 0.2);
  }

  private tick = () => {
    const { ctx, kit } = this;
    if (!ctx || !kit) return;
    // Fell behind (slow device or throttled timer): skip ahead instead of firing a burst of notes
    if (this.nextTime < ctx.currentTime - 0.2) this.nextTime = ctx.currentTime + 0.05;
    while (this.nextTime < ctx.currentTime + 0.15) {
      if (this.step % STEPS_PER_BAR === 0 && this.pending) {
        this.layers = this.pending;
        this.pending = undefined;
      }
      playStep(kit, this.step, this.nextTime, this.layers);
      this.nextTime += STEP;
      this.step++;
    }
  };

  /** Silence in background tabs */
  private onVisibility = () => {
    if (!this.ctx) return;
    if (document.hidden) void this.ctx.suspend();
    else if (this.enabled && this.timer) void this.ctx.resume();
  };
}

export const music = new Player();
