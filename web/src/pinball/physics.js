// Pinball physics: one or more balls against static segments, round bumpers
// and rotating flippers. Pure functions and plain objects (no DOM), so it is
// unit-tested in Node. Units: logical table pixels and seconds; y points down.

export const BALL_R = 9;
export const GRAVITY = 1050; // the table's slope, pulling the ball down
export const MAX_SPEED = 2100;
export const SUBSTEPS = 10;

let rand = Math.random;
/** Sets the random source for kick jitter (seeded in tests). */
export function setRandom(fn) {
  rand = fn;
}

/** A wall from (x1, y1) to (x2, y2). e: bounciness. kick: extra push along the normal (slingshots). */
export function seg(x1, y1, x2, y2, opts = {}) {
  return { type: 'seg', x1, y1, x2, y2, e: 0.45, kick: 0, active: true, oneWay: null, ...opts };
}

/** A round obstacle (pop bumper, post, moving target). */
export function circle(x, y, r, opts = {}) {
  return { type: 'circle', x, y, r, e: 0.6, kick: 0, active: true, ...opts };
}

/** Walls along an arc, centre (cx, cy), radius r, from angle a0 to a1 (radians), n pieces. */
export function arc(cx, cy, r, a0, a1, n, opts = {}) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t0 = a0 + ((a1 - a0) * i) / n;
    const t1 = a0 + ((a1 - a0) * (i + 1)) / n;
    out.push(seg(cx + Math.cos(t0) * r, cy + Math.sin(t0) * r, cx + Math.cos(t1) * r, cy + Math.sin(t1) * r, opts));
  }
  return out;
}

/**
 * A flipper: pivot (x, y), length, resting and raised angles (radians, 0 =
 * pointing right, positive = down). side: 'left' | 'right'.
 */
export function flipper(x, y, length, rest, up, side) {
  return { type: 'flipper', x, y, length, rest, up, side, angle: rest, w: 0, pressed: false, r0: 10, r1: 5 };
}

export function ball(x, y, vx = 0, vy = 0) {
  return { x, y, vx, vy, r: BALL_R, alive: true, still: 0, held: null, inside: new Set(), id: Math.random() };
}

/**
 * An invisible zone the ball passes through: a rectangle (x, y, w, h) or a
 * circle (x, y, r). dir: optional, only counts balls moving that way ('up' | 'down').
 */
export function sensor(tag, shape, opts = {}) {
  return { tag, ...shape, dir: null, ...opts };
}

function insideSensor(b, s) {
  if (s.r != null) return Math.hypot(b.x - s.x, b.y - s.y) < s.r;
  return b.x >= s.x && b.x <= s.x + s.w && b.y >= s.y && b.y <= s.y + s.h;
}

const FLIP_SPEED = 26; // rad/s while moving up
const FALL_SPEED = 14; // rad/s while falling back

/** Moves a flipper toward up (pressed) or rest, and records its angular velocity. */
export function stepFlipper(f, dt) {
  const target = f.pressed ? f.up : f.rest;
  const speed = f.pressed ? FLIP_SPEED : FALL_SPEED;
  const prev = f.angle;
  const diff = target - f.angle;
  const step = Math.sign(diff) * Math.min(Math.abs(diff), speed * dt);
  f.angle += step;
  f.w = (f.angle - prev) / dt;
}

export function flipperTip(f) {
  return { x: f.x + Math.cos(f.angle) * f.length, y: f.y + Math.sin(f.angle) * f.length };
}

/** Closest point to (px, py) on segment a-b, and the position t along it. */
function closest(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return { x: ax + dx * t, y: ay + dy * t, t };
}

/**
 * Pushes the ball out of a contact and bounces it. (cx, cy): contact point,
 * reach: distance at which they touch, sv: the surface velocity there.
 * Returns the impact speed (0 if no contact).
 */
function resolve(b, cx, cy, reach, e, kick, svx = 0, svy = 0) {
  let nx = b.x - cx;
  let ny = b.y - cy;
  const d = Math.hypot(nx, ny);
  if (d >= reach || d === 0) return 0;
  nx /= d;
  ny /= d;
  b.x = cx + nx * reach;
  b.y = cy + ny * reach;
  const rvx = b.vx - svx;
  const rvy = b.vy - svy;
  const vn = rvx * nx + rvy * ny;
  if (vn >= 0) return 0;
  // Hard hits bounce a little less (rubber and wood soak up big impacts).
  const eff = e / (1 + 0.00025 * -vn);
  const j = -(1 + eff) * vn;
  // Kicks vary by +-7% so no shot repeats exactly.
  const k = kick ? kick * (0.93 + rand() * 0.14) : 0;
  b.vx += nx * (j + k);
  b.vy += ny * (j + k);
  return -vn;
}

/** Collides a ball with one body. Returns the impact speed, or 0. */
export function collide(b, body) {
  if (body.active === false) return 0;
  if (body.type === 'seg') {
    if (body.oneWay) {
      // Only blocks balls moving against (nx, ny), e.g. a lane gate.
      const [nx, ny] = body.oneWay;
      if (b.vx * nx + b.vy * ny > 0) return 0;
    }
    const p = closest(b.x, b.y, body.x1, body.y1, body.x2, body.y2);
    return resolve(b, p.x, p.y, b.r + (body.thick || 2), body.e, body.kick);
  }
  if (body.type === 'circle') {
    return resolve(b, body.x, body.y, b.r + body.r, body.e, body.kick, body.vx || 0, body.vy || 0);
  }
  if (body.type === 'flipper') {
    const tip = flipperTip(body);
    const p = closest(b.x, b.y, body.x, body.y, tip.x, tip.y);
    const thick = body.r0 + (body.r1 - body.r0) * p.t;
    // Surface velocity of the flipper at the contact point: w x r.
    const rx = p.x - body.x;
    const ry = p.y - body.y;
    const svx = -body.w * ry;
    const svy = body.w * rx;
    return resolve(b, p.x, p.y, b.r + thick, 0.3, 0, svx, svy);
  }
  return 0;
}

function capSpeed(b) {
  const s = Math.hypot(b.vx, b.vy);
  if (s > MAX_SPEED) {
    b.vx *= MAX_SPEED / s;
    b.vy *= MAX_SPEED / s;
  }
}

/**
 * Advances the world by dt. world: {balls, bodies, flippers}. onHit(ball, body,
 * speed) is called for every contact with a body that has a `tag`.
 */
export function step(world, dt, onHit = () => {}, onSensor = () => {}) {
  const h = dt / SUBSTEPS;
  for (let s = 0; s < SUBSTEPS; s++) {
    for (const f of world.flippers) stepFlipper(f, h);
    for (const b of world.balls) {
      if (!b.alive || b.held) continue;
      b.vy += GRAVITY * h;
      capSpeed(b);
      b.x += b.vx * h;
      b.y += b.vy * h;
      for (const body of world.bodies) {
        const hit = collide(b, body);
        if (hit && body.tag) onHit(b, body, hit);
      }
      for (const f of world.flippers) {
        const hit = collide(b, f);
        if (hit) onHit(b, f, hit);
      }
      // Sensors fire once when the ball enters them (checked every substep, so fast balls never skip one).
      for (const zone of world.sensors || []) {
        const inside = insideSensor(b, zone);
        const was = b.inside.has(zone);
        if (inside && !was) {
          b.inside.add(zone);
          const goingUp = b.vy < 0;
          if (!zone.dir || (zone.dir === 'up') === goingUp) onSensor(b, zone);
        } else if (!inside && was) b.inside.delete(zone);
        if (b.held) break;
      }
      if (b.held) continue;
    }
  }
  // Balls that barely move for a while get a nudge (never stuck forever).
  for (const b of world.balls) {
    if (!b.alive || b.held) continue;
    const sp = Math.hypot(b.vx, b.vy);
    b.still = sp < 25 ? b.still + dt : 0;
  }
}
