// World 2 rules, no rendering: the song chart (3 lanes), hit windows,
// combo multiplier, the boss "look" events and the MUTE button, hearts,
// accuracy and stars. Time-based and pure. Unit-tested in test/w02-concert.test.js.

export const LANES = 3;
/** Seconds of silence (count-in) before the first note. */
export const LEAD_IN = 3;
/** How long a pointless mute keeps the mic closed. */
export const USELESS_MUTE = 1;

/**
 * Difficulty table. bpm: song tempo; duration: song length (s);
 * approach: seconds a note takes to scroll down the neck; perfect/good: hit
 * windows (s, either side); hearts: lives; lookEvery: [min, max] seconds
 * between two boss looks; warn: telegraph length; look: how long he stares;
 * density: chance of a note per beat; eighths: chance of an extra off-beat
 * note; strayBreaks: a press with no note under it breaks the combo.
 */
export const MODES = {
  easy: { bpm: 92, duration: 72, approach: 2.2, perfect: 0.085, good: 0.18, hearts: 4, lookEvery: [15, 19], warn: 3.2, look: 1.6, density: 0.6, eighths: 0, strayBreaks: false },
  normal: { bpm: 116, duration: 80, approach: 1.75, perfect: 0.065, good: 0.14, hearts: 3, lookEvery: [10, 13], warn: 2.4, look: 1.6, density: 0.72, eighths: 0.22, strayBreaks: true },
  hard: { bpm: 140, duration: 86, approach: 1.4, perfect: 0.05, good: 0.11, hearts: 3, lookEvery: [7, 9.5], warn: 1.7, look: 1.8, density: 0.85, eighths: 0.4, strayBreaks: true },
};

export function modeConfig(mode = 'normal') {
  return MODES[mode] || MODES.normal;
}

/** Song sections by progress 0..1, with how busy each one is. */
const SECTIONS = [
  { key: 'intro', until: 0.12, density: 0.55, eighths: 0 },
  { key: 'verse', until: 0.4, density: 0.85, eighths: 0.6 },
  { key: 'chorus', until: 0.58, density: 1, eighths: 1.2 },
  { key: 'bridge', until: 0.74, density: 0.75, eighths: 0.7 },
  { key: 'finale', until: 1.01, density: 1.15, eighths: 1.4 },
];

export function sectionAt(progress) {
  return SECTIONS.find((s) => progress < s.until) || SECTIONS[SECTIONS.length - 1];
}

/** C major pentatonic steps; low lane = low notes. */
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16];

/**
 * Builds the chart: [{t, lane, pitch, judged}], strictly increasing t, one
 * note at a time (never a chord: one key at a time on PC).
 */
export function generateChart(cfg, rand) {
  const beat = 60 / cfg.bpm;
  const end = cfg.duration - 2;
  const notes = [];
  let lane = 1;
  const push = (t) => {
    const r = rand();
    if (r < 0.28) { /* same lane again */ } else if (r < 0.88) lane = lane === 0 ? 1 : lane === 2 ? 1 : (rand() < 0.5 ? 0 : 2);
    else lane = lane === 0 ? 2 : lane === 2 ? 0 : (rand() < 0.5 ? 0 : 2);
    notes.push({ t, lane, pitch: PENTA[lane * 2 + (rand() < 0.5 ? 0 : 1)] + (lane === 2 && rand() < 0.3 ? 2 : 0), judged: null });
  };
  for (let b = 0; LEAD_IN + b * beat <= end; b++) {
    const t = LEAD_IN + b * beat;
    const sec = sectionAt((t - LEAD_IN) / (end - LEAD_IN));
    if (sec.key === 'intro' && b % 2) continue;
    if (b === 0 || rand() < Math.min(1, cfg.density * sec.density)) push(t);
    if (cfg.eighths && t + beat / 2 <= end && rand() < cfg.eighths * sec.eighths) push(t + beat / 2);
  }
  return notes;
}

/** Boss looks: [{warnAt, lookAt, endAt}], spaced by cfg.lookEvery, inside the song. */
export function generateLooks(cfg, rand) {
  const looks = [];
  let warnAt = LEAD_IN + 6 + rand() * 2;
  while (warnAt + cfg.warn + cfg.look < cfg.duration - 2) {
    const lookAt = warnAt + cfg.warn;
    looks.push({ warnAt, lookAt, endAt: lookAt + cfg.look, warned: false, muted: false, resolved: false, caught: false, ended: false });
    warnAt += cfg.lookEvery[0] + rand() * (cfg.lookEvery[1] - cfg.lookEvery[0]);
  }
  return looks;
}

/**
 * Creates a run. rand: seeded 0..1 generator (the chart and the boss
 * schedule depend on it, nothing else does).
 */
export function createConcert({ mode = 'normal', rand = Math.random } = {}) {
  const cfg = modeConfig(mode);
  const notes = generateChart(cfg, rand);
  const looks = generateLooks(cfg, rand);
  const events = [];

  function setMute(until) {
    s.mutedUntil = Math.max(s.mutedUntil, until);
    // Notes played while the mic is closed are silent: no points, no miss.
    for (let i = s.next; i < notes.length; i++) {
      const n = notes[i];
      if (n.t > s.mutedUntil) break;
      if (!n.judged && n.t >= s.t - cfg.good) { n.judged = 'ghost'; s.ghost++; }
    }
  }

  const s = {
    cfg, mode, notes, looks,
    t: 0,
    score: 0, combo: 0, maxCombo: 0,
    hearts: cfg.hearts,
    perfect: 0, good: 0, miss: 0, ghost: 0, strays: 0,
    caught: 0, saves: 0, clutches: 0, uselessMutes: 0,
    mutedUntil: -1,
    next: 0, // first note that may still be unjudged
    over: false,

    beat() { return 60 / cfg.bpm; },
    /** 1 + one step per 8 combo, up to x4. */
    multiplier() { return Math.min(4, 1 + Math.floor(s.combo / 8)); },
    muted() { return s.t < s.mutedUntil; },
    progress() { return Math.min(1, s.t / cfg.duration); },
    /** The boss event under way (warning or look), or null. */
    activeLook() {
      for (const l of looks) if (s.t >= l.warnAt && s.t < l.endAt) return l;
      return null;
    },
    /** 'calm' | 'warn' | 'look' */
    phase() {
      const l = s.activeLook();
      if (!l) return 'calm';
      return s.t < l.lookAt ? 'warn' : 'look';
    },

    /** Advances the clock. Returns this frame's events (reused array). */
    advance(dt) {
      events.length = 0;
      if (s.over) return events;
      s.t += dt;
      // Notes that slid past the line unplayed.
      for (let i = s.next; i < notes.length; i++) {
        const n = notes[i];
        if (n.judged) { if (i === s.next) s.next++; continue; }
        if (n.t >= s.t - cfg.good) break;
        n.judged = 'miss';
        s.miss++;
        s.combo = 0;
        events.push({ type: 'miss', note: n });
        if (i === s.next) s.next++;
      }
      // The boss.
      for (const l of looks) {
        if (!l.warned && s.t >= l.warnAt) { l.warned = true; events.push({ type: 'warn', look: l }); }
        if (!l.resolved && s.t >= l.lookAt) {
          l.resolved = true;
          if (l.muted || s.muted()) {
            l.muted = true;
            setMute(l.endAt);
            events.push({ type: 'safe', look: l });
          } else {
            l.caught = true;
            s.caught++;
            s.hearts = Math.max(0, s.hearts - 1);
            s.combo = 0;
            events.push({ type: 'caught', look: l });
          }
        }
        if (!l.ended && s.t >= l.endAt) { l.ended = true; events.push({ type: 'lookEnd', look: l }); }
      }
      if (s.hearts <= 0) { s.over = true; events.push({ type: 'fail' }); }
      else if (s.t >= cfg.duration) { s.over = true; events.push({ type: 'end' }); }
      return events;
    },

    /** Plays lane 0..2 now. Returns {type: perfect|good|stray|muted, note, points}. */
    hit(lane) {
      if (s.over) return null;
      if (s.muted()) return { type: 'muted', lane };
      let best = null;
      let bestD = Infinity;
      for (let i = s.next; i < notes.length; i++) {
        const n = notes[i];
        if (n.t > s.t + cfg.good) break;
        if (n.judged || n.lane !== lane) continue;
        const d = Math.abs(n.t - s.t);
        if (d <= cfg.good && d < bestD) { best = n; bestD = d; }
      }
      if (!best) {
        s.strays++;
        if (cfg.strayBreaks) s.combo = 0;
        return { type: 'stray', lane };
      }
      const type = bestD <= cfg.perfect ? 'perfect' : 'good';
      best.judged = type;
      s[type]++;
      s.combo++;
      s.maxCombo = Math.max(s.maxCombo, s.combo);
      const points = (type === 'perfect' ? 100 : 50) * s.multiplier();
      s.score += points;
      return { type, note: best, points, lane };
    },

    /**
     * MUTE. During a warning: saved (late = clutch, more points). During the
     * look itself: too late. Otherwise: pointless, combo lost and the mic
     * closes for a second.
     */
    mute() {
      if (s.over) return null;
      const l = s.activeLook();
      if (l && s.t < l.lookAt) {
        if (l.muted) return { type: 'already' };
        l.muted = true;
        const clutch = l.lookAt - s.t <= cfg.warn * 0.4;
        const points = clutch ? 250 : 120;
        s.score += points;
        s.saves++;
        if (clutch) s.clutches++;
        setMute(l.endAt);
        return { type: clutch ? 'clutch' : 'saved', points, look: l };
      }
      if (l) { setMute(l.endAt); return { type: 'late' }; }
      if (s.muted()) return { type: 'already' };
      s.combo = 0;
      s.uselessMutes++;
      setMute(s.t + USELESS_MUTE);
      return { type: 'useless' };
    },

    /** Share of played notes hit: perfect = 1, good = 0.6, miss = 0. */
    accuracy() {
      const judged = s.perfect + s.good + s.miss;
      return judged ? (s.perfect + s.good * 0.6) / judged : 0;
    },
    won() { return s.over && s.hearts > 0; },
    /** 0 if failed; 1 for finishing, 2 at 65% accuracy, 3 at 85% and never caught. */
    stars() {
      if (s.hearts <= 0) return 0;
      const acc = s.accuracy();
      if (acc >= 0.85 && s.caught === 0) return 3;
      if (acc >= 0.65) return 2;
      return 1;
    },
  };
  return s;
}
