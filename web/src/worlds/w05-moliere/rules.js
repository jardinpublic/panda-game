// World 5 rules, no rendering: the beat chart, timing judgement, combo and
// score, the vibe / too-wild / tiredness meters, the bouncer's patrol, the
// €200 bottles and stars. Unit-tested in test/w05-moliere.test.js.

export const DIRS = ['left', 'up', 'right', 'down'];

/** Difficulty settings: easy is forgiving, hard is a real challenge. */
export const MODES = {
  easy: {
    bpm: 96, duration: 80, lead: 1.8, perfect: 0.1, good: 0.2,
    doubles: 0, specialEvery: 9,
    stray: 0.03, strayBreaksCombo: false, wildDecay: 0.07, watchFactor: 1.6, watchShare: 0.3, patrol: 16,
    tiredRate: 0.0055, rumTired: 0.1, missTired: 0.01,
    stars: [0.55, 0.8],
  },
  normal: {
    bpm: 112, duration: 90, lead: 1.45, perfect: 0.075, good: 0.15,
    doubles: 0.12, specialEvery: 8,
    stray: 0.06, strayBreaksCombo: true, wildDecay: 0.055, watchFactor: 2, watchShare: 0.4, patrol: 14,
    tiredRate: 0.0068, rumTired: 0.13, missTired: 0.015,
    stars: [0.6, 0.82],
  },
  hard: {
    bpm: 126, duration: 95, lead: 1.15, perfect: 0.055, good: 0.11,
    doubles: 0.28, specialEvery: 7,
    stray: 0.08, strayBreaksCombo: true, wildDecay: 0.045, watchFactor: 2.5, watchShare: 0.5, patrol: 12,
    tiredRate: 0.0078, rumTired: 0.15, missTired: 0.02,
    stars: [0.65, 0.85],
  },
};

export const POINTS = { perfect: 100, good: 50, bottle: 600, flirt: 150, rum: 60, closing: 500 };

export function modeConfig(mode) {
  return MODES[mode] || MODES.normal;
}

export const clamp01 = (v) => Math.max(0, Math.min(1, v));

/**
 * Builds the dance chart: [{t, dir, kind}] sorted by time, kind 'arrow'
 * (dir in DIRS) or a special 'flirt' / 'rum' (dir 'action'). Density ramps
 * up: every 2 beats, then every beat, then off-beat doubles (normal / hard).
 * Never the same arrow three times in a row.
 */
export function buildChart(random, cfg) {
  const beat = 60 / cfg.bpm;
  const notes = [];
  const countIn = beat * 4;
  const end = cfg.duration - 1.5;
  let nextSpecial = countIn + cfg.specialEvery * 0.8;
  let specialToggle = random() < 0.5;
  let last = '';
  let lastCount = 0;
  const pickDir = () => {
    let dir = DIRS[Math.floor(random() * 4)];
    if (dir === last && lastCount >= 2) dir = DIRS[(DIRS.indexOf(dir) + 1 + Math.floor(random() * 3)) % 4];
    lastCount = dir === last ? lastCount + 1 : 1;
    last = dir;
    return dir;
  };
  for (let i = 0; ; i++) {
    const t = countIn + i * beat;
    if (t > end) break;
    const p = t / cfg.duration;
    const every = p < 0.22 ? 2 : 1;
    if (i % every !== 0) continue;
    if (t >= nextSpecial) {
      notes.push({ t, dir: 'action', kind: specialToggle ? 'flirt' : 'rum' });
      specialToggle = !specialToggle;
      nextSpecial = t + cfg.specialEvery * (0.8 + random() * 0.4);
      continue;
    }
    notes.push({ t, dir: pickDir(), kind: 'arrow' });
    if (p > 0.55 && random() < cfg.doubles && t + beat / 2 <= end) notes.push({ t: t + beat / 2, dir: pickDir(), kind: 'arrow' });
  }
  return notes;
}

/** Judges a press delta seconds off the note: 'perfect' | 'good' | null. */
export function judge(delta, cfg) {
  const d = Math.abs(delta);
  if (d <= cfg.perfect) return 'perfect';
  if (d <= cfg.good) return 'good';
  return null;
}

/**
 * Finds the index of the earliest unjudged note matching dir ('left'... or
 * 'action') within the good window of now, or -1.
 */
export function findNote(notes, dir, now, cfg, from = 0) {
  for (let i = from; i < notes.length; i++) {
    const n = notes[i];
    if (n.t - now > cfg.good) break;
    if (n.done || n.dir !== dir) continue;
    if (Math.abs(n.t - now) <= cfg.good) return i;
  }
  return -1;
}

/**
 * True while the patrolling bouncer is looking at Panda: a share of each
 * patrol loop, at the end of the loop.
 */
export function bouncerWatching(time, cfg) {
  const phase = (((time % cfg.patrol) + cfg.patrol) % cfg.patrol) / cfg.patrol;
  return phase >= 1 - cfg.watchShare;
}

/** Creates the night-club state for a mode ('easy' | 'normal' | 'hard'). */
export function createClub(mode = 'normal') {
  const cfg = modeConfig(mode);
  const s = {
    cfg,
    time: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    vibe: 0.2,
    wild: 0,
    tired: 0,
    perfects: 0,
    goods: 0,
    misses: 0,
    bottles: 0,
    flirts: 0,
    rums: 0,
    over: false,
    won: false,
    reason: null, // 'bouncer' | 'asleep' | 'closing'

    progress() {
      return clamp01(s.time / cfg.duration);
    },
    /** Score multiplier from the combo: x1, x2 at 10, x3 at 20, x4 at 30. */
    multiplier() {
      return 1 + Math.min(3, Math.floor(s.combo / 10));
    },
    vibeFull() {
      return s.vibe >= 1;
    },
    /** A hit arrow ('perfect' | 'good'). Returns the points. */
    hit(grade) {
      s.combo++;
      s.bestCombo = Math.max(s.bestCombo, s.combo);
      if (grade === 'perfect') { s.perfects++; s.vibe += 0.07; s.tired -= 0.006; } else { s.goods++; s.vibe += 0.04; }
      s.vibe = clamp01(s.vibe);
      s.tired = clamp01(s.tired);
      const points = POINTS[grade] * s.multiplier();
      s.score += points;
      return points;
    },
    /** An arrow that went by. */
    miss() {
      s.misses++;
      s.combo = 0;
      s.vibe = clamp01(s.vibe - 0.08);
      s.tired = clamp01(s.tired + cfg.missTired);
      s.check();
    },
    /** A press with no arrow to hit: Panda flails. */
    stray(watched) {
      if (cfg.strayBreaksCombo) s.combo = 0;
      s.addWild(cfg.stray, watched);
    },
    addWild(amount, watched) {
      s.wild = clamp01(s.wild + amount * (watched ? cfg.watchFactor : 1));
      s.check();
    },
    /** Orders a €200 bottle on the taxpayer. Only with a full vibe. Returns points (0 if refused). */
    bottle(watched) {
      if (!s.vibeFull() || s.over) return 0;
      s.bottles++;
      s.vibe = 0.35;
      s.addWild(0.3, watched);
      const points = POINTS.bottle * s.multiplier();
      s.score += points;
      return points;
    },
    /** A flirt attempt on the beat. It always fails, but the confidence scores. */
    flirt(watched) {
      s.flirts++;
      s.addWild(0.06, watched);
      s.score += POINTS.flirt;
      return POINTS.flirt;
    },
    /** A late-night rum: big vibe, but it makes Panda sleepy. */
    rum() {
      s.rums++;
      s.vibe = clamp01(s.vibe + 0.25);
      s.tired = clamp01(s.tired + cfg.rumTired);
      s.score += POINTS.rum;
      s.check();
      return POINTS.rum;
    },
    /** Ends the night if a meter overflowed. */
    check() {
      if (s.over) return;
      if (s.wild >= 1) { s.over = true; s.reason = 'bouncer'; } else if (s.tired >= 1) { s.over = true; s.reason = 'asleep'; }
    },
    /** Advances one frame. Returns {ended, reason}. */
    step(dt) {
      if (s.over) return { ended: false, reason: s.reason };
      s.time += dt;
      s.tired = clamp01(s.tired + cfg.tiredRate * dt);
      // A full vibe makes Panda go feral: the wild meter creeps up.
      s.wild = clamp01(s.wild + (s.vibeFull() ? 0.02 : -cfg.wildDecay) * dt);
      // A full vibe holds until the bottle is ordered; otherwise it fades slowly.
      if (!s.vibeFull()) s.vibe = clamp01(s.vibe - 0.008 * dt);
      s.check();
      if (!s.over && s.time >= cfg.duration) {
        s.over = true;
        s.won = true;
        s.reason = 'closing';
        s.score += Math.round(POINTS.closing * s.accuracy());
      }
      return { ended: s.over, reason: s.reason };
    },
    /** Share of arrows hit, goods counting 60 %. */
    accuracy() {
      const total = s.perfects + s.goods + s.misses;
      return total ? (s.perfects + 0.6 * s.goods) / total : 0;
    },
    /** 0 if the night ended early, else 1 to 3 on accuracy (3 also needs a bottle). */
    stars() {
      if (!s.won) return 0;
      const a = s.accuracy();
      if (a >= cfg.stars[1] && s.bottles >= 1) return 3;
      if (a >= cfg.stars[0]) return 2;
      return 1;
    },
  };
  return s;
}
