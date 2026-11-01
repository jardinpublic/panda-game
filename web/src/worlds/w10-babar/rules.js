// World 10 rules, no rendering: Babar sneaks up on Panda at a terrace party.
// Panda wanders between groups of friends and regularly looks around (a
// telegraphed turn, then a sweeping view cone). Babar moving inside the cone
// raises suspicion; full suspicion = spotted = a strike (3 = over). Right
// behind Panda, a timing bar lands the gag (lighter tap or spit), perfect
// timing and combos score more. Unit-tested in test/w10-babar.test.js.

/** Terrace bounds (metres). */
export const BOUNDS = { minX: -11, maxX: 11, minZ: -8, maxZ: 8 };
export const BABAR_RADIUS = 0.35;
export const BABAR_START = { x: 0, z: 7 };

/**
 * Party layout. kind: prop | friend. Friends with snitch=true tell Panda when
 * Babar bumps into them; accomplices laugh when a gag lands.
 */
export const OBSTACLES = [
  { id: 'bbq', kind: 'prop', x: -6, z: -4, r: 0.9 },
  { id: 'cous', kind: 'friend', x: -6, z: -5.4, r: 0.45 },
  { id: 'victor', kind: 'friend', x: -7.6, z: -3.6, r: 0.45 },
  { id: 'greg', kind: 'friend', x: -4.5, z: -4.9, r: 0.45 },
  { id: 'violaine', kind: 'friend', x: -7.2, z: -2.3, r: 0.45 },
  { id: 'tableA', kind: 'prop', x: 5.6, z: -4, r: 0.85 },
  { id: 'mamar', kind: 'friend', x: 4.4, z: -4.9, r: 0.45, accomplice: true },
  { id: 'romain', kind: 'friend', x: 6.8, z: -4.9, r: 0.45, accomplice: true },
  { id: 'tableB', kind: 'prop', x: 6, z: 4.2, r: 0.85 },
  { id: 'aline', kind: 'friend', x: 4.9, z: 5.3, r: 0.45, snitch: true },
  { id: 'eugenie', kind: 'friend', x: 7.2, z: 5.2, r: 0.45, snitch: true },
  { id: 'bar', kind: 'prop', x: -6, z: 4.6, r: 1.1 },
  { id: 'palm1', kind: 'prop', x: -1.6, z: -2.6, r: 0.45 },
  { id: 'palm2', kind: 'prop', x: 2.2, z: 1.4, r: 0.45 },
  { id: 'palm3', kind: 'prop', x: -2.4, z: 3.6, r: 0.45 },
  { id: 'planter', kind: 'prop', x: 0.6, z: -5.4, r: 0.7 },
  { id: 'speaker', kind: 'prop', x: 9.4, z: 0, r: 0.6 },
  { id: 'crates', kind: 'prop', x: -9.4, z: 0.6, r: 0.65 },
];

/**
 * Where Panda chats; he faces the group, back to the middle of the terrace.
 * Waypoint 0 is the barbecue: "Hoho les merguez !". While he eats a merguez
 * there he looks around less (cfg.grillLook = look-timer speed): a safe window.
 */
export const GRILL_WAYPOINT = 0;
export const WAYPOINTS = [
  { x: -4.4, z: -2.2, lookX: -6, lookZ: -4 },
  { x: 4.4, z: -2.4, lookX: 5.6, lookZ: -4 },
  { x: 5.2, z: 2.4, lookX: 6, lookZ: 4.2 },
  { x: -4.6, z: 2.8, lookX: -6, lookZ: 4.6 },
];

export const DIFFICULTY = {
  easy: { duration: 75, maxStrikes: 3, lookEvery: [6.5, 9.5], telegraph: 1.5, look: 1.8, range: 7, half: 0.62, sweep: 0.35, spotDelay: 0.7, markerSpeed: 0.85, zone: 0.32, perfect: 0.09, missStrike: false, grillLook: 0, stars: [1, 3, 5], babarSpeed: 4.4, pandaSpeed: 1.4 },
  normal: { duration: 75, maxStrikes: 3, lookEvery: [4.5, 7], telegraph: 1.05, look: 2.2, range: 8, half: 0.72, sweep: 0.5, spotDelay: 0.38, markerSpeed: 1.2, zone: 0.24, perfect: 0.07, missStrike: false, grillLook: 0.4, stars: [1, 4, 6], babarSpeed: 4.2, pandaSpeed: 1.7 },
  hard: { duration: 75, maxStrikes: 3, lookEvery: [3, 5], telegraph: 0.72, look: 2.6, range: 9, half: 0.8, sweep: 0.6, spotDelay: 0.16, markerSpeed: 1.6, zone: 0.17, perfect: 0.05, missStrike: true, grillLook: 0.7, stars: [2, 5, 7], babarSpeed: 4, pandaSpeed: 2 },
};

export const FRONT_RANGE = 3.2;
export const FRONT_HALF = 0.6;
const CLOSE_RANGE = 1.8;
const GAG_RANGE = 1.3;
const MINI_TIMEOUT = 3.2;
const STARTLE_TIME = 1.1;
const INVULN_TIME = 2.5;
const SNITCH_COOLDOWN = 5;

/** Smallest signed difference between two angles (radians). */
export function angleDiff(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Facing angle from (ax, az) towards (bx, bz); dir = (sin a, cos a). */
export function angleTo(ax, az, bx, bz) {
  return Math.atan2(bx - ax, bz - az);
}

/** True when point b is inside the cone at p facing angle (range, half-angle). */
export function inCone(px, pz, angle, bx, bz, range, half) {
  const dx = bx - px;
  const dz = bz - pz;
  const d = Math.hypot(dx, dz);
  if (d > range) return false;
  if (d < 1e-6) return true;
  return Math.abs(angleDiff(Math.atan2(dx, dz), angle)) <= half;
}

/** True when the segment a->b crosses one of the obstacle circles (line of sight blocked). */
export function sightBlocked(ax, az, bx, bz, obstacles = OBSTACLES) {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz || 1e-9;
  for (const o of obstacles) {
    let t = ((o.x - ax) * dx + (o.z - az) * dz) / len2;
    t = Math.max(0, Math.min(1, t));
    const cx = ax + dx * t - o.x;
    const cz = az + dz * t - o.z;
    // Shrink a little so standing right next to a friend still counts as seen.
    if (t > 0.02 && t < 0.98 && cx * cx + cz * cz < (o.r * 0.9) ** 2) return true;
  }
  return false;
}

/** True when b stands behind p (facing angle) within reach. */
export function isBehind(px, pz, angle, bx, bz, reach = GAG_RANGE) {
  const dx = bx - px;
  const dz = bz - pz;
  const d = Math.hypot(dx, dz);
  if (d > reach || d < 1e-6) return false;
  const dot = (dx * Math.sin(angle) + dz * Math.cos(angle)) / d;
  return dot < -0.45;
}

/** Grades a press at marker position pos against a zone centre and widths. */
export function gradeTiming(pos, center, zoneWidth, perfectWidth) {
  const off = Math.abs(pos - center);
  if (off <= perfectWidth / 2) return 'perfect';
  if (off <= zoneWidth / 2) return 'good';
  return 'miss';
}

/** Combo multiplier: x1, x1.5, x2 ... capped at x3. */
export function comboMultiplier(combo) {
  return Math.min(3, 1 + 0.5 * Math.max(0, combo - 1));
}

/** Points for a landed gag. */
export function gagPoints(grade, combo) {
  const base = grade === 'perfect' ? 250 : grade === 'good' ? 100 : 0;
  return Math.round(base * comboMultiplier(combo));
}

/** Stars from gags landed (0 = not enough to win). */
export function starsFor(gags, mode = 'normal') {
  const [one, two, three] = (DIFFICULTY[mode] || DIFFICULTY.normal).stars;
  if (gags >= three) return 3;
  if (gags >= two) return 2;
  if (gags >= one) return 1;
  return 0;
}

/**
 * Creates the party state. random: seeded 0..1 generator.
 * step(dt, {mx, mz, press}) moves Babar (mx, mz in -1..1), press = Space/tap
 * during the timing bar, and returns this frame's
 * events (a reused array of strings): turning, looking, lookEnd, spotted,
 * miniStart, gag, miss, snitch, accomplice, merguez, timeout, won, lost.
 */
export function createPartyState({ mode = 'normal', random = Math.random } = {}) {
  const cfg = DIFFICULTY[mode] || DIFFICULTY.normal;
  const events = [];
  const rand = (a, b) => a + (b - a) * random();
  const wp0 = WAYPOINTS[0];

  const s = {
    mode,
    cfg,
    time: 0,
    over: false,
    won: false,
    strikes: 0,
    gags: 0,
    perfects: 0,
    combo: 0,
    bestCombo: 0,
    score: 0,
    suspicion: 0,
    invuln: 0,
    gagCooldown: 0,
    lastGrade: null,
    lastGag: null,
    lastPoints: 0,
    snitchId: null,
    accompliceId: null,
    snitchCooldowns: {},
    babar: { x: BABAR_START.x, z: BABAR_START.z, angle: Math.PI, moving: false, visible: false, hidden: false },
    panda: {
      x: wp0.x, z: wp0.z,
      angle: angleTo(wp0.x, wp0.z, wp0.lookX, wp0.lookZ),
      phase: 'chat', // walk | chat | startled
      timer: rand(3, 5),
      wp: 0,
      look: 'none', // none | turning | looking
      lookT: 0,
      lookAngle: 0,
      baseAngle: 0,
      lookTimer: rand(cfg.lookEvery[0], cfg.lookEvery[1]),
      eating: false,
    },
    mini: null, // {pos, dir, center, t, gag}

    remaining() {
      return Math.max(0, cfg.duration - s.time);
    },

    /** Cone Panda is currently watching with: {range, half, active}. */
    cone() {
      const p = s.panda;
      if (p.look === 'looking') return { range: cfg.range, half: cfg.half, active: true };
      return { range: FRONT_RANGE, half: FRONT_HALF, active: p.phase !== 'startled' && p.look === 'none' };
    },

    /** True when Panda can see Babar right now (ignores movement). */
    sees() {
      const p = s.panda;
      const b = s.babar;
      const c = s.cone();
      if (!c.active) return false;
      if (!inCone(p.x, p.z, p.angle, b.x, b.z, c.range, c.half)) return false;
      return !sightBlocked(p.x, p.z, b.x, b.z);
    },

    canGag() {
      const p = s.panda;
      return !s.mini && !s.over && p.look === 'none' && p.phase !== 'startled' && s.gagCooldown <= 0
        && isBehind(p.x, p.z, p.angle, s.babar.x, s.babar.z);
    },

    startLook(towardAngle = null, telegraphScale = 1) {
      const p = s.panda;
      if (p.look !== 'none') return;
      p.look = 'turning';
      p.baseAngle = p.angle;
      p.lookAngle = towardAngle ?? p.angle + Math.PI;
      p.lookT = cfg.telegraph * telegraphScale;
      events.push('turning');
    },

    /** Space / tap during the timing bar. Returns the grade or null. */
    press() {
      if (!s.mini || s.over) return null;
      const grade = gradeTiming(s.mini.pos, s.mini.center, cfg.zone, cfg.perfect);
      resolveMini(grade);
      return grade;
    },

    step(dt, move = {}) {
      events.length = 0;
      if (s.over) return events;
      s.time += dt;
      s.invuln = Math.max(0, s.invuln - dt);
      s.gagCooldown = Math.max(0, s.gagCooldown - dt);
      for (const k in s.snitchCooldowns) s.snitchCooldowns[k] = Math.max(0, s.snitchCooldowns[k] - dt);

      if (move.press && s.mini) s.press();
      if (s.mini) stepMini(dt);
      else moveBabar(dt, move.mx || 0, move.mz || 0);
      stepPanda(dt);
      detect(dt);
      if (!s.mini && s.canGag()) startMini();

      if (s.time >= cfg.duration && !s.over) {
        s.over = true;
        s.won = starsFor(s.gags, mode) > 0;
        events.push(s.won ? 'won' : 'timeout');
      }
      return events;
    },

    stars() {
      return s.won ? starsFor(s.gags, mode) : 0;
    },
  };

  function moveBabar(dt, mx, mz) {
    const b = s.babar;
    const len = Math.hypot(mx, mz);
    b.moving = len > 0.05;
    if (!b.moving) return;
    const k = Math.min(1, len) / len;
    const vx = mx * k * cfg.babarSpeed;
    const vz = mz * k * cfg.babarSpeed;
    b.x += vx * dt;
    b.z += vz * dt;
    b.angle = Math.atan2(vx, vz);
    // Push out of obstacles; bumping a snitch makes them talk.
    for (const o of OBSTACLES) {
      const dx = b.x - o.x;
      const dz = b.z - o.z;
      const d = Math.hypot(dx, dz);
      const min = o.r + BABAR_RADIUS;
      if (d < min) {
        const nx = d > 1e-6 ? dx / d : 0;
        const nz = d > 1e-6 ? dz / d : 1;
        b.x = o.x + nx * min;
        b.z = o.z + nz * min;
        if (o.snitch && !(s.snitchCooldowns[o.id] > 0)) {
          s.snitchCooldowns[o.id] = SNITCH_COOLDOWN;
          s.snitchId = o.id;
          events.push('snitch');
          const p = s.panda;
          if (p.look === 'none' && p.phase !== 'startled') s.startLook(angleTo(p.x, p.z, b.x, b.z), 0.85);
        }
      }
    }
    // Don't walk through Panda either.
    const p = s.panda;
    const pd = Math.hypot(b.x - p.x, b.z - p.z);
    const pmin = 0.75;
    if (pd < pmin && pd > 1e-6) {
      b.x = p.x + ((b.x - p.x) / pd) * pmin;
      b.z = p.z + ((b.z - p.z) / pd) * pmin;
    }
    b.x = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, b.x));
    b.z = Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, b.z));
  }

  function turnToward(target, rate, dt) {
    const p = s.panda;
    const d = angleDiff(target, p.angle);
    const stepA = rate * dt;
    p.angle += Math.abs(d) <= stepA ? d : Math.sign(d) * stepA;
  }

  function stepPanda(dt) {
    const p = s.panda;
    if (s.mini) return; // he is busy chatting, oblivious
    if (p.phase === 'startled') {
      p.timer -= dt;
      if (p.timer <= 0) pickWaypoint();
      return;
    }
    // Look-around overlay
    p.eating = p.phase === 'chat' && p.wp === GRILL_WAYPOINT;
    if (p.look === 'none') {
      p.lookTimer -= dt * (p.eating ? cfg.grillLook : 1);
      if (p.lookTimer <= 0) s.startLook();
    }
    if (p.look === 'turning') {
      p.lookT -= dt;
      const total = cfg.telegraph;
      const k = Math.max(0, Math.min(1, 1 - p.lookT / total));
      // The head starts turning slowly: only 25% of the way during the telegraph.
      p.angle = p.baseAngle + angleDiff(p.lookAngle, p.baseAngle) * k * 0.25;
      if (p.lookT <= 0) {
        p.look = 'looking';
        p.lookT = cfg.look;
        p.angle = p.lookAngle;
        events.push('looking');
      }
      return;
    }
    if (p.look === 'looking') {
      p.lookT -= dt;
      const t = cfg.look - p.lookT;
      p.angle = p.lookAngle + Math.sin(t * 2.6) * cfg.sweep;
      if (p.lookT <= 0) {
        p.look = 'none';
        p.lookTimer = rand(cfg.lookEvery[0], cfg.lookEvery[1]);
        events.push('lookEnd');
        // Back to the friends he was talking to.
        if (p.phase === 'chat') {
          const w = WAYPOINTS[p.wp];
          p.angle = angleTo(p.x, p.z, w.lookX, w.lookZ);
        }
      }
      return;
    }
    if (p.phase === 'walk') {
      const w = WAYPOINTS[p.wp];
      const dx = w.x - p.x;
      const dz = w.z - p.z;
      const d = Math.hypot(dx, dz);
      const stepD = cfg.pandaSpeed * dt;
      turnToward(Math.atan2(dx, dz), 6, dt);
      if (d <= stepD) {
        p.x = w.x; p.z = w.z;
        p.phase = 'chat';
        p.timer = p.wp === GRILL_WAYPOINT ? rand(6, 8) : rand(4, 7);
        if (p.wp === GRILL_WAYPOINT) events.push('merguez');
      } else {
        p.x += (dx / d) * stepD;
        p.z += (dz / d) * stepD;
      }
    } else if (p.phase === 'chat') {
      const w = WAYPOINTS[p.wp];
      turnToward(angleTo(p.x, p.z, w.lookX, w.lookZ), 4, dt);
      p.timer -= dt;
      if (p.timer <= 0) pickWaypoint();
    }
  }

  function pickWaypoint() {
    const p = s.panda;
    let next = Math.floor(random() * (WAYPOINTS.length - 1));
    if (next >= p.wp) next++;
    p.wp = next;
    p.phase = 'walk';
  }

  function detect(dt) {
    const b = s.babar;
    const p = s.panda;
    const c = s.cone();
    b.visible = s.sees();
    b.hidden = !b.visible;
    if (s.invuln > 0 || s.mini || !c.active) {
      s.suspicion = Math.max(0, s.suspicion - dt * 1.5);
      return;
    }
    const close = Math.hypot(b.x - p.x, b.z - p.z) < CLOSE_RANGE;
    if (b.visible && (b.moving || close)) {
      s.suspicion += dt / cfg.spotDelay;
    } else {
      s.suspicion = Math.max(0, s.suspicion - dt * 1.5);
    }
    if (s.suspicion >= 1) spotted();
  }

  function spotted() {
    const p = s.panda;
    s.suspicion = 0;
    s.strikes++;
    s.combo = 0;
    s.invuln = INVULN_TIME;
    p.look = 'none';
    p.lookTimer = rand(cfg.lookEvery[0], cfg.lookEvery[1]) + 1;
    events.push('spotted');
    if (s.strikes >= cfg.maxStrikes) {
      s.over = true;
      s.won = false;
      events.push('lost');
    }
  }

  function startMini() {
    s.mini = {
      pos: 0,
      dir: 1,
      center: rand(0.3, 0.75),
      t: 0,
      gag: random() < 0.5 ? 'lighter' : 'spit',
    };
    s.babar.moving = false;
    events.push('miniStart');
  }

  function stepMini(dt) {
    const m = s.mini;
    m.t += dt;
    m.pos += m.dir * cfg.markerSpeed * dt;
    if (m.pos >= 1) { m.pos = 2 - m.pos; m.dir = -1; }
    if (m.pos <= 0) { m.pos = -m.pos; m.dir = 1; }
    if (m.t >= MINI_TIMEOUT) resolveMini('miss');
  }

  function resolveMini(grade) {
    const m = s.mini;
    const p = s.panda;
    s.mini = null;
    s.lastGrade = grade;
    s.lastGag = m.gag;
    if (grade === 'miss') {
      s.combo = 0;
      s.lastPoints = 0;
      s.gagCooldown = 1.5;
      events.push('miss');
      // Panda felt something: he turns round, fast.
      s.startLook(angleTo(p.x, p.z, s.babar.x, s.babar.z), 0.7);
      if (cfg.missStrike) {
        s.strikes++;
        s.invuln = 0.8;
        events.push('spotted');
        if (s.strikes >= cfg.maxStrikes) { s.over = true; s.won = false; events.push('lost'); }
      }
      return;
    }
    s.gags++;
    s.combo++;
    s.bestCombo = Math.max(s.bestCombo, s.combo);
    if (grade === 'perfect') s.perfects++;
    s.lastPoints = gagPoints(grade, s.combo);
    s.score += s.lastPoints;
    s.gagCooldown = 2.2;
    p.phase = 'startled';
    p.timer = STARTLE_TIME;
    p.look = 'none';
    p.lookTimer = Math.max(p.lookTimer, 3);
    const acc = OBSTACLES.filter((o) => o.accomplice);
    s.accompliceId = acc[Math.floor(random() * acc.length)].id;
    events.push('gag', 'accomplice');
  }

  return s;
}
