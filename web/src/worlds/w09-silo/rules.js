// World 9 rules, no rendering: the Silo staircase. Every step is a left/right
// choice. 'single' steps have one foothold (wrong side = slip), 'hazard' steps
// have a crate or spit on one side (that side = hit, bigger slip), 'bonus'
// steps carry an episode or a carrot on one side (either side is fine), and
// every 20th step is a landing with a friend. Victor "Croco" climbs behind and
// speeds up; if he reaches Panda, it is over. Unit-tested in test/w09-silo.test.js.

export const LANDING_EVERY = 20;
export const LANDING_FRIENDS = ['greg', 'cous', 'mamar', 'eugenie', 'violaine', 'aline'];
/** What a friend on a landing does: push = steps Croco loses, points = bonus score. */
export const LANDING_EFFECTS = {
  greg: { push: 3, points: 50 }, // a slice of his cake for Croco
  cous: { push: 0, points: 200 }, // your parcel, 20 € a parcel
  mamar: { push: 6, points: 0 }, // Croco stops for a sandwich
  eugenie: { push: 2, points: 100 },
  violaine: { push: 2, points: 100 },
  aline: { push: 4, points: 100 }, // "Silo done!"
};
export const MAX_GAP = 16; // Croco never falls further behind than this (he sprints)
export const STUN = 0.3; // seconds after a slip when presses are ignored

/**
 * Tuning per difficulty. chaser: Croco's steps/s at the start (x1.8 by the end);
 * startGap: his head start behind; window: seconds allowed per step before a
 * "too slow" slip (shrinks with height to minWindow); slip: steps lost on a
 * wrong side (+1 on a hazard); hazard: chance of a hazard step; stars: height for 2 and 3 stars.
 */
export const MODES = {
  easy: { duration: 70, chaser: 0.8, startGap: 12, window: 2.6, minWindow: 1.4, slip: 1, hazard: 0.1, stars: [100, 135] },
  normal: { duration: 70, chaser: 1.2, startGap: 9, window: 2.0, minWindow: 1.0, slip: 2, hazard: 0.14, stars: [140, 175] },
  hard: { duration: 70, chaser: 1.6, startGap: 7, window: 1.5, minWindow: 0.75, slip: 3, hazard: 0.18, stars: [180, 215] },
};

const tuning = (mode) => MODES[mode] || MODES.normal;

/** Seconds allowed to take the next step at a given height. */
export function windowFor(height, mode = 'normal') {
  const m = tuning(mode);
  return Math.max(m.minWindow, m.window - height * 0.006);
}

/** Croco's climbing speed (steps/s) after `time` seconds of a run lasting `duration`. */
export function chaserSpeed(time, mode = 'normal') {
  const m = tuning(mode);
  return m.chaser * (1 + 0.8 * Math.min(1, time / m.duration));
}

/** Score: 10 per step of best height, 100 per episode, 50 per carrot, plus friend bonuses. */
export function scoreFor({ height = 0, episodes = 0, carrots = 0, bonus = 0 } = {}) {
  return height * 10 + episodes * 100 + carrots * 50 + bonus;
}

/** Stars on the best height reached: 1 for surviving, 2 and 3 above the mode's thresholds. */
export function starsFor(height, mode = 'normal') {
  const [two, three] = tuning(mode).stars;
  if (height >= three) return 3;
  if (height >= two) return 2;
  return 1;
}

/** Friend standing on the landing at step i, or null if i is not a landing. */
export function landingFriend(i) {
  if (i <= 0 || i % LANDING_EVERY !== 0) return null;
  return LANDING_FRIENDS[(i / LANDING_EVERY - 1) % LANDING_FRIENDS.length];
}

const other = (side) => (side === 'L' ? 'R' : 'L');

/**
 * Builds step i of the staircase (call in order: lastSide is the previous single
 * step's foothold). side = the foothold (single), the safe side (hazard) or the pickup side (bonus).
 */
export function makeStep(i, random, mode, lastSide) {
  const friend = landingFriend(i);
  if (friend) return { i, type: 'landing', side: lastSide, item: null, friend };
  if (i <= 4) return { i, type: 'single', side: i % 2 ? 'L' : 'R', item: null };
  const r = random();
  const hazard = Math.min(0.3, tuning(mode).hazard + i * 0.0004);
  if (r < hazard) {
    return { i, type: 'hazard', side: random() < 0.5 ? 'L' : 'R', item: random() < 0.4 ? 'spit' : 'crate' };
  }
  if (r < hazard + 0.15) {
    return { i, type: 'bonus', side: random() < 0.5 ? 'L' : 'R', item: random() < 0.6 ? 'tv' : 'carrot' };
  }
  return { i, type: 'single', side: random() < 0.55 ? other(lastSide) : lastSide, item: null };
}

/** Creates the climb. random: seeded 0..1 generator. */
export function createClimb({ mode = 'normal', random = Math.random } = {}) {
  const m = tuning(mode);
  const stairs = [];
  let lastSide = 'L';
  const s = {
    mode,
    duration: m.duration,
    time: 0,
    pos: 0, // step Panda stands on
    best: 0,
    chaser: -m.startGap,
    idle: 0,
    stun: 0,
    episodes: 0,
    carrots: 0,
    bonus: 0,
    slips: 0,
    hits: 0,
    streak: 0,
    over: false,
    won: false,

    /** Step i, generated on demand. */
    stepAt(i) {
      if (i < 0) return { i, type: 'floor', side: 'L', item: null };
      while (stairs.length <= i) {
        const st = makeStep(stairs.length, random, mode, lastSide);
        if (st.type === 'single') lastSide = st.side;
        stairs.push(st);
      }
      return stairs[i];
    },
    next() {
      return s.stepAt(s.pos + 1);
    },
    window() {
      return windowFor(s.pos, mode);
    },
    gap() {
      return s.pos - s.chaser;
    },
    score() {
      return scoreFor({ height: s.best, episodes: s.episodes, carrots: s.carrots, bonus: s.bonus });
    },
    stars() {
      return starsFor(s.best, mode);
    },

    /**
     * Panda puts a foot on side 'L' or 'R'. Returns
     * { ignored } or { climbed, slipped, hit, pickup, landing }.
     */
    press(side) {
      if (s.over || s.stun > 0 || (side !== 'L' && side !== 'R')) return { ignored: true };
      const st = s.next();
      const ev = { ignored: false, climbed: false, slipped: 0, hit: null, pickup: null, landing: null, step: st };
      s.idle = 0;
      const ok = st.type === 'landing' || st.type === 'bonus' || side === st.side;
      if (!ok) {
        if (st.type === 'hazard') {
          ev.hit = st.item;
          s.hits++;
          ev.slipped = slip(m.slip + 1);
        } else {
          ev.slipped = slip(m.slip);
        }
        return ev;
      }
      s.pos++;
      s.best = Math.max(s.best, s.pos);
      s.streak++;
      ev.climbed = true;
      if (st.type === 'bonus' && side === st.side && !st.taken) {
        st.taken = true;
        ev.pickup = st.item;
        if (st.item === 'tv') s.episodes++; else s.carrots++;
      }
      if (st.type === 'landing' && !st.visited) {
        st.visited = true;
        ev.landing = st.friend;
        const fx = LANDING_EFFECTS[st.friend] || {};
        s.pushChaser(fx.push || 0);
        s.bonus += fx.points || 0;
      }
      return ev;
    },

    /** Croco loses n steps (sandwich, cake…). */
    pushChaser(n) {
      s.chaser -= n;
    },

    /** Advances time. Returns { tooSlow, caught, timeUp }. */
    step(dt) {
      const ev = { tooSlow: false, caught: false, timeUp: false, slipped: 0 };
      if (s.over) return ev;
      s.time += dt;
      s.stun = Math.max(0, s.stun - dt);
      s.idle += dt;
      if (s.idle > s.window()) {
        ev.tooSlow = true;
        ev.slipped = slip(1);
      }
      s.chaser += chaserSpeed(s.time, mode) * dt;
      if (s.pos - s.chaser > MAX_GAP) s.chaser = s.pos - MAX_GAP;
      if (s.chaser >= s.pos) {
        s.over = true;
        ev.caught = true;
      } else if (s.time >= s.duration) {
        s.over = true;
        s.won = true;
        ev.timeUp = true;
      }
      return ev;
    },
  };

  function slip(n) {
    const before = s.pos;
    s.pos = Math.max(0, s.pos - n);
    s.slips++;
    s.streak = 0;
    s.stun = STUN;
    s.idle = 0;
    return before - s.pos;
  }

  return s;
}
