// Caribbean sound kit, all synthesised: steel pan, marimba, ti-bwa woodblock,
// shaker, kick, bass and a zouk groove whose tempo follows the game speed.
// No square or sawtooth bleeps: soft sines, filtered noise and a light reverb.
// Browsers only allow sound after a user gesture: call unlock() from one.

let ac = null;
let out = null; // dry bus
let wet = null; // reverb send
let muted = false;
const VOLUME = 0.7;

export function unlock() {
  if (typeof window === 'undefined') return;
  if (!ac) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    ac = new Ctx();
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 4;
    const master = ac.createGain();
    master.gain.value = muted ? 0 : VOLUME;
    master.connect(comp);
    comp.connect(ac.destination);
    out = ac.createGain();
    out.connect(master);
    const verb = ac.createConvolver();
    verb.buffer = impulse(1.8);
    wet = ac.createGain();
    wet.gain.value = 0.22;
    wet.connect(verb);
    verb.connect(master);
    out._master = master;
  }
  if (ac.state === 'suspended') ac.resume();
}

export function setMuted(value) {
  muted = value;
  if (out) out._master.gain.value = muted ? 0 : VOLUME;
}

export function isMuted() {
  return muted;
}

function impulse(seconds) {
  const len = Math.floor(ac.sampleRate * seconds);
  const buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  return buf;
}

/** a.connect(b).connect(c) without relying on connect() returning its target (old Safari). */
function chain(...nodes) {
  for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]);
}

const now = () => (ac ? ac.currentTime : 0);
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

/** One decaying sine partial into the dry bus and the reverb. */
function partial(freq, t, gain, decay, { glide = 1, send = 1, type = 'sine' } = {}) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (glide !== 1) o.frequency.exponentialRampToValueAtTime(freq * glide, t + decay);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  o.connect(g);
  g.connect(out);
  if (send) {
    const s = ac.createGain();
    s.gain.value = send;
    chain(g, s, wet);
  }
  o.start(t);
  o.stop(t + decay + 0.05);
}

/** Steel pan note: fundamental, octave, twelfth and a slightly sharp metallic partial. */
function pan(note, t = now(), vol = 0.18, length = 1) {
  if (!ac || muted) return;
  const f = midi(note);
  partial(f, t, vol, 1.1 * length);
  partial(f * 2.0, t, vol * 0.55, 0.55 * length);
  partial(f * 3.0, t, vol * 0.22, 0.3 * length);
  partial(f * 4.18, t, vol * 0.1, 0.12 * length);
}

/** Marimba note: warm and short. */
function marimba(note, t = now(), vol = 0.2) {
  if (!ac || muted) return;
  const f = midi(note);
  partial(f, t, vol, 0.45, { send: 0.5 });
  partial(f * 3.93, t, vol * 0.35, 0.07, { send: 0.3 });
}

function noise(t, length, vol, { type = 'highpass', freq = 6000, q = 0.7, sweepTo = 0 } = {}) {
  if (!ac || muted) return;
  const buf = ac.createBuffer(1, Math.max(1, Math.floor(ac.sampleRate * length)), ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  const f = ac.createBiquadFilter();
  const g = ac.createGain();
  src.buffer = buf;
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + length);
  f.Q.value = q;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + length);
  chain(src, f, g, out);
  src.start(t);
}

function kick(t, vol = 0.55) {
  if (!ac || muted) return;
  partial(140, t, vol, 0.28, { glide: 0.3, send: 0 });
}
function tibwa(t, vol = 0.12) {
  if (!ac || muted) return;
  partial(1650, t, vol, 0.045, { send: 0.2, type: 'triangle' });
  partial(2480, t, vol * 0.4, 0.03, { send: 0 });
}
function shaker(t, vol = 0.05) {
  noise(t, 0.05, vol, { freq: 7000 });
}
function rim(t, vol = 0.12) {
  noise(t, 0.09, vol, { type: 'bandpass', freq: 2200, q: 1.2 });
  partial(380, t, vol * 0.6, 0.05, { send: 0.2 });
}
function bass(note, t, length, vol = 0.32) {
  if (!ac || muted) return;
  const o = ac.createOscillator();
  const lp = ac.createBiquadFilter();
  const g = ac.createGain();
  o.type = 'triangle';
  o.frequency.value = midi(note);
  lp.type = 'lowpass';
  lp.frequency.value = 420;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + length);
  chain(o, lp, g, out);
  o.start(t);
  o.stop(t + length + 0.05);
}

/** A sung "ho": a soft buzz through the two formants of the vowel O. */
function ho(t, pitch = 150, vol = 0.22) {
  if (!ac || muted) return;
  const o = ac.createOscillator();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(pitch * 1.06, t);
  o.frequency.exponentialRampToValueAtTime(pitch * 0.92, t + 0.2);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  for (const [freq, q, level] of [[460, 9, 1], [820, 11, 0.5], [2800, 6, 0.05]]) {
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = q;
    const lg = ac.createGain();
    lg.gain.value = level * 2.4;
    chain(o, bp, lg, g);
  }
  g.connect(out);
  const s = ac.createGain();
  s.gain.value = 0.4;
  chain(g, s, wet);
  o.start(t);
  o.stop(t + 0.3);
}

const arp = (notes, step, fn = pan, vol) => notes.forEach((n, i) => fn(n, now() + i * step, vol));

/** Named effects. Every call is safe before unlock() (it does nothing). */
export const sfx = {
  tap: () => marimba(84, now(), 0.16),
  pop: () => ac && partial(900, now(), 0.2, 0.12, { glide: 0.4, send: 0.3 }),
  good: () => arp([72, 76, 79, 84], 0.055, pan, 0.16),
  bad: () => { if (!ac) return; marimba(50, now(), 0.3); arp([67, 63, 60], 0.09, pan, 0.12); },
  coin: () => { pan(88, now(), 0.1, 0.5); pan(93, now() + 0.07, 0.1, 0.6); },
  whoosh: () => noise(now(), 0.22, 0.18, { type: 'bandpass', freq: 600, q: 1.4, sweepTo: 4000 }),
  splash: () => { noise(now(), 0.4, 0.25, { type: 'lowpass', freq: 2500, sweepTo: 300 }); },
  hit: () => { kick(now(), 0.6); noise(now(), 0.12, 0.2, { type: 'lowpass', freq: 1500 }); },
  sizzle: () => noise(now(), 0.5, 0.06, { freq: 4000 }),
  tick: (urgent = false) => tibwa(now(), urgent ? 0.2 : 0.12),
  speedup: () => arp([60, 64, 67, 72, 76, 79, 84], 0.045, pan, 0.14),
  boss: () => { for (let i = 0; i < 8; i++) kick(now() + i * 0.09, 0.25 + i * 0.05); arp([48, 51, 55], 0.24, pan, 0.2); },
  life: () => arp([79, 83, 86, 91], 0.06, pan, 0.14),
  over: () => arp([72, 67, 64, 60, 55], 0.13, pan, 0.15),
  best: () => { arp([72, 76, 79, 84, 88, 91], 0.07, pan, 0.15); [60, 64, 67].forEach((n) => pan(n, now() + 0.45, 0.12, 1.5)); },
  hoho: () => { if (!ac) return; ho(now(), 150); ho(now() + 0.24, 138); },
  click: () => marimba(79, now(), 0.12),
};

// ---- Zouk groove ---------------------------------------------------------------
// 16 steps per bar. Kick on the beats, ti-bwa in 3-3-2, rim on 2 and 4,
// bass on the tresillo, steel-pan chord stabs on the off-beats, a lazy lead.

const CHORDS = [
  [60, 64, 67], // C
  [57, 60, 64], // Am
  [53, 57, 60], // F
  [55, 59, 62], // G
];
const LEAD = [72, 74, 76, 79, 81, 84];
let groove = null;

/** Starts (or retunes) the groove. intensity 0..1 adds layers. */
export function startGroove(bpm = 104, intensity = 0.5) {
  if (!ac) return;
  if (groove) {
    groove.bpm = bpm;
    groove.intensity = intensity;
    return;
  }
  groove = { bpm, intensity, step: 0, next: now() + 0.05, timer: null };
  groove.timer = setInterval(scheduleGroove, 25);
}

export function setGroove(bpm, intensity) {
  if (groove) {
    groove.bpm = bpm;
    if (intensity != null) groove.intensity = intensity;
  }
}

export function stopGroove() {
  if (groove) clearInterval(groove.timer);
  groove = null;
}

function scheduleGroove() {
  if (!groove || !ac) return;
  while (groove.next < now() + 0.12) {
    const s = groove.step % 16;
    const bar = Math.floor(groove.step / 16);
    const t = groove.next;
    if (!muted) playStep(s, bar, t, groove.intensity, 60 / groove.bpm / 4);
    groove.next += 60 / groove.bpm / 4;
    groove.step++;
  }
}

function playStep(s, bar, t, k, dur16) {
  const chord = CHORDS[bar % 4];
  if (s % 4 === 0) kick(t, s === 0 ? 0.5 : 0.36);
  if ([0, 3, 6, 8, 11, 14].includes(s)) tibwa(t, 0.08 + k * 0.05);
  shaker(t, s % 2 ? 0.035 : 0.02 + k * 0.02);
  if (s === 4 || s === 12) rim(t, 0.07 + k * 0.05);
  if ([0, 3, 6, 8, 11].includes(s)) bass(chord[0] - 24, t, dur16 * 2.5);
  if (s === 14) bass(chord[2] - 24, t, dur16 * 1.6);
  if (s === 2 || s === 6 || s === 10 || s === 14) chord.forEach((n) => pan(n + 12, t, 0.035 + k * 0.02, 0.35));
  if (k > 0.35 && (s === 7 || s === 15 || (k > 0.7 && s === 3)) && (bar + s) % 3 !== 0) {
    pan(LEAD[(bar * 7 + s * 3) % LEAD.length], t, 0.06, 0.7);
  }
}
