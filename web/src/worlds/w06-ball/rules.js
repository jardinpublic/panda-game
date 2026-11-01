// World 6 rules, no rendering: Panda the "wild creature" dodges Mamar's
// blue-and-white balls in a round arena. Throw patterns, sandwich breaks,
// Babar's slippery spit, Cous's guinea-pig decoys, the capture struggle,
// score and stars. Unit-tested in test/w06-ball.test.js.
//
// Coordinates: the arena is the (x, z) plane, centre (0, 0), radius ARENA_R.
// Mamar walks the far rim (z < 0), facing the camera.

export const ARENA_R = 9;
export const PANDA_R = 0.42;
export const BALL_R = 0.42;
export const GIANT_R = 1.5;
export const MOVE_SPEED = 6.2;
export const DASH_SPEED = 17;
export const DASH_TIME = 0.2;
export const PICK_R = 0.95;
export const MAMAR_RIM = ARENA_R + 1.4;
export const BABAR_POS = { x: -(ARENA_R + 1.6), z: 0.5 };
export const COUS_POS = { x: ARENA_R + 1.6, z: 0.5 };

/** Tall grass patches: hiding in one makes Mamar's aim sloppy. */
export const GRASS = [
  { x: -4.6, z: -2.6, r: 1.7 },
  { x: 4.2, z: 3.1, r: 1.9 },
  { x: 3.8, z: -4.4, r: 1.5 },
  { x: -3.6, z: 4.2, r: 1.6 },
  { x: -0.4, z: -6.2, r: 1.3 },
];

/** Tuning per difficulty. Mash numbers: meter gain per tap and decay per second. */
export const MODES = {
  easy: {
    duration: 60, interval: 2.1, ballSpeed: 6.2, windup: 0.75, spreadN: 3, rapidN: 2,
    mashStart: 0.35, mashGain: 0.15, mashDecay: 0.18, struggleTime: 4.2,
    dashCd: 1.0, invuln: 2.4, maxCaptures: 3,
    breakEvery: 15, breakLength: 5.5, hohoEvery: 1.8, spitEvery: 16, decoyEvery: 10,
  },
  normal: {
    duration: 75, interval: 1.55, ballSpeed: 7.8, windup: 0.6, spreadN: 5, rapidN: 3,
    mashStart: 0.3, mashGain: 0.11, mashDecay: 0.28, struggleTime: 3.3,
    dashCd: 1.4, invuln: 1.9, maxCaptures: 3,
    breakEvery: 18, breakLength: 4.5, hohoEvery: 2.2, spitEvery: 11, decoyEvery: 13,
  },
  hard: {
    duration: 95, interval: 1.15, ballSpeed: 9.4, windup: 0.45, spreadN: 7, rapidN: 4,
    mashStart: 0.25, mashGain: 0.09, mashDecay: 0.34, struggleTime: 2.8,
    dashCd: 1.8, invuln: 1.4, maxCaptures: 3,
    breakEvery: 22, breakLength: 3.6, hohoEvery: 2.6, spitEvery: 8, decoyEvery: 16,
  },
};

/** Removes dead entities in place (no allocation). */
function compact(list) {
  let j = 0;
  for (let i = 0; i < list.length; i++) if (!list[i].dead) list[j++] = list[i];
  list.length = j;
}

/** Attack kinds unlocked as the run progresses (0..1). */
export function attackPool(progress) {
  const pool = ['aimed'];
  if (progress > 0.1) pool.push('spread');
  if (progress > 0.22) pool.push('rapid');
  if (progress > 0.33) pool.push('bounce');
  if (progress > 0.48) pool.push('giant');
  return pool;
}

/** Seconds between two throws: shrinks by 45% over the run. */
export function attackInterval(cfg, progress) {
  return cfg.interval * (1 - 0.45 * Math.min(1, progress));
}

/** 3 stars: never captured and half the Hoho stars; 2: at most one capture and a quarter. */
export function starsFor({ captures, hohos, hohoSpawned }) {
  const ratio = hohoSpawned > 0 ? hohos / hohoSpawned : 0;
  if (captures === 0 && ratio >= 0.5) return 3;
  if (captures <= 1 && ratio >= 0.25) return 2;
  return 1;
}

export function scoreFor({ hohos, survived, nearMisses, escapes, merguez = 0 }) {
  return hohos * 10 + Math.floor(survived) * 2 + nearMisses * 5 + escapes * 10 + merguez * 25;
}

/**
 * Creates the game state. random: seeded 0..1 generator (ctx.random).
 * Call step(dt, {mx, mz, dash, mash}) every frame: mx/mz is the wanted
 * direction (length <= 1), dash a one-frame press, mash the number of
 * taps/presses this frame (only used while captured).
 * Entities removed from balls/items/puddles/decoys get dead = true.
 */
export function createBallGame({ mode = 'normal', random = Math.random } = {}) {
  const cfg = MODES[mode] || MODES.normal;
  let nextId = 1;
  const ev = {};
  function resetEvents() {
    ev.windup = null; ev.fired = 0; ev.hit = false; ev.shieldPop = false; ev.freed = false; ev.captured = false;
    ev.dashed = false; ev.hoho = 0; ev.bonus = null; ev.nearMiss = 0; ev.bounced = 0;
    ev.breakStart = false; ev.breakEnd = false; ev.spit = null; ev.decoy = null; ev.decoyCaught = 0;
    ev.won = false; ev.lost = false;
  }
  resetEvents();

  const s = {
    cfg, mode, time: 0, duration: cfg.duration,
    x: 0, z: 2, vx: 0, vz: 0, fx: 0, fz: -1,
    dashTime: 0, dashCd: 0, invuln: 1.5, shield: 0,
    balls: [], items: [], puddles: [], decoys: [],
    struggle: null,
    captures: 0, escapes: 0, hohos: 0, hohoSpawned: 0, nearMisses: 0, merguez: 0,
    attackTimer: 2, windup: null, rapidLeft: 0, rapidTimer: 0, lastKind: '',
    mamarA: -Math.PI / 2, mamarDir: 1,
    breakLeft: 0, nextBreak: cfg.breakEvery,
    hohoTimer: 1, spitTimer: cfg.spitEvery * 0.8, decoyTimer: cfg.decoyEvery * 0.8,
    over: false, won: false,
    events: ev,

    progress() { return Math.min(1, s.time / s.duration); },
    mamarPos() { return { x: Math.cos(s.mamarA) * MAMAR_RIM, z: Math.sin(s.mamarA) * MAMAR_RIM }; },
    inGrass() { return GRASS.some((g) => Math.hypot(s.x - g.x, s.z - g.z) < g.r); },
    onPuddle() { return s.puddles.some((p) => p.landIn <= 0 && Math.hypot(s.x - p.x, s.z - p.z) < p.r); },
    onBreak() { return s.breakLeft > 0; },
    score() { return scoreFor({ hohos: s.hohos, survived: Math.min(s.time, s.duration), nearMisses: s.nearMisses, escapes: s.escapes, merguez: s.merguez }); },
    stars() { return starsFor(s); },

    /** Where an aimed throw goes: a guinea-pig decoy if one runs, else Panda (sloppy in tall grass). */
    aimTarget() {
      const decoy = s.decoys.find((d) => !d.dead);
      if (decoy) return { x: decoy.x, z: decoy.z };
      if (s.inGrass()) return { x: s.x + (random() - 0.5) * 4, z: s.z + (random() - 0.5) * 4 };
      return { x: s.x, z: s.z };
    },

    addBall(kind, angle, speed, extra = {}) {
      const m = s.mamarPos();
      const ball = {
        id: nextId++, kind, x: m.x, z: m.z, y: 1.4,
        vx: Math.cos(angle) * speed, vz: Math.sin(angle) * speed, vy: 0,
        r: kind === 'giant' ? GIANT_R : BALL_R, bounces: kind === 'bounce' ? 3 : 0,
        life: 0, close: false, counted: false, dead: false, ...extra,
      };
      if (kind === 'giant') ball.y = GIANT_R;
      if (kind === 'bounce') ball.vy = 6;
      s.balls.push(ball);
      ev.fired++;
      return ball;
    },

    fire(kind) {
      const m = s.mamarPos();
      const tgt = s.aimTarget();
      const base = Math.atan2(tgt.z - m.z, tgt.x - m.x);
      const speed = cfg.ballSpeed * (1 + 0.3 * s.progress());
      if (kind === 'spread') {
        const n = cfg.spreadN;
        for (let i = 0; i < n; i++) s.addBall('spread', base + (i - (n - 1) / 2) * 0.2, speed * 0.9);
      } else if (kind === 'bounce') {
        s.addBall('bounce', base + (random() - 0.5) * 0.6, speed * 0.85);
      } else if (kind === 'giant') {
        s.addBall('giant', base, speed * 0.42);
      } else {
        s.addBall(kind === 'rapid' ? 'rapid' : 'aimed', base, speed);
        if (kind === 'rapid') { s.rapidLeft = cfg.rapidN - 1; s.rapidTimer = 0.3; }
      }
    },

    pickKind() {
      const pool = attackPool(s.progress());
      let kind = pool[Math.floor(random() * pool.length)];
      if (kind === 'giant' && s.lastKind === 'giant') kind = 'aimed';
      s.lastKind = kind;
      return kind;
    },

    spawnItem(kind, x, z, life = 7) {
      const it = { id: nextId++, kind, x, z, life, dead: false };
      if (kind === 'hoho') s.hohoSpawned++;
      s.items.push(it);
      return it;
    },

    randomSpot(radius) {
      const r = Math.sqrt(random()) * radius;
      const a = random() * Math.PI * 2;
      return { x: Math.cos(a) * r, z: Math.sin(a) * r };
    },

    startBreak() {
      s.breakLeft = cfg.breakLength;
      s.nextBreak += cfg.breakEvery + cfg.breakLength;
      ev.breakStart = true;
      for (let i = 0; i < 5; i++) {
        const p = s.randomSpot(7);
        s.spawnItem('hoho', p.x, p.z, cfg.breakLength + 1);
      }
      const p = s.randomSpot(6);
      s.spawnItem(s.captures > 0 ? 'heart' : 'shield', p.x, p.z, cfg.breakLength + 1);
      const q = s.randomSpot(6.5);
      s.spawnItem('merguez', q.x, q.z, cfg.breakLength + 1);
    },

    /** Removes balls near Panda (after a struggle, so he is not hit on release). */
    clearAround(radius) {
      for (const b of s.balls) if (Math.hypot(b.x - s.x, b.z - s.z) < radius + b.r) b.dead = true;
    },

    hitBy(ball) {
      ball.dead = true;
      if (s.shield > 0) {
        s.shield = 0;
        s.invuln = 0.8;
        ev.shieldPop = true;
        return;
      }
      // Every earlier hit makes the ball grip harder (faster decay).
      const grip = 1 + 0.2 * (s.escapes + s.captures);
      s.struggle = { meter: cfg.mashStart, time: cfg.struggleTime, total: cfg.struggleTime, decay: cfg.mashDecay * grip };
      s.vx = 0; s.vz = 0;
      s.windup = null;
      s.rapidLeft = 0;
      ev.hit = true;
    },

    /** Advances one frame and returns the shared events object. */
    step(dt, inp = {}) {
      resetEvents();
      if (s.over) return ev;
      s.time += dt;
      s.dashCd = Math.max(0, s.dashCd - dt);
      s.invuln = Math.max(0, s.invuln - dt);
      s.shield = Math.max(0, s.shield - dt);

      if (s.struggle) {
        const st = s.struggle;
        st.time -= dt;
        st.meter = Math.max(0, Math.min(1, st.meter - st.decay * dt + (inp.mash || 0) * cfg.mashGain));
        if (st.meter >= 1) {
          s.struggle = null;
          s.escapes++;
          s.invuln = cfg.invuln;
          s.clearAround(3.5);
          s.attackTimer = Math.max(s.attackTimer, 1);
          ev.freed = true;
        } else if (st.time <= 0) {
          s.struggle = null;
          s.captures++;
          s.invuln = cfg.invuln + 0.6;
          s.clearAround(4.5);
          s.attackTimer = Math.max(s.attackTimer, 1.4);
          ev.captured = true;
          if (s.captures >= cfg.maxCaptures) { s.over = true; s.won = false; ev.lost = true; return ev; }
        }
      } else {
        s.move(dt, inp);
      }

      s.updateAttacks(dt);
      s.updateBalls(dt);
      s.updateItems(dt);
      s.updateHazards(dt);

      if (!s.over && s.time >= s.duration && !s.struggle) {
        s.over = true;
        s.won = true;
        ev.won = true;
      }
      return ev;
    },

    move(dt, inp) {
      let mx = inp.mx || 0;
      let mz = inp.mz || 0;
      const len = Math.hypot(mx, mz);
      if (len > 1) { mx /= len; mz /= len; }
      if (len > 0.1) { const f = Math.hypot(mx, mz); s.fx = mx / f; s.fz = mz / f; }
      if (inp.dash && s.dashCd <= 0) {
        s.dashTime = DASH_TIME;
        s.dashCd = cfg.dashCd;
        s.invuln = Math.max(s.invuln, DASH_TIME + 0.18);
        s.vx = s.fx * DASH_SPEED;
        s.vz = s.fz * DASH_SPEED;
        ev.dashed = true;
      }
      if (s.dashTime > 0) {
        s.dashTime -= dt;
      } else {
        const accel = s.onPuddle() ? 1.4 : 14;
        const k = Math.min(1, accel * dt);
        s.vx += (mx * MOVE_SPEED - s.vx) * k;
        s.vz += (mz * MOVE_SPEED - s.vz) * k;
      }
      s.x += s.vx * dt;
      s.z += s.vz * dt;
      const d = Math.hypot(s.x, s.z);
      const max = ARENA_R - 0.5;
      if (d > max) {
        s.x *= max / d;
        s.z *= max / d;
        // Remove the outward part of the velocity (slide along the fence).
        const nx = s.x / max;
        const nz = s.z / max;
        const out = s.vx * nx + s.vz * nz;
        if (out > 0) { s.vx -= out * nx; s.vz -= out * nz; }
      }
    },

    updateAttacks(dt) {
      if (s.struggle) return;
      if (s.breakLeft > 0) {
        s.breakLeft -= dt;
        if (s.breakLeft <= 0) { s.breakLeft = 0; ev.breakEnd = true; s.attackTimer = 1.2; }
        return;
      }
      if (s.time >= s.nextBreak && !s.windup && s.rapidLeft === 0 && s.time < s.duration - 4) {
        s.startBreak();
        return;
      }
      if (s.windup) {
        s.windup.t -= dt;
        if (s.windup.t <= 0) { s.fire(s.windup.kind); s.windup = null; }
        return;
      }
      if (s.rapidLeft > 0) {
        s.rapidTimer -= dt;
        if (s.rapidTimer <= 0) { s.fire('aimed'); s.rapidLeft--; s.rapidTimer = 0.3; }
        return;
      }
      // Mamar strolls along the far rim between throws.
      s.mamarA += s.mamarDir * 0.45 * dt;
      if (s.mamarA > -0.2 * Math.PI) { s.mamarA = -0.2 * Math.PI; s.mamarDir = -1; }
      if (s.mamarA < -0.8 * Math.PI) { s.mamarA = -0.8 * Math.PI; s.mamarDir = 1; }
      s.attackTimer -= dt;
      if (s.attackTimer <= 0) {
        const kind = s.pickKind();
        s.windup = { kind, t: cfg.windup * (kind === 'giant' ? 1.4 : 1) };
        s.attackTimer = attackInterval(cfg, s.progress()) + (kind === 'giant' || kind === 'spread' ? 0.5 : 0);
        if (random() < 0.4) s.mamarDir = -s.mamarDir;
        ev.windup = kind;
      }
    },

    updateBalls(dt) {
      for (const b of s.balls) {
        if (b.dead) continue;
        b.life += dt;
        b.x += b.vx * dt;
        b.z += b.vz * dt;
        if (b.kind === 'bounce') {
          b.vy -= 22 * dt;
          b.y += b.vy * dt;
          if (b.y < BALL_R) { b.y = BALL_R; b.vy = Math.abs(b.vy) < 3 ? 7 : Math.abs(b.vy) * 0.9; }
        } else if (b.kind !== 'giant') {
          b.y = Math.max(BALL_R + 0.1, b.y - dt * 1.2);
        }
        const d = Math.hypot(b.x, b.z);
        const outward = b.vx * b.x + b.vz * b.z > 0;
        if (b.bounces > 0 && d > ARENA_R - 0.2 && outward) {
          const nx = b.x / d;
          const nz = b.z / d;
          const dot = b.vx * nx + b.vz * nz;
          b.vx -= 2 * dot * nx;
          b.vz -= 2 * dot * nz;
          b.bounces--;
          ev.bounced++;
        } else if ((d > ARENA_R + 2.5 && outward) || b.life > 14) {
          b.dead = true;
          continue;
        }
        // Decoys swallow balls.
        for (const g of s.decoys) {
          if (!g.dead && Math.hypot(b.x - g.x, b.z - g.z) < b.r + 0.4) {
            g.dead = true;
            b.dead = true;
            ev.decoyCaught++;
            break;
          }
        }
        if (b.dead) continue;
        const dist = Math.hypot(b.x - s.x, b.z - s.z);
        if (!s.struggle && dist < b.r + PANDA_R) {
          if (s.invuln > 0) { b.close = true; continue; }
          s.hitBy(b);
          continue;
        }
        if (dist < b.r + PANDA_R + 0.8) b.close = true;
        else if (b.close && !b.counted && dist > b.r + PANDA_R + 1.4 && !s.struggle) {
          b.counted = true;
          s.nearMisses++;
          ev.nearMiss++;
        }
      }
      compact(s.balls);
    },

    updateItems(dt) {
      if (s.breakLeft <= 0 && s.time < s.duration) {
        s.hohoTimer -= dt;
        if (s.hohoTimer <= 0) {
          const p = s.randomSpot(7.5);
          s.spawnItem('hoho', p.x, p.z);
          s.hohoTimer = cfg.hohoEvery;
        }
      }
      for (const it of s.items) {
        if (it.dead) continue;
        it.life -= dt;
        if (it.life <= 0) { it.dead = true; continue; }
        if (s.struggle || Math.hypot(it.x - s.x, it.z - s.z) > PICK_R) continue;
        it.dead = true;
        if (it.kind === 'hoho') { s.hohos++; ev.hoho++; }
        else {
          ev.bonus = it.kind;
          if (it.kind === 'heart') s.captures = Math.max(0, s.captures - 1);
          if (it.kind === 'shield') s.shield = 12;
          if (it.kind === 'merguez') { s.merguez++; s.invuln = Math.max(s.invuln, 3); }
        }
      }
      compact(s.items);
    },

    updateHazards(dt) {
      // Babar spits a slippery puddle near Panda.
      s.spitTimer -= dt;
      if (s.spitTimer <= 0 && !s.struggle && s.breakLeft <= 0) {
        s.spitTimer = cfg.spitEvery;
        const a = random() * Math.PI * 2;
        const r = random() * 2.2;
        let px = s.x + Math.cos(a) * r;
        let pz = s.z + Math.sin(a) * r;
        const d = Math.hypot(px, pz);
        if (d > ARENA_R - 1.5) { px *= (ARENA_R - 1.5) / d; pz *= (ARENA_R - 1.5) / d; }
        const puddle = { id: nextId++, x: px, z: pz, r: 1.6, landIn: 0.9, life: 7, dead: false };
        s.puddles.push(puddle);
        ev.spit = puddle;
      }
      for (const p of s.puddles) {
        if (p.landIn > 0) { p.landIn -= dt; continue; }
        p.life -= dt;
        if (p.life <= 0) p.dead = true;
      }
      compact(s.puddles);

      // Cous lets a guinea pig loose: Mamar aims at it instead of Panda.
      s.decoyTimer -= dt;
      if (s.decoyTimer <= 0 && !s.decoys.length) {
        s.decoyTimer = cfg.decoyEvery;
        const a = Math.PI + (random() - 0.5) * 1.2;
        const decoy = { id: nextId++, x: COUS_POS.x - 1.5, z: COUS_POS.z, vx: Math.cos(a) * 3.4, vz: Math.sin(a) * 3.4, life: 6, turn: 0.8, dead: false };
        s.decoys.push(decoy);
        ev.decoy = decoy;
      }
      for (const g of s.decoys) {
        if (g.dead) continue;
        g.life -= dt;
        if (g.life <= 0) { g.dead = true; continue; }
        g.turn -= dt;
        if (g.turn <= 0) {
          const a = random() * Math.PI * 2;
          g.vx = Math.cos(a) * 3.4;
          g.vz = Math.sin(a) * 3.4;
          g.turn = 0.6 + random() * 0.8;
        }
        g.x += g.vx * dt;
        g.z += g.vz * dt;
        const d = Math.hypot(g.x, g.z);
        if (d > 7.5) { g.x *= 7.5 / d; g.z *= 7.5 / d; g.vx = -g.vx; g.vz = -g.vz; }
      }
      compact(s.decoys);
    },
  };
  return s;
}
