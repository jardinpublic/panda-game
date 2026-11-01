// World 4 rules, no rendering: the dive timer, oxygen, hearts, combo scoring,
// the langoustine size check (the coastguard is watching), the GoPro rescue
// and stars. Unit-tested in test/w04-dive.test.js.

/** Lagoon bounds in world units (side view: x across, y up, surface at 0). */
export const LAGOON = { surfaceY: 0, floorY: -13, minX: -24, maxX: 21, surfaceBand: 1.3 };

/** Minimum legal langoustine size, in cm. Panda's are always just under it. */
export const LEGAL_CM = 20;

/** Points per catch or decision, before the combo multiplier. */
export const POINTS = {
  fish: 10,
  lionfish: 40,
  shark: 120,
  keepLegal: 90,
  releaseSmall: 25,
  releaseLegal: 0,
  fine: -150,
  gopro: 250,
  heartLeft: 50,
};

/** Difficulty settings: easy is forgiving, hard is a real challenge. */
export const MODES = {
  easy: {
    duration: 90, hearts: 5, drain: 1 / 46, refill: 0.65, invuln: 2,
    fishEvery: 3.6, lionEvery: 7, sharkEvery: 15, maxSharks: 1, sharkHp: 1, sharkSpeed: 2.8, chargeSpeed: 6, telegraph: 1.1,
    decide: 4.5, legalChance: 0.35, nearMiss: 7, wobble: 0.6, goproFall: 0.9, gopros: [0.3, 0.68],
    stars: [600, 1300],
  },
  normal: {
    duration: 80, hearts: 4, drain: 1 / 36, refill: 0.6, invuln: 1.6,
    fishEvery: 3.2, lionEvery: 6, sharkEvery: 9, maxSharks: 2, sharkHp: 2, sharkSpeed: 3.6, chargeSpeed: 8.5, telegraph: 0.75,
    decide: 3.2, legalChance: 0.3, nearMiss: 4, wobble: 1.4, goproFall: 1.3, gopros: [0.3, 0.68],
    stars: [800, 1600],
  },
  hard: {
    duration: 75, hearts: 3, drain: 1 / 27, refill: 0.5, invuln: 1.3,
    fishEvery: 2.8, lionEvery: 5, sharkEvery: 6, maxSharks: 3, sharkHp: 2, sharkSpeed: 4.4, chargeSpeed: 11, telegraph: 0.5,
    decide: 2.2, legalChance: 0.25, nearMiss: 1.6, wobble: 2.6, goproFall: 1.8, gopros: [0.22, 0.5, 0.8],
    stars: [900, 1800],
  },
};

export function modeConfig(mode) {
  return MODES[mode] || MODES.normal;
}

const round1 = (v) => Math.round(v * 10) / 10;
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * Rolls a langoustine size in cm with the given random() (0..1). Most of
 * them are undersized, by at most cfg.nearMiss cm: the harder the mode, the
 * closer to the legal line.
 */
export function langoustineSize(random, cfg) {
  if (random() < cfg.legalChance) return round1(LEGAL_CM + 0.5 + random() * 6);
  return round1(LEGAL_CM - 0.5 - random() * (cfg.nearMiss - 0.5));
}

/**
 * What the gauge needle shows t seconds after the catch: the langoustine
 * wriggles, so the needle wobbles around the true size and settles.
 */
export function gaugeReading(size, t, wobble) {
  return size + wobble * Math.exp(-1.4 * t) * Math.sin(t * 13);
}

/** Moves (x, y) toward (tx, ty) at most speed * dt. Returns [x, y]. */
export function steerToward(x, y, tx, ty, speed, dt) {
  const dx = tx - x;
  const dy = ty - y;
  const d = Math.hypot(dx, dy);
  const step = speed * dt;
  if (d <= step || d === 0) return [tx, ty];
  return [x + (dx / d) * step, y + (dy / d) * step];
}

/** Keeps a swimmer inside the lagoon. Returns [x, y]. */
export function clampToLagoon(x, y, margin = 0.6) {
  return [clamp(x, LAGOON.minX, LAGOON.maxX), clamp(y, LAGOON.floorY + margin, LAGOON.surfaceY + 0.2)];
}

/** True when two circles (x, y, r) overlap. */
export function touches(ax, ay, ar, bx, by, br) {
  return Math.hypot(ax - bx, ay - by) < ar + br;
}

/**
 * Creates the dive state for a mode ('easy' | 'normal' | 'hard').
 * step(dt, y) advances the clock and the oxygen for a swimmer at depth y.
 */
export function createDive(mode = 'normal') {
  const cfg = modeConfig(mode);
  const s = {
    cfg,
    time: 0,
    hearts: cfg.hearts,
    oxygen: 1,
    score: 0,
    combo: 0,
    bestCombo: 0,
    invuln: 0,
    shots: 0,
    hits: 0,
    fines: 0,
    kept: 0,
    released: 0,
    goprosSaved: 0,
    goprosLost: 0,
    over: false,
    won: false,

    progress() {
      return clamp(s.time / cfg.duration, 0, 1);
    },
    timeLeft() {
      return Math.max(0, cfg.duration - s.time);
    },
    atSurface(y) {
      return y > LAGOON.surfaceY - LAGOON.surfaceBand;
    },
    /** Advances one frame. Returns {o2Empty, finished}. */
    step(dt, y) {
      const events = { o2Empty: false, finished: false };
      if (s.over) return events;
      s.time += dt;
      s.invuln = Math.max(0, s.invuln - dt);
      if (s.atSurface(y)) s.oxygen = Math.min(1, s.oxygen + cfg.refill * dt);
      else s.oxygen -= cfg.drain * dt;
      if (s.oxygen <= 0) {
        // Out of air: Panda panic-gulps at the snorkel, it costs a heart.
        s.oxygen = 0.45;
        events.o2Empty = true;
        s.loseHeart();
      }
      if (!s.over && s.time >= cfg.duration) {
        s.over = true;
        s.won = true;
        s.score += s.hearts * POINTS.heartLeft;
        events.finished = true;
      }
      return events;
    },
    /** Combo multiplier: x1 to x3 in steps of 0.25. */
    multiplier() {
      return 1 + Math.min(s.combo, 8) * 0.25;
    },
    shoot() {
      s.shots++;
    },
    /** A spear hit on 'fish' | 'lionfish' | 'shark' (shark only counts when it flees). Returns points. */
    hit(kind) {
      s.hits++;
      s.combo++;
      s.bestCombo = Math.max(s.bestCombo, s.combo);
      const points = Math.round((POINTS[kind] || 0) * s.multiplier());
      s.score += points;
      return points;
    },
    miss() {
      s.combo = 0;
    },
    loseHeart() {
      s.hearts = Math.max(0, s.hearts - 1);
      s.combo = 0;
      s.invuln = cfg.invuln;
      if (s.hearts <= 0) {
        s.over = true;
        s.won = false;
      }
    },
    /** A shark bite. Returns false while invulnerable (just bitten). */
    hurt() {
      if (s.invuln > 0 || s.over) return false;
      s.loseHeart();
      return true;
    },
    /**
     * Keep (true), throw back (false) or let it escape (null) a langoustine
     * of size cm. Returns {verdict, points}: 'legal' | 'fine' | 'released' |
     * 'wasted' | 'escaped'.
     */
    decide(size, keep) {
      const legal = size >= LEGAL_CM;
      let verdict;
      let points;
      if (keep === null || keep === undefined) { verdict = 'escaped'; points = 0; }
      else if (keep && legal) { verdict = 'legal'; points = POINTS.keepLegal; s.kept++; }
      else if (keep) { verdict = 'fine'; points = POINTS.fine; s.fines++; s.combo = 0; }
      else if (!legal) { verdict = 'released'; points = POINTS.releaseSmall; s.released++; }
      else { verdict = 'wasted'; points = POINTS.releaseLegal; }
      s.score = Math.max(0, s.score + points);
      return { verdict, points };
    },
    /** The GoPro was caught before it hit the bottom. Returns points. */
    saveGopro() {
      s.goprosSaved++;
      s.score += POINTS.gopro;
      return POINTS.gopro;
    },
    loseGopro() {
      s.goprosLost++;
    },
    accuracy() {
      return s.shots ? s.hits / s.shots : 0;
    },
    /** 0 if the dive failed, else 1 to 3 on the mode's score targets. */
    stars() {
      if (!s.won) return 0;
      if (s.score >= cfg.stars[1]) return 3;
      if (s.score >= cfg.stars[0]) return 2;
      return 1;
    },
  };
  return s;
}

/** Spawn interval that shrinks as the dive goes on (down to 65 %). */
export function rampInterval(base, progress) {
  return base * (1 - 0.35 * clamp(progress, 0, 1));
}
