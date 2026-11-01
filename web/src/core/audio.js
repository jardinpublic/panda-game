// Synthesised sound effects and a light looping groove, no audio files.
// Browsers only allow sound after a user gesture: call unlock() from one.

let ctx = null;
let master = null;
let musicTimer = null;
let muted = false;

export function unlock() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

export function setMuted(value) {
  muted = value;
  if (master) master.gain.value = muted ? 0 : 0.5;
}

export function isMuted() {
  return muted;
}

function tone(freqFrom, freqTo, duration, type = 'square', volume = 0.25, delay = 0) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqFrom, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqTo), t0 + duration);
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(gain).connect(master);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function noise(duration, volume = 0.3, filterHz = 1200) {
  if (!ctx || muted) return;
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  filter.type = 'lowpass';
  filter.frequency.value = filterHz;
  gain.gain.value = volume;
  src.buffer = buffer;
  src.connect(filter).connect(gain).connect(master);
  src.start();
}

/** Named effects shared by every world. */
export const sfx = {
  coin: () => { tone(988, 1320, 0.08, 'square', 0.12); tone(1320, 1760, 0.12, 'square', 0.1, 0.06); },
  jump: () => tone(300, 700, 0.18, 'triangle', 0.25),
  land: () => noise(0.08, 0.15, 600),
  hit: () => { noise(0.18, 0.4, 900); tone(200, 60, 0.25, 'sawtooth', 0.2); },
  whoosh: () => noise(0.15, 0.2, 3000),
  power: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, f * 1.01, 0.12, 'square', 0.12, i * 0.07)); },
  win: () => { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, f, 0.2, 'triangle', 0.2, i * 0.1)); },
  lose: () => { [392, 330, 262, 196].forEach((f, i) => tone(f, f * 0.98, 0.25, 'sawtooth', 0.15, i * 0.15)); },
  click: () => tone(800, 600, 0.05, 'square', 0.1),
  hoho: () => { tone(220, 180, 0.18, 'sawtooth', 0.25); tone(220, 180, 0.18, 'sawtooth', 0.25, 0.22); },
  beat: () => tone(90, 50, 0.12, 'sine', 0.5),
  hat: () => noise(0.04, 0.08, 8000),
  note: (f) => tone(f, f, 0.18, 'triangle', 0.2),
};

/** Starts a simple groove at bpm (zouk-ish kick and hats). Stops any previous one. */
export function startMusic(bpm = 110, melody = [0, 4, 7, 4, 9, 7, 4, 2]) {
  stopMusic();
  if (!ctx) return;
  const beat = 60 / bpm;
  let step = 0;
  const base = 262;
  musicTimer = setInterval(() => {
    if (muted) return;
    if (step % 4 === 0 || step % 8 === 3) sfx.beat();
    if (step % 2 === 1) sfx.hat();
    if (step % 2 === 0) tone(base * Math.pow(2, melody[(step / 2) % melody.length] / 12), base, beat * 0.9, 'triangle', 0.05);
    step++;
  }, (beat * 1000) / 2);
}

export function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
}
