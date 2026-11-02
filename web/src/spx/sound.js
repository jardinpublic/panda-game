/*
 * 103 RCX sounds, all synthesised (no samples, no chiptune bleeps): the
 * two-stroke engine that follows the speed, the French "pin-pon" siren, a
 * shout, Pépé Gogol's mumbling and the knocks. Its own AudioContext, created on
 * the first tap (browsers need a gesture).
 */

export function createSound({ muted = false } = {}) {
  let ac = null;
  let master = null;
  let engine = null;
  let siren = null;
  let voice = null;

  function ensure() {
    if (muted || typeof window === 'undefined') return null;
    if (!ac) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      ac = new Ctx();
      const comp = ac.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      master = ac.createGain();
      master.gain.value = 0.8;
      master.connect(comp);
      comp.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }

  const now = () => ac.currentTime;

  function noiseBuffer(seconds = 1) {
    const len = Math.floor(ac.sampleRate * seconds);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function noise(t, dur, vol, { type = 'bandpass', freq = 1000, q = 1, sweepTo } = {}) {
    const src = ac.createBufferSource();
    src.buffer = noiseBuffer(dur + 0.05);
    const f = ac.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    f.Q.value = q;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  function tone(t, freq, dur, vol, { type = 'sine', glide, attack = 0.005 } = {}) {
    const o = ac.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  /* ---- The 103's engine: a buzzing firing note, a raspy filtered noise, a soft clip ---- */
  function startEngine() {
    if (!ensure() || engine) return;
    const fire = ac.createOscillator();
    fire.type = 'sawtooth';
    const sub = ac.createOscillator();
    sub.type = 'triangle';
    const clip = ac.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      curve[i] = Math.tanh(x * 2.6);
    }
    clip.curve = curve;
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 2.5;
    const rasp = ac.createBufferSource();
    rasp.buffer = noiseBuffer(2);
    rasp.loop = true;
    const raspF = ac.createBiquadFilter();
    raspF.type = 'bandpass';
    raspF.Q.value = 3;
    const raspG = ac.createGain();
    raspG.gain.value = 0.25;
    const g = ac.createGain();
    g.gain.value = 0.0001;
    fire.connect(clip);
    sub.connect(clip);
    clip.connect(lp);
    rasp.connect(raspF);
    raspF.connect(raspG);
    raspG.connect(lp);
    lp.connect(g);
    g.connect(master);
    fire.start();
    sub.start();
    rasp.start();
    engine = { fire, sub, lp, raspF, g, rasp };
    setEngine(0, false);
  }

  /** speed in m/s; boost revs it higher. */
  function setEngine(speed, boost) {
    if (!engine) return;
    const t = now();
    const f = 32 + speed * 5.2 + (boost ? 22 : 0);
    engine.fire.frequency.setTargetAtTime(f, t, 0.08);
    engine.sub.frequency.setTargetAtTime(f / 2, t, 0.08);
    engine.lp.frequency.setTargetAtTime(420 + speed * 85 + (boost ? 600 : 0), t, 0.1);
    engine.raspF.frequency.setTargetAtTime(900 + speed * 120, t, 0.1);
    engine.g.gain.setTargetAtTime(speed > 0.2 ? 0.075 : 0.045, t, 0.15);
  }

  function stopEngine() {
    if (!engine) return;
    const e = engine;
    engine = null;
    e.g.gain.setTargetAtTime(0.0001, now(), 0.1);
    setTimeout(() => {
      try {
        e.fire.stop();
        e.sub.stop();
        e.rasp.stop();
      } catch {
        // already stopped
      }
    }, 400);
  }

  /* ---- Pin-pon ---- */
  function setSiren(on, closeness = 0.5) {
    if (on && !ensure()) return;
    if (!on) {
      if (siren) {
        clearInterval(siren.timer);
        siren.g.gain.setTargetAtTime(0.0001, now(), 0.1);
        const s = siren;
        setTimeout(() => s.o.stop(), 400);
        siren = null;
      }
      return;
    }
    if (!siren) {
      const o = ac.createOscillator();
      o.type = 'triangle';
      const f = ac.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 2200;
      const g = ac.createGain();
      g.gain.value = 0.0001;
      o.connect(f);
      f.connect(g);
      g.connect(master);
      o.start();
      let hi = false;
      siren = { o, g, timer: 0, vol: 0.05 };
      const flip = () => {
        hi = !hi;
        o.frequency.setValueAtTime(hi ? 580 : 435, now());
      };
      flip();
      siren.timer = setInterval(flip, 480);
    }
    siren.g.gain.setTargetAtTime(0.02 + 0.06 * closeness, now(), 0.2);
  }

  /* ---- The shout: a held "oooo", vowel formants over a voice buzz ---- */
  function startVoice() {
    if (!ensure() || voice) return;
    const o = ac.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = 240;
    const vib = ac.createOscillator();
    vib.frequency.value = 5.5;
    const vibG = ac.createGain();
    vibG.gain.value = 6;
    vib.connect(vibG);
    vibG.connect(o.frequency);
    const g = ac.createGain();
    g.gain.value = 0.0001;
    const f1 = ac.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.value = 480;
    f1.Q.value = 6;
    const f2 = ac.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.value = 850;
    f2.Q.value = 8;
    o.connect(f1);
    o.connect(f2);
    f1.connect(g);
    f2.connect(g);
    g.connect(master);
    o.start();
    vib.start();
    g.gain.setTargetAtTime(0.5, now(), 0.04);
    o.frequency.setTargetAtTime(300, now(), 1.2);
    voice = { o, vib, g };
  }

  function stopVoice() {
    if (!voice) return;
    const v = voice;
    voice = null;
    v.g.gain.setTargetAtTime(0.0001, now(), 0.05);
    v.o.frequency.setTargetAtTime(180, now(), 0.1);
    setTimeout(() => {
      v.o.stop();
      v.vib.stop();
    }, 300);
  }

  /** Mumbled syllables, Pépé Gogol style. */
  function gibberish() {
    let t = now();
    for (let i = 0; i < 9; i++) {
      const o = ac.createOscillator();
      o.type = 'sawtooth';
      const base = 150 + Math.random() * 90;
      o.frequency.setValueAtTime(base, t);
      o.frequency.linearRampToValueAtTime(base * (0.8 + Math.random() * 0.5), t + 0.12);
      const f = ac.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 400 + Math.random() * 900;
      f.Q.value = 5;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
      o.connect(f);
      f.connect(g);
      g.connect(master);
      o.start(t);
      o.stop(t + 0.16);
      t += 0.1 + Math.random() * 0.08;
    }
  }

  const effects = {
    pedal: () => {
      noise(now(), 0.05, 0.25, { freq: 3000, q: 4 });
      tone(now(), 120 + Math.random() * 40, 0.08, 0.08, { type: 'triangle' });
    },
    start: () => {
      startEngine();
      noise(now(), 0.5, 0.3, { type: 'lowpass', freq: 600, sweepTo: 2400 });
    },
    jump: () => noise(now(), 0.25, 0.18, { freq: 700, q: 1.5, sweepTo: 3000 }),
    crash: () => {
      noise(now(), 0.6, 0.6, { type: 'lowpass', freq: 3000, sweepTo: 200 });
      tone(now(), 90, 0.4, 0.4, { glide: 40 });
      [523, 811, 1307].forEach((f, i) => tone(now() + 0.02 * i, f, 0.5, 0.06));
    },
    bump: () => tone(now(), 110, 0.25, 0.4, { glide: 60 }),
    horn: () => {
      tone(now(), 370, 0.45, 0.06, { type: 'sawtooth' });
      tone(now(), 466, 0.45, 0.05, { type: 'sawtooth' });
    },
    can: () => {
      noise(now(), 0.3, 0.3, { type: 'highpass', freq: 3500 });
      tone(now() + 0.05, 1760, 0.2, 0.08);
      tone(now() + 0.11, 2349, 0.25, 0.07);
    },
    throw: () => noise(now(), 0.3, 0.08, { freq: 1500, sweepTo: 500 }),
    pickup: () => [660, 880, 1320].forEach((f, i) => tone(now() + i * 0.06, f, 0.2, 0.08)),
    // A cigarette: a soft bell, higher with the combo
    clope: (mult = 1) => {
      const f = 880 * Math.pow(2, (Math.min(5, mult) - 1) * (2 / 12));
      tone(now(), f, 0.18, 0.06, { type: 'triangle' });
      tone(now() + 0.05, f * 1.5, 0.22, 0.04);
    },
    // A car flashing past
    whoosh: () => noise(now(), 0.4, 0.22, { freq: 500, q: 0.8, sweepTo: 2400 }),
    turbo: () => {
      noise(now(), 0.8, 0.25, { type: 'lowpass', freq: 400, sweepTo: 3600 });
      [523, 784, 1047].forEach((f, i) => tone(now() + i * 0.07, f, 0.3, 0.06, { type: 'triangle' }));
    },
    push: () => noise(now(), 0.2, 0.25, { freq: 900, sweepTo: 300 }),
    steal: () => tone(now(), 900, 0.25, 0.08, { glide: 1800 }),
    bonk: () => {
      tone(now(), 230, 0.18, 0.5, { glide: 90 });
      noise(now(), 0.08, 0.4, { freq: 1800, q: 3 });
    },
    ram: () => {
      tone(now(), 120, 0.2, 0.4, { glide: 70 });
      noise(now(), 0.15, 0.3, { type: 'lowpass', freq: 900 });
    },
    caught: () => [587, 440].forEach((f, i) => tone(now() + i * 0.3, f, 0.3, 0.07, { type: 'triangle' })),
    rev: () => {
      if (!engine) return;
      noise(now(), 0.5, 0.15, { freq: 800, sweepTo: 2600 });
    },
    azzouz: () => {},
    pietro: () => tone(now(), 98, 0.5, 0.15, { type: 'triangle', glide: 82 }),
    scream: () => {},
    gibberish: () => gibberish(),
    finish: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(now() + i * 0.09, f, 0.5, 0.09, { type: 'triangle' })),
    over: () => [392, 330, 262, 196].forEach((f, i) => tone(now() + i * 0.16, f, 0.4, 0.09, { type: 'triangle' })),
  };

  return {
    unlock: () => ensure(),
    play(name, arg) {
      if (!ensure()) return;
      const fx = effects[name];
      if (fx) fx(arg);
    },
    setEngine,
    stopEngine,
    setSiren,
    startVoice,
    stopVoice,
    dispose() {
      stopEngine();
      setSiren(false);
      stopVoice();
      if (ac) setTimeout(() => ac && ac.close().catch(() => {}), 500);
    },
  };
}
