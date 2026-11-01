// World 3 rules, no rendering: waves of kids run at the red Fiat Panda to
// scribble, stick stickers, kick tyres and let the air out; Panda runs around
// and shouts "Hoho ma bagnole !" to shoo them. Power-ups (water pistol, scary
// face, ice creams), Cous's guinea pigs, Babar's spit. Car damage = lose.
// Plain 2D maths on the ground plane (x, z). Tested in test/w03-bagnole.test.js.

/** The car is an ellipse around the origin (long axis on x). */
export const CAR = { rx: 2.0, rz: 1.1 };
/** Kids stop on this ellipse to do their mischief. */
export const SLOT = { rx: 2.55, rz: 1.65 };
export const SPAWN_R = 16;
export const LEAVE_R = 18;
export const ARENA_R = 11.5;
export const ACTIONS = ['scribble', 'sticker', 'kick', 'air'];
/** Damage multiplier per mischief. */
export const ACTION_RATE = { scribble: 1, sticker: 0.8, kick: 1.25, air: 1.1 };
export const PICKUPS = ['pistol', 'scary', 'icecream'];

/**
 * Difficulty table. waves; base + growth: kids in wave n = base + (n-1) * growth;
 * spawnEvery: seconds between two kids; kidSpeed (m/s); rate: car damage per
 * second per kid at work; groupEvery: every that many waves, kids come in
 * one more at once (from different sides, up to 3); maxActive: kids on screen at once; shoutRadius;
 * returnChance: a shooed kid sometimes comes back; pickupEvery: seconds
 * between power-ups; repair: damage polished away between waves.
 */
export const MODES = {
  easy: { waves: 4, base: 4, growth: 2, spawnEvery: 1.45, groupEvery: 3, kidSpeed: 2.1, rate: 2.4, maxActive: 8, shoutRadius: 3.0, returnChance: 0, pickupEvery: 7, repair: 8, breakTime: 3 },
  normal: { waves: 5, base: 4, growth: 3, spawnEvery: 1.15, groupEvery: 2, kidSpeed: 2.7, rate: 3.2, maxActive: 11, shoutRadius: 2.7, returnChance: 0.12, pickupEvery: 9, repair: 6, breakTime: 3 },
  hard: { waves: 6, base: 6, growth: 2, spawnEvery: 0.95, groupEvery: 2, kidSpeed: 3.2, rate: 3.6, maxActive: 14, shoutRadius: 2.5, returnChance: 0.2, pickupEvery: 10, repair: 5, breakTime: 2 },
};

export const PANDA_SPEED = 7.5;
export const SHOUT_COOLDOWN = 0.55;
export const PISTOL_TIME = 7;
export const PISTOL_EVERY = 0.5;
export const PISTOL_RANGE = 6;
export const SCARY_RADIUS = 9;
export const DISTRACT_TIME = 7;
export const SPIT_WARN = 1;
export const SPIT_TIME = 5;
export const SPIT_RADIUS = 1.1;
export const SLOW_FACTOR = 0.45;

export function modeConfig(mode = 'normal') {
  return MODES[mode] || MODES.normal;
}

export function waveSize(cfg, wave) {
  return cfg.base + (wave - 1) * cfg.growth;
}

/** How many kids rush in at once in this wave (1..3). */
export function groupSize(cfg, wave) {
  return Math.min(3, 1 + Math.floor((wave - 1) / cfg.groupEvery));
}

/** Points for one shout that shoos n kids at once (combos pay). */
export function shoutPoints(n) {
  return 10 * n * n;
}

/** Stars from the car's final damage (0..100). */
export function starsForDamage(damage) {
  if (damage >= 100) return 0;
  if (damage <= 25) return 3;
  if (damage <= 55) return 2;
  return 1;
}

const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);

/** Pushes a point out of the car ellipse (returns [x, z]). */
export function outsideCar(x, z, margin = 0.35) {
  const rx = CAR.rx + margin;
  const rz = CAR.rz + margin;
  const k = (x / rx) ** 2 + (z / rz) ** 2;
  if (k >= 1) return [x, z];
  if (k < 1e-6) return [0, rz];
  const s = 1 / Math.sqrt(k);
  return [x * s, z * s];
}

/**
 * Creates a run. rand: seeded 0..1 generator.
 */
export function createDefence({ mode = 'normal', rand = Math.random } = {}) {
  const cfg = modeConfig(mode);
  const events = [];
  let nextId = 1;

  function isActive(k) { return k.state === 'approach' || k.state === 'mischief'; }

  function spawnKid(angle = null) {
    const a = angle === null ? rand() * Math.PI * 2 : angle;
    const k = {
      id: nextId++,
      seed: Math.floor(rand() * 1000),
      angle: a,
      x: Math.cos(a) * SPAWN_R,
      z: Math.sin(a) * SPAWN_R,
      slotX: Math.cos(a) * SLOT.rx,
      slotZ: Math.sin(a) * SLOT.rz,
      tx: 0, tz: 0,
      state: 'approach',
      action: ACTIONS[Math.floor(rand() * ACTIONS.length)],
      speed: cfg.kidSpeed * (0.85 + rand() * 0.3),
      returned: false,
      willReturn: false,
      work: 0, // seconds spent at the car
    };
    if (s.distraction) distractKid(k);
    s.kids.push(k);
    s.spawned++;
    events.push({ type: 'spawn', kid: k });
    return k;
  }

  function distractKid(k) {
    const d = s.distraction;
    const a = (k.id * 2.399) % (Math.PI * 2);
    k.state = 'distracted';
    k.tx = d.x + Math.cos(a) * 1.3;
    k.tz = d.z + Math.sin(a) * 1.3;
  }

  /** Sends a kid running away from Panda. happy: leaves for good (no return). */
  function scare(k, happy = false) {
    // Mostly outward from the car (never through it), a bit away from Panda.
    const r = Math.hypot(k.x, k.z) || 1;
    let dx = k.x / r;
    let dz = k.z / r;
    const ax = k.x - s.panda.x;
    const az = k.z - s.panda.z;
    const al = Math.hypot(ax, az);
    if (al > 0.01) { dx += (ax / al) * 0.6; dz += (az / al) * 0.6; }
    let l = Math.hypot(dx, dz);
    if (l < 0.01) { dx = Math.cos(k.angle); dz = Math.sin(k.angle); l = 1; }
    dx /= l; dz /= l;
    k.state = 'flee';
    k.tx = k.x + dx * 40;
    k.tz = k.z + dz * 40;
    k.willReturn = !happy && !k.returned && rand() < cfg.returnChance;
    if (!happy) s.shooed++;
  }

  function moveToward(o, tx, tz, speed, dt) {
    const dx = tx - o.x;
    const dz = tz - o.z;
    const l = Math.hypot(dx, dz);
    const step = speed * dt;
    if (l <= step) { o.x = tx; o.z = tz; return true; }
    o.x += (dx / l) * step;
    o.z += (dz / l) * step;
    return false;
  }

  const s = {
    cfg, mode,
    time: 0,
    wave: 0,
    phase: 'break', // break | wave | won | lost
    phaseTimer: 2,
    toSpawn: 0,
    spawnTimer: 0,
    spawned: 0,
    kids: [],
    damage: 0,
    score: 0,
    shooed: 0,
    bestShout: 0,
    shoutCooldown: 0,
    panda: { x: 0, z: 3.2, tx: null, tz: null, targetKid: null, slowed: false, moving: false },
    pistol: 0,
    pistolTimer: 0,
    distraction: null, // {x, z, t, kind}
    pickups: [],
    pickupTimer: cfg.pickupEvery * 0.6,
    spit: null, // {x, z, warn, t}
    spitTimer: 8,
    thresholds: 0,
    over: false,

    activeCount() { let n = 0; for (const k of s.kids) if (isActive(k)) n++; return n; },
    atCar() { let n = 0; for (const k of s.kids) if (k.state === 'mischief') n++; return n; },
    won() { return s.phase === 'won'; },
    shoutRadius() { return cfg.shoutRadius * (s.pistol > 0 ? 1.7 : 1); },

    /** Taps: run to a point, or chase a kid (auto-shout when close). */
    setTarget(x, z, kidId = null) {
      const r = Math.hypot(x, z);
      const k = r > ARENA_R ? ARENA_R / r : 1;
      s.panda.tx = x * k;
      s.panda.tz = z * k;
      s.panda.targetKid = kidId;
    },

    /** "Hoho ma bagnole !": shoos every kid at work or running in within reach. */
    shout() {
      if (s.over || s.shoutCooldown > 0) return null;
      s.shoutCooldown = SHOUT_COOLDOWN;
      const r = s.shoutRadius();
      const kids = [];
      for (const k of s.kids) {
        if (isActive(k) && dist(k.x, k.z, s.panda.x, s.panda.z) <= r) { scare(k); kids.push(k); }
      }
      const points = shoutPoints(kids.length);
      s.score += points;
      s.bestShout = Math.max(s.bestShout, kids.length);
      const result = { type: 'shout', count: kids.length, points, kids, radius: r };
      events.push(result);
      return result;
    },

    /** Applies a power-up now (also used when Panda walks over a pickup). */
    usePower(kind, x = s.panda.x, z = s.panda.z) {
      if (kind === 'pistol') {
        s.pistol = PISTOL_TIME;
        s.pistolTimer = 0;
        events.push({ type: 'power', kind });
      } else if (kind === 'scary') {
        let n = 0;
        for (const k of s.kids) if (isActive(k) && dist(k.x, k.z, s.panda.x, s.panda.z) <= SCARY_RADIUS) { scare(k); n++; }
        s.score += shoutPoints(Math.min(n, 4)) + n * 10;
        events.push({ type: 'power', kind, count: n });
      } else {
        s.distract(x, z, DISTRACT_TIME, kind);
        events.push({ type: 'power', kind });
      }
    },

    /** Ice creams, guinea pigs: every kid goes there instead of the car. */
    distract(x, z, time, kind) {
      [x, z] = outsideCar(x, z, 1.2);
      s.distraction = { x, z, t: time, kind };
      for (const k of s.kids) if (isActive(k) || k.state === 'distracted') distractKid(k);
    },

    /** One frame. move: {x, z} from keys (-1..1), or null. Returns events (reused array). */
    step(dt, move = null) {
      events.length = 0;
      if (s.over) return events;
      s.time += dt;
      s.shoutCooldown = Math.max(0, s.shoutCooldown - dt);

      // Waves.
      if (s.phase === 'break') {
        s.phaseTimer -= dt;
        if (s.phaseTimer <= 0) {
          s.wave++;
          s.phase = 'wave';
          s.toSpawn = waveSize(cfg, s.wave);
          s.spawnTimer = 0.3;
          events.push({ type: 'wave', wave: s.wave });
          if (s.wave === 3 || (s.wave === 6 && cfg.waves >= 6)) {
            const side = s.wave === 3 ? -1 : 1;
            s.distract(side * 6, 4.5, 6, 'pets');
            events.push({ type: 'cous', x: s.distraction.x, z: s.distraction.z });
          }
        }
      } else if (s.phase === 'wave') {
        s.spawnTimer -= dt;
        const every = Math.max(0.45, cfg.spawnEvery * (1 - 0.05 * (s.wave - 1)));
        if (s.toSpawn > 0 && s.spawnTimer <= 0 && s.activeCount() < cfg.maxActive) {
          const n = Math.min(s.toSpawn, groupSize(cfg, s.wave));
          const a = rand() * Math.PI * 2;
          for (let i = 0; i < n; i++) spawnKid(a + (i * Math.PI * 2) / n + (rand() - 0.5) * 0.6);
          s.toSpawn -= n;
          s.spawnTimer = every * (1 + (n - 1) * 0.7);
        }
        // Power-ups pop up during waves.
        s.pickupTimer -= dt;
        if (s.pickupTimer <= 0 && s.pickups.length < 2) {
          s.pickupTimer = cfg.pickupEvery;
          const a = rand() * Math.PI * 2;
          const r = 4 + rand() * 4;
          const p = { id: nextId++, kind: PICKUPS[Math.floor(rand() * PICKUPS.length)], x: Math.cos(a) * r, z: Math.sin(a) * r * 0.8, ttl: 9 };
          s.pickups.push(p);
          events.push({ type: 'pickup_spawn', pickup: p });
        }
      }

      // Panda.
      const p = s.panda;
      let speed = PANDA_SPEED;
      p.slowed = !!(s.spit && s.spit.warn <= 0 && dist(p.x, p.z, s.spit.x, s.spit.z) <= SPIT_RADIUS);
      if (p.slowed) speed *= SLOW_FACTOR;
      p.moving = false;
      if (move && (move.x || move.z)) {
        const l = Math.hypot(move.x, move.z);
        p.x += (move.x / l) * speed * dt;
        p.z += (move.z / l) * speed * dt;
        p.tx = null; p.tz = null; p.targetKid = null;
        p.moving = true;
      } else if (p.tx !== null) {
        let tx = p.tx;
        let tz = p.tz;
        const kid = p.targetKid !== null ? s.kids.find((k) => k.id === p.targetKid) : null;
        if (kid && isActive(kid)) {
          tx = kid.x; tz = kid.z;
          if (dist(p.x, p.z, kid.x, kid.z) <= s.shoutRadius() * 0.7 && s.shoutCooldown <= 0) {
            s.shout();
            p.targetKid = null;
            p.tx = null;
          }
        } else if (p.targetKid !== null) {
          p.targetKid = null;
          p.tx = null;
        }
        if (p.tx !== null) {
          p.moving = !moveToward(p, tx, tz, speed, dt);
          if (!p.moving && p.targetKid === null) p.tx = null;
        }
      }
      const pr = Math.hypot(p.x, p.z);
      if (pr > ARENA_R) { p.x *= ARENA_R / pr; p.z *= ARENA_R / pr; }
      [p.x, p.z] = outsideCar(p.x, p.z);

      // Kids.
      for (let i = s.kids.length - 1; i >= 0; i--) {
        const k = s.kids[i];
        if (k.state === 'approach') {
          if (moveToward(k, k.slotX, k.slotZ, k.speed, dt)) {
            k.state = 'mischief';
            events.push({ type: 'arrive', kid: k });
          }
        } else if (k.state === 'mischief') {
          k.work += dt;
          s.damage = Math.min(100, s.damage + cfg.rate * ACTION_RATE[k.action] * dt);
        } else if (k.state === 'distracted') {
          moveToward(k, k.tx, k.tz, k.speed, dt);
        } else if (k.state === 'flee') {
          moveToward(k, k.tx, k.tz, k.speed * 1.6, dt);
          if (Math.hypot(k.x, k.z) >= LEAVE_R) {
            if (k.willReturn) {
              k.willReturn = false;
              k.returned = true;
              k.state = 'approach';
              k.angle = Math.atan2(k.z, k.x);
              k.slotX = Math.cos(k.angle) * SLOT.rx;
              k.slotZ = Math.sin(k.angle) * SLOT.rz;
              if (s.distraction) distractKid(k);
              events.push({ type: 'return', kid: k });
            } else {
              s.kids.splice(i, 1);
              events.push({ type: 'gone', kid: k });
            }
          }
        }
      }

      // Damage milestones (for the gang's reactions).
      while (s.thresholds < 3 && s.damage >= (s.thresholds + 1) * 25) {
        s.thresholds++;
        events.push({ type: 'threshold', level: s.thresholds });
      }

      // Power-ups.
      for (let i = s.pickups.length - 1; i >= 0; i--) {
        const pk = s.pickups[i];
        pk.ttl -= dt;
        if (dist(p.x, p.z, pk.x, pk.z) <= 1.1) {
          s.pickups.splice(i, 1);
          events.push({ type: 'pickup', pickup: pk });
          s.usePower(pk.kind, pk.x, pk.z);
        } else if (pk.ttl <= 0) {
          s.pickups.splice(i, 1);
          events.push({ type: 'pickup_gone', pickup: pk });
        }
      }
      if (s.pistol > 0) {
        s.pistol = Math.max(0, s.pistol - dt);
        s.pistolTimer -= dt;
        if (s.pistolTimer <= 0) {
          let best = null;
          let bestD = PISTOL_RANGE;
          for (const k of s.kids) {
            if (!isActive(k)) continue;
            const d = dist(k.x, k.z, p.x, p.z);
            if (d <= bestD) { best = k; bestD = d; }
          }
          if (best) {
            s.pistolTimer = PISTOL_EVERY;
            scare(best);
            s.score += 10;
            events.push({ type: 'squirt', kid: best });
          }
        }
      }
      if (s.distraction) {
        s.distraction.t -= dt;
        if (s.distraction.t <= 0) {
          const kind = s.distraction.kind;
          s.distraction = null;
          let n = 0;
          for (const k of s.kids) if (k.state === 'distracted') { scare(k, true); n++; }
          s.score += n * 5;
          events.push({ type: 'distraction_end', kind, count: n });
        }
      }

      // Babar spits from his balcony now and then: a puddle that slows Panda.
      s.spitTimer -= dt;
      if (!s.spit && s.spitTimer <= 0 && s.phase === 'wave') {
        s.spit = { x: p.x, z: p.z, warn: SPIT_WARN, t: SPIT_TIME };
        events.push({ type: 'spit_warn', x: p.x, z: p.z });
      }
      if (s.spit) {
        if (s.spit.warn > 0) {
          s.spit.warn -= dt;
          if (s.spit.warn <= 0) events.push({ type: 'spit_land', x: s.spit.x, z: s.spit.z });
        } else {
          s.spit.t -= dt;
          if (s.spit.t <= 0) { s.spit = null; s.spitTimer = 9 + rand() * 5; }
        }
      }

      // Wave cleared? Lost?
      if (s.damage >= 100) {
        s.phase = 'lost';
        s.over = true;
        events.push({ type: 'lose' });
        return events;
      }
      if (s.phase === 'wave' && s.toSpawn === 0 && !s.kids.some((k) => isActive(k) || k.state === 'distracted' || k.willReturn)) {
        s.score += 50 * s.wave;
        const repaired = Math.min(s.damage, cfg.repair);
        s.damage -= repaired;
        events.push({ type: 'wave_clear', wave: s.wave, repaired });
        if (s.wave >= cfg.waves) {
          s.phase = 'won';
          s.over = true;
          events.push({ type: 'win' });
        } else {
          s.phase = 'break';
          s.phaseTimer = cfg.breakTime;
        }
      }
      return events;
    },

    /** Final score: shooing points plus a bonus for a car in good shape. */
    finalScore() {
      return Math.round(s.score + (s.phase === 'won' ? (100 - s.damage) * 5 : 0));
    },
    stars() {
      return s.phase === 'won' ? starsForDamage(s.damage) : 0;
    },
  };
  return s;
}
